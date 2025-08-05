import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

declare module 'astro' {
  interface Locals {
    supabase: SupabaseClient<Database>;
    session: Session | null;
    userId: string | null;
  }
}

export const onRequest = defineMiddleware(async ({ locals, request, redirect, cookies }, next) => {
  try {
    // Inicjalizacja klienta Supabase
    locals.supabase = supabaseClient;

    // Pobierz tokeny z ciasteczek
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    let session = null;

    if (accessToken && refreshToken) {
      // Ustaw sesję w kliencie Supabase
      const { data, error } = await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (!error) {
        session = data.session;
      }
    }

    // Jeśli nie ma sesji, spróbuj pobrać ją standardową metodą
    if (!session) {
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      session = currentSession;
    }

    // Przypisz sesję i userId do locals
    Object.assign(locals, {
      session,
      userId: session?.user?.id || null
    });

    // Sprawdź czy ścieżka wymaga autoryzacji
    const url = new URL(request.url);
    const isAuthPath = url.pathname.startsWith('/auth/');
    const isApiPath = url.pathname.startsWith('/api/');
    const isPublicApiPath = isApiPath && (
      url.pathname === '/api/auth/login' ||
      url.pathname === '/api/auth/register' ||
      url.pathname === '/api/auth/reset-request' ||
      url.pathname === '/api/auth/reset-confirm'
    );
    
    const isProtectedPath = !isAuthPath && !isPublicApiPath && (url.pathname.startsWith('/recipes') || isApiPath);

    console.log('Auth check:', {
      path: url.pathname,
      isAuthPath,
      isApiPath,
      isPublicApiPath,
      isProtectedPath,
      hasSession: !!session
    });

    // Jeśli ścieżka jest chroniona i nie ma sesji, przekieruj na logowanie
    if (isProtectedPath && !session) {
      if (isApiPath) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return redirect('/auth/login?next=' + encodeURIComponent(url.pathname));
    }

    // Jeśli użytkownik jest zalogowany i próbuje dostać się do stron auth, przekieruj na /recipes
    if (isAuthPath && session) {
      return redirect('/recipes');
    }

    const response = await next();
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}); 