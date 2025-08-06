# API Endpoint Implementation Plan: POST /api/recipes

## 1. Przegląd punktu końcowego

Tworzy nowy przepis powiązany z aktualnie zalogowanym użytkownikiem oraz uruchamia asynchroniczny proces AI (rekord w `ai_runs`) do obliczenia wartości odżywczych. Zwraca pełny obiekt przepisu.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **URL**: `/api/recipes`
- **Nagłówki**:
  - `Authorization: Bearer <Supabase JWT>` – wymagany
  - `Content-Type: application/json`
- **Body (JSON)**:

```jsonc
{
  "name": "Chicken salad", // string, 1-120 znaków, wymagane
  "description": "High-protein...", // string, ≤ 65 535 znaków, opcjonalne
  "ingredients": [
    // min 1 element
    { "name": "Chicken breast", "amount": 200, "unit": "g" },
  ],
  "steps": ["Season the chicken"], // min 1 krok, max ∞, wymagane
}
```

- **Walidacja pola `ingredients`**
  - `name`: string, 1-150 znaków
  - `amount`: liczba > 0, maks. 99 999
  - `unit`: jedno z `unit_type` (pobierane z DB)

## 3. Wykorzystywane typy

- `IngredientDTO`
- `RecipeCreateCommand`
- `RecipeDTO` (odpowiedź)
- Enum `UnitType`

## 4. Szczegóły odpowiedzi

| Kod | Opis             | Treść                                        |
| --- | ---------------- | -------------------------------------------- |
| 201 | Utworzono        | `RecipeDTO`                                  |
| 400 | Błędne dane      | `{ error: "Bad Request", details }`          |
| 401 | Brak autoryzacji | `{ error: "Unauthorized" }`                  |
| 409 | Limit przepisów  | `{ error: "Conflict", message }`             |
| 422 | Błąd AI          | `{ error: "Unprocessable Entity", message }` |
| 500 | Błąd serwera     | `{ error: "Internal Server Error" }`         |

## 5. Przepływ danych

1. Middleware uwierzytelnia token Supabase i wstrzykuje `supabase` do `locals`.
2. Handler POST:
   1. Parse & validate JSON (Zod schema `recipeCreateSchema`).
   2. Oblicz liczbę istniejących przepisów użytkownika (`≤100`). Jeśli limit przekroczony → **409**.
   3. Wstaw rekord do `recipes` (kolumny `kcal`, `protein_g`, `fat_g`, `carbs_g` null), pobierz `id`.
   4. Wstaw rekord `ai_runs` (`status = 'pending'`).
   5. Wyemituj event/queue (np. Supabase Function lub cron) do obliczenia AI.
   6. Zwróć `201` z pełnym rekordem przepisu (wartości odżywcze null/0).

## 6. Względy bezpieczeństwa

- Autoryzacja po JWT.
- Upsert/INSERT z `user_id` z tokena – brak możliwości oszukania.
- Walidacja danych wejściowych (Zod) chroni przed SQL i XXE.
- JSONB sanitization dla `ingredients`, `steps`.

## 7. Obsługa błędów

- **400**: schemat Zod – zwracamy listę błędów.
- **409**: wyjątek z triggera DB `enforce_recipe_limit` lub manualne sprawdzenie.
- **422**: AI service zwróciło błąd – handler kolejki ustawi status `error`, ale endpoint może zwrócić 201; override ‑> przy następnych GET okaże się.
- **500**: nieoczekiwane wyjątki – logowanie via `@supabase/logs` lub własny wrapper.

## 8. Rozważania dotyczące wydajności

- Batch insert (recipes + ai_runs) w transakcji.
- Indeks na `recipes(user_id, created_at)` już zapewnia szybkie listowanie.

## 9. Etapy wdrożenia

1. **Schemat Zod** – `src/lib/validation/recipe.ts`.
2. **Service** – `src/lib/services/recipe.service.ts` z metodą `createRecipe` (DB + AI enqueue).
3. **API Route** – `src/pages/api/recipes/index.ts` obsługujący POST.
4. **Middleware** – upewnij się, że `locals.supabase` istnieje i daje `user`.
