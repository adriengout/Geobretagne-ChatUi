import { useCallback, useMemo, useState } from 'react';
import type { ChatMessage } from '../types';

const STORAGE_KEY = 'geobretagne-chat-v1';
const MAX_CONVERSATIONS = 50;

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeNew(): Conversation {
  const now = Date.now();
  return { id: genId(), title: 'Nouvelle conversation', createdAt: now, updatedAt: now, messages: [] };
}

function persist(list: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage full — silently ignore
  }
}

function loadAll(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function initList(): Conversation[] {
  const saved = loadAll();
  if (saved.length > 0) return saved;
  const first = makeNew();
  persist([first]);
  return [first];
}

function titleFromMessages(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'Nouvelle conversation';
  const textPart = first.parts.find((p) => p.type === 'text');
  if (!textPart || textPart.type !== 'text') return 'Nouvelle conversation';
  return textPart.text.slice(0, 60) || 'Nouvelle conversation';
}

export function useConversations() {
  const [list, setList] = useState<Conversation[]>(initList);
  const [activeId, setActiveId] = useState<string>(() => initList()[0].id);

  const active = useMemo(
    () => list.find((c) => c.id === activeId) ?? list[0],
    [list, activeId],
  );

  const updateMessages = useCallback((id: string, messages: ChatMessage[]) => {
    setList((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        const title =
          c.title === 'Nouvelle conversation' ? titleFromMessages(messages) : c.title;
        return { ...c, messages, title, updatedAt: Date.now() };
      });
      persist(next);
      return next;
    });
  }, []);

  const newConversation = useCallback((): string => {
    const conv = makeNew();
    setList((prev) => {
      const next = [conv, ...prev].slice(0, MAX_CONVERSATIONS);
      persist(next);
      return next;
    });
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setList((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (next.length === 0) {
          const fresh = makeNew();
          persist([fresh]);
          setActiveId(fresh.id);
          return [fresh];
        }
        persist(next);
        if (id === activeId) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId],
  );

  const switchTo = useCallback((id: string) => setActiveId(id), []);

  return { list, active, activeId, updateMessages, newConversation, deleteConversation, switchTo };
}
