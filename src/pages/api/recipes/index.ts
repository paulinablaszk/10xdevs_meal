import type { APIRoute } from "astro";
import { RecipeService } from "../../../lib/services/recipe.service";
import { recipeListQuerySchema } from "../../../lib/validation/recipe";
import { ZodError } from "zod";
import { PostgrestError } from "@supabase/supabase-js";
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  ModelNotSupportedError,
  NetworkError,
  InvalidSchemaError,
} from "../../../lib/services/openrouter.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parsowanie body
    const body = await request.json();

    // 2. Utworzenie przepisu przez serwis
    const recipeService = new RecipeService(locals.supabase, locals.userId);
    const recipe = await recipeService.createRecipe(body);

    // 3. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 4. Obsługa błędów
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          details: error.errors,
        }),
        { status: 400 }
      );
    }

    if (error instanceof PostgrestError) {
      // Błąd z triggera DB enforce_recipe_limit
      if (error.message.includes("Przekroczono limit")) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "Przekroczono limit 100 przepisów na użytkownika",
          }),
          { status: 409 }
        );
      }
    }

    // Obsługa błędów OpenRouter
    if (error instanceof OpenRouterError) {
      const status = error.statusCode;
      let message = error.message;

      if (error instanceof AuthenticationError) {
        message = "Błąd uwierzytelniania API - skontaktuj się z administratorem";
      } else if (error instanceof RateLimitError) {
        message = "Przekroczono limit zapytań do AI - spróbuj ponownie za chwilę";
      } else if (error instanceof ModelNotSupportedError) {
        message = "Model AI jest tymczasowo niedostępny - spróbuj ponownie za chwilę";
      } else if (error instanceof NetworkError) {
        message = "Problem z połączeniem do serwisu AI - spróbuj ponownie za chwilę";
      } else if (error instanceof InvalidSchemaError) {
        message = "AI zwróciło nieprawidłowy format danych - spróbuj ponownie";
      }

      return new Response(
        JSON.stringify({
          error: "AI Error",
          message,
        }),
        { status }
      );
    }

    // Błąd AI lub inny nieoczekiwany błąd
    console.error("Błąd podczas tworzenia przepisu:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd podczas tworzenia przepisu",
      }),
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Parsowanie i walidacja query params
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());

    // Obsługa powtarzalnych parametrów (ingredient może wystąpić wiele razy)
    const ingredient = url.searchParams.getAll("ingredient");
    const params = { ...rawParams, ingredient };

    const validatedParams = recipeListQuerySchema.parse(params);

    const recipeService = new RecipeService(locals.supabase, locals.userId);
    const result = await recipeService.listRecipes(validatedParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/recipes:", error);

    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameter",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obsługa błędów Supabase
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "PGRST301"
    ) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
