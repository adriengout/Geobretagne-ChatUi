import { readFileSync } from 'fs';
import { join } from 'path';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

for (const key of ['BASE_URL', 'API_KEY', 'MODEL'] as const) {
  if (!process.env[key]) throw new Error(`Variable d'environnement manquante : ${key}`);
}

const BASE_URL = process.env.BASE_URL!;
const API_KEY = process.env.API_KEY!;
const MODEL = process.env.MODEL!;
const MCP_URL = process.env.MCP_URL || '';
const PORT = Number(process.env.PORT ?? 3000);
const SYSTEM_PROMPT = (() => {
  try {
    return readFileSync(join(import.meta.dirname, '..', 'config', 'system-prompt.md'), 'utf-8').trim();
  } catch {
    return process.env.SYSTEM_PROMPT ?? '';
  }
})();

const MAX_MESSAGES = 50;
const MAX_BODY_BYTES = 100_000;

/**
 * Correctifs de compatibilité vLLM appliqués sur chaque requête POST vers le LLM.
 * Ne touche jamais au flux de réponse streaming.
 */
async function vllmFixerFetch(
  url: Parameters<typeof fetch>[0],
  options?: Parameters<typeof fetch>[1],
) {
  if (options?.method === 'POST' && options.body != null) {
    try {
      let bodyStr: string;
      if (typeof options.body === 'string') {
        bodyStr = options.body;
      } else if (options.body instanceof Uint8Array) {
        bodyStr = new TextDecoder().decode(options.body);
      } else {
        bodyStr = String(options.body);
      }
      const body = JSON.parse(bodyStr);

      // Fix 1 : vLLM ignore les outils si tool_choice est absent — toujours l'expliciter.
      if (Array.isArray(body.tools) && body.tools.length > 0) {
        body.tool_choice = 'auto';
      } else {
        delete body.tool_choice;
      }

      if (Array.isArray(body.messages)) {
        body.messages = body.messages.map((m: any) => {
          // Fix 2 : vLLM crash si assistant avec tool_calls a content: "" au lieu de null.
          if (m.role === 'assistant' && m.tool_calls?.length > 0) {
            return { ...m, content: m.content || null };
          }

          // Fix 3 : vLLM attend une chaîne simple comme contenu des messages tool.
          // Le SDK v6 sérialise le résultat MCP en JSON : "[{type,text}]" ou "{content:[...]}"
          if (m.role === 'tool') {
            let content = m.content;
            if (Array.isArray(content)) {
              content = content
                .filter((c: any) => c?.type === 'text')
                .map((c: any) => String(c.text ?? ''))
                .join('\n') || JSON.stringify(content);
            }
            if (typeof content === 'string') {
              try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                  // "[{type,text}]"
                  content = parsed
                    .filter((c: any) => c?.type === 'text')
                    .map((c: any) => String(c.text ?? ''))
                    .join('\n') || content;
                } else if (Array.isArray(parsed?.content)) {
                  // "{content:[{type,text}]}"
                  content = parsed.content
                    .filter((c: any) => c?.type === 'text')
                    .map((c: any) => String(c.text ?? ''))
                    .join('\n') || content;
                }
              } catch { /* pas du JSON, on garde tel quel */ }
            }
            return { ...m, content };
          }

          return m;
        });
      }

      const roles = (body.messages ?? []).map((m: any) => m.role).join(',');
      console.log(`[vllmFix] tools=${body.tools?.length ?? 0} choice=${body.tool_choice} msgs=[${roles}]`);

      options.body = JSON.stringify(body);
    } catch (e) {
      console.error('[vllmFix] parse error:', e);
    }
  }
  return fetch(url, options);
}

const agent = createOpenAICompatible({
  name: 'agent',
  baseURL: BASE_URL,
  apiKey: API_KEY,
  fetch: vllmFixerFetch,
});

// Singleton MCP client — une session unique réutilisée entre toutes les requêtes.
// Créer un nouveau transport par requête perd le sessionId entre l'init et les appels d'outils.
type McpClient = Awaited<ReturnType<typeof createMCPClient>>;
let mcpClientSingleton: McpClient | null = null;
let mcpToolsCache: Record<string, any> = {};
let mcpInitPromise: Promise<void> | null = null;
let mcpContextSection = '';

async function fetchMcpContextSection(): Promise<string> {
  if (!MCP_URL) return '';
  const url = MCP_URL.replace(/\/$/, '') + '/context-prompt';
  try {
    const res = await fetch(url);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text) {
        console.log('[mcp] Section "Contexte pré-chargé" récupérée et injectée dans le prompt système');
        return '\n\n' + text;
      }
    }
  } catch (e) {
    console.warn('[mcp] Impossible de récupérer le contexte pré-chargé:', e);
  }
  return '';
}

async function initMcp(): Promise<void> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const client = await createMCPClient({ transport });
  const tools = await client.tools();
  console.log(`[mcp] ${Object.keys(tools).length} outils:`, Object.keys(tools).join(', '));
  mcpClientSingleton = client;
  mcpToolsCache = tools;
  mcpContextSection = await fetchMcpContextSection();
}

async function ensureMcpClient(): Promise<Record<string, any>> {
  if (!MCP_URL) return {};
  if (mcpClientSingleton) return mcpToolsCache;
  if (!mcpInitPromise) {
    mcpInitPromise = initMcp().catch((e) => {
      console.error('[mcp] Échec connexion:', e);
      mcpClientSingleton = null;
      mcpInitPromise = null;
      throw e;
    });
  }
  await mcpInitPromise;
  mcpInitPromise = null;
  return mcpToolsCache;
}


process.on('SIGTERM', async () => {
  await mcpClientSingleton?.close().catch(() => {});
  process.exit(0);
});

const app = new Hono();

const ALLOWED_ORIGINS = new Set([
  'https://geobretagne.fr',
  'https://www.geobretagne.fr',
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:3000']
    : []),
]);

app.use('/api/*', cors({
  origin: (origin) =>
    origin && (ALLOWED_ORIGINS.has(origin) || /^https:\/\/[\w-]+\.geobretagne\.fr$/.test(origin))
      ? origin
      : null,
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}));

app.get('/api/health', (c) => c.json({ ok: true }));

app.post('/api/chat', async (c) => {
  const contentLength = Number(c.req.header('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return c.json({ error: 'Requête trop volumineuse.' }, 413);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Corps JSON invalide.' }, 400);
  }

  const { messages } = body as { messages: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return c.json({ error: 'Paramètre messages invalide.' }, 400);
  }

  try {
    const tools = await ensureMcpClient().catch(() => ({}));

    if (!MCP_URL) console.log('[chat] Aucun MCP configuré — mode bot textuel');

    const hasMcp = Object.keys(tools).length > 0;

    const fullSystemPrompt = SYSTEM_PROMPT
      ? SYSTEM_PROMPT + mcpContextSection
      : undefined;

    const result = streamText({
      model: agent(MODEL),
      system: fullSystemPrompt,
      messages: await convertToModelMessages(messages as any),
      ...(hasMcp ? { tools, stopWhen: stepCountIs(20) } : {}),
      maxRetries: 0,
      temperature: 0.3,
      onFinish: async ({ finishReason, steps }) => {
        console.log(`[finish] reason=${finishReason} steps=${steps.length}`);
      },
      onError: async ({ error }) => {
        console.error('[chat] Erreur SDK:', error);
      },
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type !== 'finish') return undefined;
        const u = part.totalUsage;
        if (u.totalTokens == null) return undefined;
        return {
          usage: {
            inputTokens: u.inputTokens ?? 0,
            outputTokens: u.outputTokens ?? 0,
            totalTokens: u.totalTokens,
          },
        };
      },
      onError: (error) => {
        const e = error as Record<string, unknown>;
        if (e?.statusCode === 429 && e?.responseBody) {
          try {
            const body = JSON.parse(e.responseBody as string) as { detail?: string };
            return `Limite de tokens dépassée : ${body.detail ?? e.responseBody}`;
          } catch {
            return `Limite de tokens dépassée : ${e.responseBody}`;
          }
        }
        return 'Une erreur est survenue. Veuillez re-créer une conversation';
      },
    });
  } catch (e) {
    console.error('[chat] Erreur fatale:', e);
    return c.json({ error: 'Service temporairement indisponible.' }, 503);
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`✅ Backend chat sur http://localhost:${info.port}`);
});
