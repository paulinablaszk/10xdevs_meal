# API Endpoint Implementation Plan: GET /api/recipes

## 1. Przegląd punktu końcowego
Zwraca stronicowaną listę przepisów zalogowanego użytkownika z możliwością filtrowania po składnikach, pełnotekstowego wyszukiwania po nazwie, sortowania oraz określenia kierunku sortowania.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **URL:** /api/recipes
- **Parametry query string:**
  - **Wymagane**: brak (domyślne wartości `page` i `limit` zostaną nadane automatycznie)
  - **Opcjonalne**:
    | Parametr    | Typ / Zakres                     | Domyślnie | Opis |
    |-------------|----------------------------------|-----------|------|
    | `page`      | integer ≥ 1                      | 1         | Numer strony (1-based) |
    | `limit`     | integer 1-50                    | 20        | Liczba rekordów na stronę |
    | `search`    | string                           | –         | Pełnotekstowe wyszukiwanie w polu `name` |
    | `ingredient`| string (powtarzalny)             | –         | Lista nazw składników – przepis musi zawierać **wszystkie** podane nazwy |
    | `sort`      | enum `name\|created_at\|kcal`  | `created_at` | Pole sortowania |
    | `order`     | enum `asc\|desc`                | `desc`    | Kierunek sortowania |

## 3. Wykorzystywane typy
- **DTO**: `RecipeDTO` (już istnieje w `src/types.ts`).
- **Query model**: rozszerzony `RecipeListQuery` (dodać `ingredient?: string[]`).
- **Service return type**: `{ page: number; limit: number; total: number; results: RecipeDTO[] }`.

## 4. Szczegóły odpowiedzi
```jsonc
{
  "page": 1,
  "limit": 20,
  "total": 42,
  "results": [ /* RecipeDTO[] */ ]
}
```
- **Statusy HTTP**:
  - `200 OK` – sukces
  - `400 Bad Request` – nieprawidłowe parametry zapytania
  - `401 Unauthorized` – brak/niepoprawny JWT
  - `429 Too Many Requests` – przekroczono limit 60 RPM
  - `500 Internal Server Error` – błąd serwera

## 5. Przepływ danych
1. Middleware (`src/middleware`) dołącza instancję Supabase do `context.locals` + w przyszłości weryfikuje JWT i ustawia `locals.user`.
2. Handler `GET /api/recipes`:
   1. Parsuje i waliduje parametry query za pomocą Zod (`recipeListQuerySchema`).
   2. Tworzy `RecipeService` z `locals.supabase` i `locals.user.id` (tymczasowo `DEFAULT_USER_ID`).
   3. Wywołuje `listRecipes(filters)` → otrzymuje `{page, limit, total, results}`.
   4. Zwraca odpowiedź JSON z kodem `200`.
3. `RecipeService.listRecipes`:
   1. Przelicza `offset = (page-1)*limit`.
   2. Buduje zapytanie Supabase:
      - `from('recipes').select('id, name, ...', { count:'exact' })`
      - `.eq('user_id', userId)`
      - `.ilike('name', '%' + search + '%')` (gdy `search`)
      - `.contains('ingredients', [{ name: 'X' }])` dla każdego `ingredient` (JSONB @>)
      - `.order(sort, { ascending: order==='asc' })`
      - `.range(offset, offset+limit-1)`
   3. Mapuje wiersze DB → `RecipeDTO` (jak w `createRecipe`).
   4. Zwraca obiekt listy.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Wymagany ważny JWT; brak ⇒ 401.
- **Autoryzacja:** Filtr `user_id = currentUser.id` uniemożliwia dostęp do cudzych przepisów.
- **Walidacja danych:** Wszystkie parametry przechodzą przez Zod; limitowane zakresy zapobiegają atakom DoS.
- **SQL Injection:** Supabase query builder parametryzuje dane – niskie ryzyko.
- **Rate-limiting:** Skonfigurować np. w Cloudflare / Edge Functions na 60 RPM ➔ 429.
- **Ochrona danych wrażliwych:** Endpoint nie zwraca danych prywatnych (np. `user_id`).

## 7. Obsługa błędów
| Scenariusz | Kod | Treść JSON |
|------------|-----|------------|
| `page <1`, `limit>50`, zły `sort`, zły `order` | 400 | `{ "error":"Invalid query parameter", "details":[...] }` |
| Brak JWT / token wygasł | 401 | `{ "error":"Unauthenticated" }` |
| Zbyt wiele żądań | 429 | `{ "error":"Rate limit exceeded" }` |
| Błąd Supabase lub inny nieprzewidziany | 500 | `{ "error":"Internal Server Error" }` |

## 8. Rozważania dotyczące wydajności
- **Indeksy**: GIN na `ingredients`, GIN/GIN Trigram na `name` (pełnotekstowe).
- **Paginacja**: `range` + `count:'exact'` – dla dużych tabel rozważyć `count:'planned'`.
- **Limit 50**: Chroni przed nieoptymalnymi, ciężkimi zapytaniami.
- **Cache**: Możliwy `Cache-Control: private, max-age=30` przy małej dynamice.

## 9. Etapy wdrożenia
1. **Typy & Walidacja**
   - [ ] Rozszerzyć `RecipeListQuery` w `src/types.ts` o `ingredient?: string | string[]`.
   - [ ] Dodać `recipeListQuerySchema` (Zod) w `src/lib/validation/recipe.ts`.
2. **Service**
   - [ ] Utworzyć metodę `listRecipes(filters)` w `src/lib/services/recipe.service.ts`.
3. **API Route**
   - [ ] W pliku `src/pages/api/recipes/index.ts` dodać handler `export const GET`.
4. **Middleware JWT** (poza zakresem endpointu, ale zalecane)
   - [ ] Walidacja JWT i ustawienie `locals.user.id`.
5. **Testy**
   - [ ] Dodać testy jednostkowe `listRecipes` (mock Supabase) w `src/test/recipe.test.ts`.
   - [ ] Dodać testy e2e GET /api/recipes (Supertest lub fetch against dev server).
6. **Dokumentacja**
   - [ ] Zaktualizować README i OpenAPI/Swagger (jeśli istnieje).
7. **Monitoring & Logging**
   - [ ] Dodać structured logging błędów w handlerze (np. consola + Sentry w prod).

--- 