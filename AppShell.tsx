
import { useState, type ReactNode } from 'react';
import { BookOpen, Menu, PenLine, X, Sparkles, type LucideIcon } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { navigateTo, type AppView } from '@/lib/router';

type AppShellProps = {
  view: AppView;
  children: ReactNode;
};

const NAV_ITEMS: { view: AppView; label: string; icon: LucideIcon }[] = [
  { view: 'library', label: 'Question papers', icon: BookOpen },
  { view: 'editor', label: 'Editor', icon: PenLine },
  { view: 'ai-doubt', label: 'AI Doubt', icon: Sparkles },
];

export default function AppShell({ view, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (target: AppView) => {
    setMenuOpen(false);
    navigateTo(target);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-gold-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <div className="shrink-0">
            <BrandMark />
          </div>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.view} item={item} active={view === item.view} onSelect={go} />
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 transition-colors hover:bg-stone-100 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav aria-label="Main" className="flex flex-col gap-1 border-t border-stone-200 bg-white px-4 py-4 animate-fade-in md:hidden">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.view} item={item} active={view === item.view} onSelect={go} />
            ))}
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onSelect: (view: AppView) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.view)}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-gold-100 text-gold-800' : 'text-stone-700 hover:bg-stone-100 hover:text-gold-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </button>
  );
}

