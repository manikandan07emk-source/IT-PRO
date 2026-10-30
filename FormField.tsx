import type { ReactNode } from 'react';

export const selectClass =
  'w-full appearance-none rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60 disabled:bg-stone-100 disabled:text-stone-400';

export const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-700">{label}</span>
      <span className="relative block">{children}</span>
    </label>
  );
}
