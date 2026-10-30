import { useEffect, useState } from 'react';

export type AppView = 'library' | 'editor';

function readView(): AppView {
  return new URLSearchParams(window.location.search).get('view') === 'editor' ? 'editor' : 'library';
}

export function navigateTo(view: AppView) {
  const url = new URL(window.location.href);
  if (view === 'editor') url.searchParams.set('view', 'editor');
  else url.searchParams.delete('view');
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
