import { useCallback, useState } from 'react';

export type AgentConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
};

const STORAGE_KEY = 'geobretagne-agent-config';

function load(): AgentConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentConfig) : null;
  } catch {
    return null;
  }
}

export function useAgentConfig() {
  const [config, setConfig] = useState<AgentConfig | null>(load);

  const save = useCallback((c: AgentConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setConfig(c);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(null);
  }, []);

  return { config, save, clear };
}
