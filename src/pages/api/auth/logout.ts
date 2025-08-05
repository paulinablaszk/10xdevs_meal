import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Wyloguj użytkownika w Supabase
    await locals.supabase.auth.signOut();

    // Wyczyść ciasteczka sesji
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return new Response(JSON.stringify({ 
      status: 'ok',
      message: 'Wylogowano pomyślnie'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Błąd podczas wylogowywania:', error);
    return new Response(JSON.stringify({ 
      status: 'error',
      message: 'Wystąpił błąd podczas wylogowywania'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 