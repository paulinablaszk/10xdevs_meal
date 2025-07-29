import type { APIRoute } from 'astro';
import { RecipeService } from '../../../lib/services/recipe.service';
import { recipeIdParamSchema } from '../../../lib/validation/recipe';
import { ZodError } from 'zod';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Walidacja parametru id
    const { id } = recipeIdParamSchema.parse(params);

    // 2. Inicjalizacja serwisu
    const recipeService = new RecipeService(locals.supabase, locals.userId);

    // 3. Pobranie przepisu
    const recipe = await recipeService.getRecipeById(id);

    // 4. Zwróć odpowiedź
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=30'
      }
    });
  } catch (err) {
    // 5. Obsługa błędów
    const error = err as Error;

    if (error.message === 'NOT_FOUND') {
      return new Response(
        JSON.stringify({ error: 'NOT_FOUND', message: 'Przepis nie został znaleziony' }), 
        { status: 404 }
      );
    }
    if (error.message === 'FORBIDDEN') {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN', message: 'Brak dostępu do tego przepisu' }), 
        { status: 403 }
      );
    }

    // Błąd walidacji Zod
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Nieprawidłowy format ID przepisu' }), 
        { status: 400 }
      );
    }

    // Nieoczekiwany błąd
    console.error('Błąd podczas pobierania przepisu:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: 'Wystąpił nieoczekiwany błąd' }), 
      { status: 500 }
    );
  }
}; 