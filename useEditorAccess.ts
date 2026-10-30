import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type EditorAccess =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'no-access'; email: string }
  | { status: 'editor'; userId: string; email: string };

async function resolveAccess(session: Session | null): Promise<EditorAccess> {
  if (!session) return { status: 'signed-out' };

  const email = session.user.email ?? '';
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || data?.role !== 'admin') return { status: 'no-access', email };
  return { status: 'editor', userId: session.user.id, email };
}

export function useEditorAccess(): EditorAccess {
  const [access, setAccess] = useState<EditorAccess>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const apply = (session: Session | null) => {
      void resolveAccess(session).then((next) => {
        if (active) setAccess(next);
      });
    };

    void supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return access;
}
