import type { Conversation } from '../hooks/useConversations';
import './Sidebar.css';

type Props = {
  open: boolean;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const dayMs = 86_400_000;
  const diff = now.getTime() - d.getTime();

  if (diff < dayMs && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 7 * dayMs) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onClose }: Props) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden />}
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`} aria-label="Historique des conversations">
        <div className="sidebar__header">
          <span className="sidebar__title">Historique</span>
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="sidebar__new">
          <button type="button" className="sidebar__new-btn" onClick={onNew}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Nouvelle conversation
          </button>
        </div>

        <ul className="sidebar__list" role="list">
          {conversations.map((c) => (
            <li key={c.id} className={`sidebar__item${c.id === activeId ? ' sidebar__item--active' : ''}`}>
              <button
                type="button"
                className="sidebar__item-btn"
                onClick={() => onSelect(c.id)}
                title={c.title}
              >
                <span className="sidebar__item-title">{c.title}</span>
                <span className="sidebar__item-date">{formatDate(c.updatedAt)}</span>
              </button>
              <button
                type="button"
                className="sidebar__item-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                aria-label={`Supprimer « ${c.title} »`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
