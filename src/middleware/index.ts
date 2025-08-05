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

export const onRequest = defineMiddleware(({ locals, request }, next) => {
  // Inicjalizacja klienta Supabase
  locals.supabase = supabaseClient;
  return next();
}); 