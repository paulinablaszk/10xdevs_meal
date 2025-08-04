import type { APIRoute } from 'astro';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: error.message 
        }), 
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: 'ok',
        session: data.session 
      }), 
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Nieprawidłowe dane wejściowe',
          errors: error.errors 
        }), 
        { status: 400 }
      );
    }

    console.error('Błąd logowania:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: 'Wystąpił nieoczekiwany błąd podczas logowania.' 
      }), 
      { status: 500 }
    );
  }
}; 