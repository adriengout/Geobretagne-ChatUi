import { useState } from 'react';
import { ChatPage } from './components/ChatPage';
import { Help } from './components/Help';
import { Sidebar } from './components/Sidebar';
import { useConversations } from './hooks/useConversations';

const mviewerUrl = new URLSearchParams(window.location.search).get('mviewer') ?? undefined;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'help'>('chat');

  const { list, active, activeId, updateMessages, newConversation, deleteConversation, switchTo } =
    useConversations();

  if (view === 'help') {
    return <Help onBack={() => setView('chat')} />;
  }

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        conversations={list}
        activeId={activeId}
        onSelect={(id) => { switchTo(id); setSidebarOpen(false); }}
        onNew={() => { newConversation(); setSidebarOpen(false); }}
        onDelete={deleteConversation}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatPage
        key={activeId}
        initialMessages={active.messages}
        onMessagesChange={(msgs) => updateMessages(activeId, msgs)}
        onOpenHistory={() => setSidebarOpen((o) => !o)}
        onOpenHelp={() => setView('help')}
        mviewerUrl={mviewerUrl}
      />
    </>
  );
}
