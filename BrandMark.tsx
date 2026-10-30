import { GraduationCap } from 'lucide-react';

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 text-white shadow-md">
        <GraduationCap className="h-6 w-6" />
      </span>
      <div className="leading-tight">
        <p className="text-xl font-extrabold tracking-tight text-stone-900">IT PRO</p>
        <p className="text-xs font-semibold text-gold-700">Smart Exam Analyzer</p>
      </div>
    </div>
  );
}
