import AppShell from '@/components/layout/AppShell';
import LibraryBrowser from '@/components/library/LibraryBrowser';
import EditorArea from '@/components/editor/EditorArea';
import DoubtChat from '@/components/chat/DoubtChat';
import { useAppView } from '@/lib/router';

function App() {
  const view = useAppView();

  return (
    <AppShell view={view}>
      {view === 'editor' ? <EditorArea /> : <LibraryBrowser />}
      <DoubtChat />
    </AppShell>
  );
}

export default App;
