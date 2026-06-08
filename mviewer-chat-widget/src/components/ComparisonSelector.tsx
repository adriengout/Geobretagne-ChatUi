import { useState, useRef, useEffect } from 'react';
import { COMPARISON_UNITS } from '../comparisons';
import './ComparisonSelector.css';

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function ComparisonSelector({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < 2) {
      onChange([...selected, id]);
    }
  };

  const hasSelection = selected.length > 0;

  return (
    <div className="cmp-sel" ref={containerRef}>
      <button
        type="button"
        className={`cmp-sel__trigger${hasSelection ? ' cmp-sel__trigger--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Choisir des références de comparaison"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 3.5h10M4 7h6M6 10.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span>Comparer à…</span>
        {hasSelection && (
          <span className="cmp-sel__badge">{selected.length}</span>
        )}
        <svg
          className={`cmp-sel__chevron${open ? ' cmp-sel__chevron--open' : ''}`}
          width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="cmp-sel__dropdown" role="listbox" aria-multiselectable="true" aria-label="Références de comparaison">
          <p className="cmp-sel__hint">
            {selected.length < 2
              ? `Sélectionnez jusqu'à ${2 - selected.length} référence${2 - selected.length > 1 ? 's' : ''} de plus`
              : 'Maximum atteint — désélectionnez pour en changer'}
          </p>

          {COMPARISON_UNITS.map((unit) => {
            const isSelected = selected.includes(unit.id);
            const isDisabled = !isSelected && selected.length >= 2;
            return (
              <button
                key={unit.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                className={[
                  'cmp-sel__option',
                  isSelected ? 'cmp-sel__option--selected' : '',
                  isDisabled ? 'cmp-sel__option--disabled' : '',
                ].join(' ').trim()}
                onClick={() => toggle(unit.id)}
              >
                <span className="cmp-sel__check" aria-hidden="true">
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className="cmp-sel__option-icon">{unit.icon}</span>
                {unit.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
