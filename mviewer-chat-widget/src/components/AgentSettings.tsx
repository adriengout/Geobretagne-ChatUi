import { useState } from 'react';
import type { AgentConfig } from '../hooks/useAgentConfig';
import './AgentSettings.css';

type Props = {
  current: AgentConfig | null;
  onSave: (config: AgentConfig) => void;
  onClose: () => void;
  onClear: () => void;
};

type LoadState = 'idle' | 'loading' | 'done' | 'error';

export function AgentSettings({ current, onSave, onClose, onClear }: Props) {
  const [systemPrompt, setSystemPrompt] = useState(current?.systemPrompt ?? '');

  const [baseUrl, setBaseUrl] = useState(current?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState(current?.apiKey ?? '');
  const [model, setModel] = useState(current?.model ?? '');
  const [models, setModels] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState('');

  const canLoad = baseUrl.trim().length > 0 && apiKey.trim().length > 0;
  const hasCustomAgent = canLoad && model.length > 0;
  const canSave = systemPrompt.trim().length > 0 || hasCustomAgent;

  const handleLoadModels = async () => {
    setLoadState('loading');
    setLoadError('');
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() }),
      });
      const data = await res.json() as { models?: string[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      const list = data.models ?? [];
      setModels(list);
      if (list.length > 0 && !list.includes(model)) setModel(list[0]);
      setLoadState('done');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setLoadState('error');
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    const config: AgentConfig = {};
    if (systemPrompt.trim()) config.systemPrompt = systemPrompt.trim();
    if (baseUrl.trim()) config.baseUrl = baseUrl.trim();
    if (apiKey.trim()) config.apiKey = apiKey.trim();
    if (model) config.model = model;
    onSave(config);
    onClose();
  };

  return (
    <div className="agent-settings-backdrop" onClick={onClose}>
      <div className="agent-settings" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label="Configurer l'agent">

        <div className="agent-settings__header">
          <span className="agent-settings__title">Configurer l'agent</span>
          <button type="button" className="agent-settings__close" onClick={onClose} aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="agent-settings__body">

          <div className="agent-settings__section">
            <span className="agent-settings__section-title">Comportement</span>
            <label className="agent-settings__label">
              Prompt système
              <textarea
                className="agent-settings__textarea"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Instructions données au modèle avant chaque conversation…"
              />
            </label>
          </div>

          <div className="agent-settings__divider" />

          <div className="agent-settings__section">
            <span className="agent-settings__section-title">
              Agent personnalisé&nbsp;<span className="agent-settings__optional">(optionnel)</span>
            </span>

            <label className="agent-settings__label">
              Base URL
              <input
                type="url"
                className="agent-settings__input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                autoComplete="off"
              />
            </label>

            <label className="agent-settings__label">
              Clé API
              <input
                type="password"
                className="agent-settings__input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-••••••••••••••••"
                autoComplete="new-password"
              />
            </label>

            <button
              type="button"
              className="agent-settings__load-btn"
              onClick={handleLoadModels}
              disabled={!canLoad || loadState === 'loading'}
            >
              {loadState === 'loading' ? (
                <span className="agent-settings__spinner" aria-hidden />
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1.5A5 5 0 1 1 1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M1.5 2.5v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Charger les modèles
            </button>

            {loadState === 'error' && <p className="agent-settings__error">{loadError}</p>}

            {(loadState === 'done' || (current?.model && models.length === 0)) && (
              <label className="agent-settings__label">
                Modèle
                {models.length > 0 ? (
                  <select className="agent-settings__select" value={model} onChange={(e) => setModel(e.target.value)}>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="agent-settings__input"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Identifiant du modèle"
                  />
                )}
              </label>
            )}

            {current?.model && (
              <p className="agent-settings__current">
                Agent actuel : <strong>{current.model}</strong> sur <code>{current.baseUrl}</code>
              </p>
            )}
          </div>

        </div>

        <div className="agent-settings__footer">
          {current && (
            <button type="button" className="agent-settings__reset-btn" onClick={() => { onClear(); onClose(); }}>
              Réinitialiser
            </button>
          )}
          <div className="agent-settings__actions">
            <button type="button" className="agent-settings__cancel-btn" onClick={onClose}>Annuler</button>
            <button type="button" className="agent-settings__save-btn" onClick={handleSave} disabled={!canSave}>Enregistrer</button>
          </div>
        </div>

      </div>
    </div>
  );
}
