# Plan wdrożenia endpointu API: GET /api/recipes/{id}

## 1. Przegląd punktu końcowego

Zwraca pełny JSON pojedynczego przepisu należącego do zalogowanego użytkownika. Obsługuje autoryzację, autoryzację właściciela, walidację parametru `id` oraz standardowe kody błędów.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **URL:** /api/recipes/{id}
- **Parametry:**
  - **Path (wymagane)**
    - `id`: UUID przepisu
- **Body:** brak
- **Nagłówki:**
  - `Authorization: Bearer <jwt>` – wymagany po wdrożeniu uwierzytelniania

## 3. Wykorzystywane typy

- `RecipeDTO` (już zdefiniowany w `src/types.ts`)
- `IngredientDTO` (lista wewnątrz `RecipeDTO`)
- Nowy, wewnętrzny typ walidacji ścieżki:
  ```ts
  // src/lib/validation/recipe.ts
  export const recipeIdParamSchema = z.object({
    id: z.string().uuid(),
  });
  ```

## 4. Szczegóły odpowiedzi

| Kod | Opis                        | Treść                            |
| --- | --------------------------- | -------------------------------- |
| 200 | OK                          | `RecipeDTO` w formacie camelCase |
| 401 | Unauthorized                | `{ error, message }`             |
| 403 | Forbidden (inny właściciel) | `{ error, message }`             |
| 404 | Not Found (brak przepisu)   | `{ error, message }`             |
| 500 | Internal Server Error       | `{ error, message }`             |

## 5. Przepływ danych

1. Middleware uwierzytelnia żądanie i ustawia `locals.userId` (tymczasowo `DEFAULT_USER_ID`).
2. Route `/api/recipes/[id].ts`:
   1. Wyciąga `id` z `params` i waliduje `recipeIdParamSchema`.
   2. Inicjalizuje `RecipeService` z `locals.supabase` oraz `locals.userId`.
   3. Woła `getRecipeById(id)`.
3. `RecipeService.getRecipeById`:
   1. Zapytanie `SELECT * FROM recipes WHERE id = :id AND user_id = :userId .single()`
   2. Wynik mapowany na `RecipeDTO` (wzór z `createRecipe`).
4. Route zwraca JSON i status 200.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie** – JWT / Supabase Auth w middleware.
- **Autoryzacja** – filtrujemy po `user_id`; uniemożliwia dostęp do cudzych danych.
- **Walidacja** – Zod dla UUID, zapobiega malformed input.
- **Rate limiting** – opcjonalnie Supabase Funkcja Edge / header `Retry-After`.
- **CORS** – zwrócić nagłówek `Access-Control-Allow-Origin` zgodnie z polityką front-endu.

## 7. Obsługa błędów

- **400** – niepoprawny UUID (ZodError).
- **401** – brak / niepoprawny token (obsługuje middleware).
- **403** – przepis istnieje, ale `user_id ≠ locals.userId`; w praktyce sprawdzamy SELECT bez `user_id`, a potem porównujemy.
- **404** – brak rekordu.
- **500** – PostgrestError lub inne wyjątki → log (`console.error`/Sentry) + generyczna odpowiedź.

## 8. Rozważania dotyczące wydajności

- Pojedynczy SELECT z indeksem po PK jest O(1) – brak wąskich gardeł.
- Dodać nagłówek `Cache-Control: private, max-age=30` – mikro-cache na kliencie.
- Unikać niepotrzebnych JOINów; wszystkie dane w tabeli `recipes`.

## 9. Etapy wdrożenia

1. **Walidacja**: rozszerzyć `src/lib/validation/recipe.ts` o `recipeIdParamSchema`.
2. **Service**: dodać w `RecipeService` metodę `getRecipeById(id)` z mapowaniem do `RecipeDTO`.
3. **Route**: utworzyć `src/pages/api/recipes/[id].ts`:
   - import Zod, `RecipeService`, `recipeIdParamSchema`.
   - validate params, call service, return response.
4. **Middleware**: upewnić się, że `locals.userId` jest ustawiony (na razie `DEFAULT_USER_ID`).
5. **Testy jednostkowe**:
   - happy path (200)
   - 404 dla nieistniejącego id
   - 403 dla przepisu innego usera (przygotować fixture)
   - 400 dla niepoprawnego UUID
6. **Dokumentacja**: zaktualizować OpenAPI / README.
7. **Monitorowanie**: dodać logi błędów, ewent. Sentry.
8. **Code review & merge**.
9. **Deploy** na środowisko testowe -> produkcja.
