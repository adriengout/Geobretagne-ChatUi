import { useState } from 'react';
import './ToolCall.css';

type ToolPart = {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

export function ToolCall({ part }: { part: ToolPart }) {
  const [open, setOpen] = useState(false);
  const toolName = part.toolName ?? part.type.replace(/^tool-/, '');
  const state = part.state ?? 'unknown';

  let label: string;
  let statusClass: string;

  if (state === 'input-streaming' || state === 'input-available') {
    label = `Utilisation de ${toolName}…`;
    statusClass = 'tool-call--running';
  } else if (state === 'output-available') {
    label = toolName;
    statusClass = 'tool-call--done';
  } else if (state === 'output-error') {
    label = `${toolName} (erreur)`;
    statusClass = 'tool-call--error';
  } else {
    label = toolName;
    statusClass = '';
  }

  return (
    <div className={`tool-call ${statusClass}`}>
      <button
        type="button"
        className="tool-call__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="tool-call__icon" aria-hidden>
          {state === 'input-streaming' ? '⠿' :
           state === 'input-available' ? '⠿' :
           state === 'output-available' ? '✓' :
           state === 'output-error' ? '!' : '·'}
        </span>
        <span className="tool-call__name">{label}</span>
        <span className="tool-call__chevron" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <pre className="tool-call__details">
          {JSON.stringify(part, null, 2)}
        </pre>
      )}
    </div>
  );
}