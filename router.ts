import { useEffect, useState } from 'react';

export type AppView = 'library' | 'editor' | 'ai-doubt';

function readView(): AppView {
  const view = new URLSearchParams(window.location.search).get('view');

  if (view === 'editor') return 'editor';
  if (view === 'ai-doubt') return 'ai-doubt';

  return 'library';
}

export function navigateTo(view: AppView) {
  const url = new URL(window.location.href);

  if (view === 'library') {
    url.searchParams.delete('view');
  } else {
    url.searchParams.set('view', view);
  }

  window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useAppView(): AppView {
  const [view, setView] = useState<AppView>(readView);

  useEffect(() => {
    const sync = () => setView(readView());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return view;
}
