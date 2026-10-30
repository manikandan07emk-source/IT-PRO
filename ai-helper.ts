import { supabase } from '@/lib/supabase';

export async function askQuestionHelper(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ text?: unknown }>('ai-question-helper', {
    body: { prompt },
  });
  if (error) throw new Error('The AI helper is unavailable right now. Please try again.');
  if (!data || typeof data.text !== 'string') {
    throw new Error('The AI helper returned an unexpected answer. Please try again.');
  }
  return data.text;
}
