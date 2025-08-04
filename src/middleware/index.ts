import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

declare module 'astro' {
  interface Locals {
    supabase: SupabaseClient<Database>;
    session: Session | null;
  }
}

export const onRequest = defineMiddleware(async ({ cookies, url, redirect, locals }, next) => {
  // Dodaj klienta Supabase do locals
  locals.supabase = supabaseClient;
  locals.session = null;

  // Jeśli to strona logowania lub rejestracji, nie sprawdzaj sesji
  if (url.pathname.startsWith('/auth/')) {
    return next();
  }

  // Sprawdź sesję
  const { data: { session }, error } = await supabaseClient.auth.getSession();

  if (error || !session) {
    // Jeśli strona wymaga autoryzacji, przekieruj na login
    if (url.pathname.startsWith('/recipes')) {
      const nextUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/auth/login?next=${nextUrl}`);
    }
    return next();
  }

  // Dodaj sesję do locals
  locals.session = session;

  return next();
}); 