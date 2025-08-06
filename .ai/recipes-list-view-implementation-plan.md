# Plan implementacji widoku Lista Przepisów

## 1. Przegląd

Widok „Lista Przepisów” umożliwia zalogowanemu użytkownikowi przegląd, wyszukiwanie oraz paginację jego prywatnych przepisów. Głównym celem jest szybka orientacja w dostępnych recepturach, możliwość przejścia do szczegółów lub dodania nowego przepisu oraz prezentacja podstawowych danych odżywczych (kcal, makro).

## 2. Routing widoku

| Ścieżka    | Plik strony Astro               | Notatki                                              |
| ---------- | ------------------------------- | ---------------------------------------------------- |
| `/recipes` | `src/pages/recipes/index.astro` | Dostępna wyłącznie po zalogowaniu (middleware auth). |

## 3. Struktura komponentów

```
RecipeListView (React)
├── HeaderBar
│   ├── SearchBar
│   └── AddRecipeButton
├── FilterDrawer (opcjonalnie później)
├── RecipeListContainer
│   ├── RecipeCard (×n)
│   └── LoadMoreButton / Spinner
└── EmptyState (gdy results.length === 0)
```

## 4. Szczegóły komponentów

### RecipeListView

- **Opis:** Komponent–kontener odpowiedzialny za pobranie danych, zarządzanie stanem listy i renderowanie pod‐komponentów.
- **Główne elementy:** `HeaderBar`, `FilterDrawer`, `RecipeListContainer`.
- **Interakcje:**
  - Inicjalny fetch (page 1).
  - Aktualizacja `query` przy kliknięciu **Szukaj** w `SearchBar`.
  - Załaduj kolejną stronę przy kliknięciu `LoadMoreButton`.
- **Walidacja:** limit ≤50, page ≥1 (obsługa błędów 400 backendu).
- **Typy:** `RecipeListState`, `RecipeListActions` (patrz §5).
- **Propsy:** none (montowany bezpośrednio w widoku).

### HeaderBar

- **Opis:** Pasek górny listy przepisów.
- **Główne elementy:** `SearchBar`, `AddRecipeButton` (disabled ≥100 przepisów).
- **Interakcje:**
  - Propaguje `onSearch(term)` do `RecipeListView`.
- **Walidacja:** Debounce 300 ms w `SearchBar`, wysyłka zapytania _po_ kliknięciu **Szukaj**.
- **Typy:** `HeaderBarProps { recipeCount: number; onSearch(term: string): void }`.

### SearchBar

- **Opis:** Pole tekstowe + przycisk **Szukaj**.
- **Główne elementy:** `<Input />`, `<Button />` (Shadcn/ui).
- **Interakcje:** wewnętrzny debounce 300 ms, zewnętrzne onSearch emitowane tylko po kliknięciu.

### AddRecipeButton

- **Opis:** Przyciski „Dodaj przepis”.
- **Walidacja:** disabled gdy `recipeCount >= 100`, tooltip „Osiągnięto limit 100 przepisów”.

### FilterDrawer _(nice-to-have)_

- **Opis:** Boczne menu filtrów (składniki, sortowanie). Zawarte w planie- dostarczyć w kolejnej iteracji.

### RecipeListContainer

- **Opis:** Wrapper dla listy kart + obsługa paginacji.
- **Interakcje:** Klik `LoadMoreButton`, obserwacja `isLoading`.

### RecipeCard

- **Opis:** Reprezentacja jednego przepisu.
- **Główne elementy:** `<Card>` (Shadcn), nazwa, kcal, protein, fat, carbs, data.
- **Interakcje:** Kliknięcie całej karty → przejście do `/recipes/{id}`.
- **Walidacja:** Gdy pola makro `null` ⇒ placeholder „–” + badge „Obliczanie…”.
- **Propsy:** `recipe: RecipeListItemVM`.

### LoadMoreButton

- **Opis:** Ładuje kolejną stronę.
- **Interakcje:** onClick → `fetchNextPage()`.
- **Walidacja:** disabled gdy `isLoading || !hasNextPage`.

### EmptyState

- **Opis:** Wyświetlany, gdy `results.length === 0`.
- **Główne elementy:** tekst informacyjny + CTA `AddRecipeButton`.

## 5. Typy

```
// Request query (już istnieje w src/types.ts)
RecipeListQuery

// Widokowy model pozycji listy
export interface RecipeListItemVM {
  id: string;
  name: string;
  kcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  createdAt: string; // ISO
  aiStatus: "pending" | "done" | "error";
}

// Stan hooka useRecipeList
interface RecipeListState {
  recipes: RecipeListItemVM[];
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  isError: boolean;
  search: string;
}
```

## 6. Zarządzanie stanem

- **useRecipeList** (custom hook)
  - Przechowuje `RecipeListState`.
  - Dostarcza akcje: `search(term)`, `loadMore()`, `refresh()`.
  - Internally wykonuje fetch z `/api/recipes` i podmienia / dokleja wyniki.
  - Zapobiega równoległym zapytaniom przez `isLoading` lock.
  - Memoizuje/normalizuje dane do `RecipeListItemVM`.
- **React Context?** Niewymagany – stan lokalny dla widoku.

## 7. Integracja API

| Akcja UI     | Metoda | URL          | Query params                    |
| ------------ | ------ | ------------ | ------------------------------- |
| initial load | GET    | /api/recipes | `page=1&limit=20`               |
| search       | GET    | /api/recipes | `page=1&limit=20&search={term}` |
| load more    | GET    | /api/recipes | `page={page+1}&limit=20&...`    |

- **Typ odpowiedzi:** `{ page, limit, total, results: RecipeDTO[] }`.
- **Mapowanie:** `RecipeDTO → RecipeListItemVM`.
- **Obsługa błędów HTTP:** 401 → redirect do /login, 429 → Toast „Za dużo żądań”, 500 → komponent `AlertAIError`.

## 8. Interakcje użytkownika

1. Użytkownik wpisuje frazę, klika **Szukaj** → lista filtruje wyniki.
2. Użytkownik przewija na dół i klika **Załaduj więcej** → pobierana kolejna strona.
3. Użytkownik klika kartę → nawigacja do `/recipes/{id}`.
4. Brak wyników → `EmptyState` z przyciskiem **Dodaj przepis**.
5. Po osiągnięciu 100 przepisów `AddRecipeButton` disabled + tooltip.

## 9. Warunki i walidacja

- `AddRecipeButton` disabled gdy `recipeCount >= 100`.
- `LoadMoreButton` disabled gdy `isLoading` lub `hasNextPage === false`.
- `SearchBar` wysyła query tylko po kliknięciu **Szukaj**.
- Pola makro `null` ⇒ placeholder + badge „Obliczanie…”.

## 10. Obsługa błędów

| Scenariusz            | UI                                                   |
| --------------------- | ---------------------------------------------------- |
| 401 Unauthorized      | Redirect do `/login`.                                |
| 429 Too Many Requests | Toast + opcjonalne retry after.                      |
| 500 lub network error | `AlertAIError` z możliwością ponownej próby.         |
| Brak internetu        | Offline indicator (PWA fallback, poza zakresem MVP). |

## 11. Kroki implementacji

1. **Routing & strona Astro**: utworzyć `src/pages/recipes/index.astro` i zaimportować `<RecipeListView client:react />`.
2. **Typy**: dodać `RecipeListItemVM` w `src/types.ts` lub lokalnie w hooku.
3. **Hook useRecipeList**: `src/components/hooks/useRecipeList.ts`.
4. **Komponenty UI**:
   - `RecipeListView.tsx` w `src/components/views`.
   - `HeaderBar`, `SearchBar`, `AddRecipeButton`, `RecipeCard`, `LoadMoreButton`, `EmptyState`.
5. **Integracja API**: wykorzystać native `fetch`, wrapper w hooku.
6. **Stylowanie**: Tailwind + Shadcn/ui.
7. **Middleware auth**: upewnić się, że `/recipes` wymaga JWT (middleware już część projektu).
8. **Testy jednostkowe**: mock fetch w `useRecipeList` (React Testing Library + MSW).
9. **Testy e2e (Cypress/Playwright)**: scenariusze search → load more.
10. **Dokumentacja**: zaktualizować README i Storybook wpisy dla nowych komponentów.
11. **Code Review & QA**.
