import { useState } from 'react';
import './LayerPicker.css';

type Layer = { id: string; name?: string; count: number };

type Props = {
  layers: Layer[];
  onConfirm: (ids: string[]) => void;
};

export function LayerPicker({ layers, onConfirm }: Props) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked(checked.size === layers.length ? new Set() : new Set(layers.map((l) => l.id)));
  };

  const selectedCount = checked.size;

  return (
    <div className="layer-picker">
      <div className="layer-picker__header">
        <span className="layer-picker__title">Sélectionnez les données à approfondir</span>
        <button type="button" className="layer-picker__toggle-all" onClick={toggleAll}>
          {checked.size === layers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
      </div>

      <ul className="layer-picker__list">
        {layers.map((layer) => (
          <li key={layer.id} className="layer-picker__item">
            <label className="layer-picker__label">
              <input
                type="checkbox"
                checked={checked.has(layer.id)}
                onChange={() => toggle(layer.id)}
                className="layer-picker__checkbox"
              />
              <span className="layer-picker__name">
                {layer.name ?? layer.id}
                <span className="layer-picker__id">{layer.name ? layer.id : null}</span>
                <span className="layer-picker__count">({layer.count.toLocaleString('fr-FR')})</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="layer-picker__footer">
        <button
          type="button"
          className="layer-picker__submit"
          disabled={selectedCount === 0}
          onClick={() => onConfirm([...checked])}
        >
          Analyser {selectedCount > 0 ? `${selectedCount} couche${selectedCount > 1 ? 's' : ''}` : ''}
        </button>
      </div>
    </div>
  );
}
