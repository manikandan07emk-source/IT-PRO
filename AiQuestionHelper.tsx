import { useState, type FormEvent } from 'react';
import { AlertCircle, Copy, Loader2, Sparkles } from 'lucide-react';
import { askQuestionHelper } from '@/lib/ai-helper';

const MAX_PROMPT_LENGTH = 2000;

const EXAMPLES = [
  'Create 5 short-answer questions on normalization in databases, with marks.',
  'Make a 10-mark long question on the working of a four-stroke engine.',
  'Write 3 multiple-choice questions on Ohm\'s law for a first-year exam.',
];

export default function AiQuestionHelper() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError('Describe the questions you need.');
      return;
    }
    setError(null);
    setCopied(false);
    setLoading(true);
    try {
      setResult(await askQuestionHelper(trimmed));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'The AI helper could not answer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setError('Could not copy. Select the text and copy it manually.');
    }
  };

  return (
    <div className="grid gap-6 animate-fade-up lg:grid-cols-[1fr_1.2fr]">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-base font-bold text-stone-900">Ask the AI helper</h2>
          <p className="mt-1 text-sm text-stone-600">
            Describe the subject, question type, number of questions and marks. The result is a draft for you to review.
          </p>
        </div>

        <label className="block">
          <span className="sr-only">Your request</span>
          <textarea
            value={prompt}
            maxLength={MAX_PROMPT_LENGTH}
            rows={7}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="For example: create 5 questions on binary search trees with marks."
            className="w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-stone-200 px-3 py-1.5 text-left text-xs font-semibold text-stone-700 transition-colors hover:border-gold-400 hover:text-gold-800"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Writing questions...' : 'Generate questions'}
        </button>
      </form>

      <section className="flex min-h-[320px] flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-stone-900">Draft</h2>
          {result && (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gold-800 transition-colors hover:bg-gold-50"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {result ? (
          <div className="whitespace-pre-wrap rounded-xl bg-stone-50 p-5 text-sm leading-relaxed text-stone-800">{result}</div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            {loading ? 'Writing your questions...' : 'Your generated questions will appear here.'}
          </div>
        )}
      </section>
    </div>
  );
}
