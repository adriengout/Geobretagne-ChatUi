import { useState, useRef, useEffect } from 'react';
import './Composer.css';

type Props = {
  onSubmit: (text: string) => void;
  onStop?: () => void;
  onOpenMap?: () => void;
  onOpenHelp?: () => void;
  disabled?: boolean;
};

export function Composer({ onSubmit, onStop, onOpenMap, onOpenHelp, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize de la textarea selon le contenu
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée envoie, Maj+Entrée saute une ligne
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="composer">
      {(onOpenMap || onOpenHelp) && (
        <div className="composer__toolbar">
          {onOpenMap && (
            <button
              type="button"
              className="composer__map-btn"
              onClick={onOpenMap}
              disabled={disabled}
              aria-label="Sélectionner une zone d'intérêt"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 2.5L5 1L9 3L13 1.5V11.5L9 13L5 11L1 12.5V2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M5 1V11M9 3V13" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              Sélectionner une zone d'intérêt
            </button>
          )}
          {onOpenHelp && (
            <button type="button" className="composer__help-btn" onClick={onOpenHelp} aria-label="Aide">
              Documentation d'utilisation
            </button>
          )}
        </div>
      )}
      <div className="composer__inner">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Que souhaitez-vous faire ? (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
          disabled={disabled}
          rows={1}
          className="composer__textarea"
        />
        {disabled ? (
          <button
            type="button"
            onClick={onStop}
            className="composer__button composer__button--stop"
            aria-label="Arrêter la génération"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="10" height="10" rx="2"/>
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            className="composer__button"
            aria-label="Envoyer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8L14 2L8 14L7 9L2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      <p className="composer__hint">
        Le chatbot peut commettre des erreurs.
      </p>
    </form>
  );
}