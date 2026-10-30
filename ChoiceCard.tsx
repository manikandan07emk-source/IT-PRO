import { ChevronRight, type LucideIcon } from 'lucide-react';

type ChoiceCardProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  index: number;
  onClick: () => void;
};

export default function ChoiceCard({ icon: Icon, title, subtitle, index, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition-all duration-300 animate-fade-up hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-lg hover:shadow-gold-900/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-200/70"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-gold-200 transition-colors duration-300 group-hover:bg-gold-700 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-stone-900">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-sm text-stone-500">{subtitle}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-gold-600" />
    </button>
  );
}
