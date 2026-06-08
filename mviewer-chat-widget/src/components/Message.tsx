import type { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { ToolCall } from './ToolCall';
import { COMPARISON_UNITS } from '../comparisons';
import './Message.css';

const WH_PER_TOKEN = 0.0003;

type Props = {
  message: ChatMessage;
  comparisonUnits?: string[];
};

export function Message({ message, comparisonUnits = [] }: Props) {
  const isUser = message.role === 'user';
  const usage = isUser ? undefined : message.metadata?.usage;

  const energyKwh = usage ? (usage.totalTokens * WH_PER_TOKEN) / 1000 : 0;
  const activeComparisons = comparisonUnits
    .map((id) => COMPARISON_UNITS.find((u) => u.id === id))
    .filter(Boolean) as typeof COMPARISON_UNITS;

  return (
    <div className={`message message--${isUser ? 'user' : 'assistant'}`}>
      <div className="message__role">
        {isUser ? 'Vous' : 'Assistant'}
      </div>
      <div className="message__content">
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            if (isUser) {
              return <p key={i} className="message__text">{part.text}</p>;
            }
            return (
              <div key={i} className="message__markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }
          if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
            return <ToolCall key={i} part={part as never} />;
          }
          return null;
        })}
      </div>

      {usage && (
        <div className="message__tokens">
          {usage.totalTokens} tokens
          <span className="message__tokens-detail">
            (entrée : {usage.inputTokens} · réponse : {usage.outputTokens})
          </span>
        </div>
      )}

      {usage && activeComparisons.length > 0 && (
        <div className="message__comparison">
          <span className="message__comparison-label">≈ Équivalent à</span>
          <ul className="message__comparison-list">
            {activeComparisons.map((unit) => (
              <li key={unit.id} className="message__comparison-item">
                <span className="message__comparison-icon" aria-hidden="true">{unit.icon}</span>
                <span className="message__comparison-text">{unit.toDisplay(energyKwh)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
