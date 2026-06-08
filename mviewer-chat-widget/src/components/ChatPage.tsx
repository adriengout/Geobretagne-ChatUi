import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { ChatMessage } from '../types';
import { useEffect, useRef, useState } from 'react';
import { Message } from './Message';
import { Composer } from './Composer';
import { MapSelector, type BBox } from './MapSelector';
import { ComparisonSelector } from './ComparisonSelector';
import { LayerPicker } from './LayerPicker';
import './ChatPage.css';

const STICK_TO_BOTTOM_THRESHOLD = 80;

const transport = new DefaultChatTransport({
  api: `${import.meta.env.BASE_URL}api/chat`,
});

type Props = {
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onOpenHistory?: () => void;
  onOpenHelp?: () => void;
  mviewerUrl?: string;
};

export function ChatPage({ initialMessages, onMessagesChange, onOpenHistory, onOpenHelp, mviewerUrl }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [comparisonUnits, setComparisonUnits] = useState<string[]>([]);
  const isProgrammaticScroll = useRef(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}config/suggestions.json`)
      .then((r) => r.json())
      .then((data: { suggestions: string[]; suggestionsMap: Record<string, string> }) => {
        setSuggestions(data.suggestions ?? []);
        setSuggestionsMap(data.suggestionsMap ?? {});
      })
      .catch(() => {});
  }, []);

  const { messages, sendMessage, stop, status, error } = useChat<ChatMessage>({
    messages: initialMessages,
    transport,
  });

  useEffect(() => {
    if (!mviewerUrl || (initialMessages && initialMessages.length > 0)) return;
    sendMessage({ text: `${mviewerUrl} utilise cette carte pour les prochaines questions` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save avec debounce
  useEffect(() => {
    if (!onMessagesChange) return;
    const timer = setTimeout(() => onMessagesChange(messages), 800);
    return () => clearTimeout(timer);
  }, [messages, onMessagesChange]);

  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < STICK_TO_BOTTOM_THRESHOLD;
    stickToBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  };

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => { isProgrammaticScroll.current = false; });
  }, [messages]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    stickToBottomRef.current = true;
    setShowScrollButton(false);
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setTimeout(() => { isProgrammaticScroll.current = false; }, 400);
  };

  const handleBboxSelect = async (bbox: BBox) => {
    setMapOpen(false);

    const inRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;
    if (
      !inRange(bbox.west, -180, 180) || !inRange(bbox.east, -180, 180) ||
      !inRange(bbox.south, -90, 90) || !inRange(bbox.north, -90, 90) ||
      bbox.south >= bbox.north || bbox.west >= bbox.east
    ) return;

    const centerLat = (bbox.south + bbox.north) / 2;
    const centerLon = (bbox.west + bbox.east) / 2;

    let locationLabel = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${centerLat}&lon=${centerLon}&format=json&accept-language=fr`,
        { headers: { 'User-Agent': 'GeoBretagne-ChatUI/1.0' }, signal: controller.signal },
      );
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json() as { address?: { town?: string; village?: string; municipality?: string; city?: string; county?: string } };
        const a = data.address ?? {};
        const name = a.town ?? a.village ?? a.municipality ?? a.city ?? a.county ?? '';
        if (name) locationLabel = ` (zone autour de ${name})`;
      }
    } catch { /* nominatim non disponible, on continue sans label */ }

    const text = `Zone sélectionnée sur la carte${locationLabel} — coordonnées WGS84/EPSG:4326 :
      - longitude ouest : ${bbox.west.toFixed(6)}
      - latitude sud    : ${bbox.south.toFixed(6)}
      - longitude est   : ${bbox.east.toFixed(6)}
      - latitude nord   : ${bbox.north.toFixed(6)}

      fais moi une analyse spatiale de cette zone.`;
    sendMessage({ text });
  };

  const isStreaming = status === 'streaming' || status === 'submitted';
  const isEmpty = messages.length === 0;

  // Détecte si le dernier message assistant contient un résultat spatial_analysis.
  // Le SDK MCP encapsule la réponse : output.content[0].text contient le JSON de l'outil.
  const spatialLayers = (() => {
    if (isStreaming) return [];
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return [];
    for (const part of lastMsg.parts) {
      const p = part as Record<string, unknown>;
      const toolName = (p.toolName as string | undefined) ?? (p.type as string | undefined)?.replace(/^tool-/, '');
      if (toolName !== 'spatial_analysis' || p.state !== 'output-available' || !p.output) continue;
      try {
        const mcpOutput = p.output as { content: Array<{ type: string; text: string }> };
        const text = mcpOutput.content.find((c) => c.type === 'text')?.text;
        if (!text) continue;
        const parsed = JSON.parse(text) as { found: Array<{ id: string; count: number }> };
        if (Array.isArray(parsed.found) && parsed.found.length > 0) return parsed.found;
      } catch { /* format inattendu, on ignore */ }
    }
    return [];
  })();

  useEffect(() => {
    if (spatialLayers.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    stickToBottomRef.current = true;
    setShowScrollButton(false);
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setTimeout(() => { isProgrammaticScroll.current = false; }, 400);
  }, [spatialLayers.length]);

  const handleLayerConfirm = (ids: string[]) => {
    sendMessage({ text: `Donne-moi des informations détaillées sur ces données : ${ids.join(', ')}` });
  };

  return (
    
    <div className="chat-page">
      <geor-header active-app='chatbot' config-file='/header/settings.json' logo-url='/pub/logo/logo_GeoBretagne.svg' legacy-header='false' legacy-url='/header/' height='90' stylesheet='/static/css/geobretagne.css'></geor-header>

      {onOpenHistory && (
        <div className="chat-page__history-bar">
          <button
            type="button"
            className="chat-page__history-btn"
            onClick={onOpenHistory}
            aria-label="Historique des conversations"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="7.25" width="10" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="11.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
          <ComparisonSelector
            selected={comparisonUnits}
            onChange={setComparisonUnits}
          />
        </div>
      )}

      <main className="chat-page__main" ref={scrollRef} onScroll={handleScroll}>
        <div className="chat-page__container">
          {isEmpty ? (
            <div className="chat-page__welcome">
              <h1 className="chat-page__welcome-title">
                Posez vos questions sur les cartes
              </h1>
              <p className="chat-page__welcome-text">
                Choisissez une zone, trouvez les données, obtenez une synthèse - en langage naturel.
              </p>
              <div className="chat-page__suggestions">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chat-page__suggestion"
                    onClick={() => sendMessage({ text: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className='chat-page__maps'>
                {Object.entries(suggestionsMap).map(([url, label]) => (
                  <button
                    key={url}
                    type="button"
                    className="chat-page__map"
                    onClick={() => sendMessage({ text: url + ' utilise cette carte pour les prochaines questions' })}
                  >
                    <>{"Utiliser carte :"}<br/>{label}</>

                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-page__messages">
              {messages.map((m) => (
                <Message key={m.id} message={m} comparisonUnits={comparisonUnits} />
              ))}
              {spatialLayers.length > 0 && (
                <LayerPicker layers={spatialLayers} onConfirm={handleLayerConfirm} />
              )}

              {isStreaming && (
                <div className="chat-page__typing">
                  <span /><span /><span />
                </div>
              )}
              {error && !isStreaming && (
                <div className="chat-page__error-msg">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {error.message}
                </div>
              )}
            </div>
          )}
        </div>

        {showScrollButton && !isEmpty && (
          <button
            type="button"
            className="chat-page__scroll-to-bottom"
            onClick={scrollToBottom}
            aria-label="Aller au dernier message"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Nouveaux messages</span>
          </button>
        )}
      </main>

      <footer className="chat-page__footer">
        <Composer
          onSubmit={(text) => sendMessage({ text })}
          onStop={stop}
          onOpenMap={() => setMapOpen(true)}
          onOpenHelp={onOpenHelp}
          disabled={isStreaming}
        />
      </footer>

      {mapOpen && (
        <MapSelector
          onSelect={handleBboxSelect}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
