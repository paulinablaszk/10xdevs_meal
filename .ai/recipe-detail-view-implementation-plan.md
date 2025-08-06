# Plan implementacji widoku Szczegóły przepisu

## 1. Przegląd

Widok "Szczegóły przepisu" prezentuje pełne dane pojedynczego przepisu (nazwa, opis, lista składników, kroki przygotowania, wartości odżywcze) wraz ze statusem przetwarzania AI. Zapewnia przyjazne UX podczas ładowania (pełnoekranowy spinner) oraz obsługę błędów AI.

## 2. Routing widoku

- Ścieżka: `/recipes/:id`
- Plik strony: `src/pages/recipes/[id].astro`
- Parametr dynamiczny `id` przekazywany do serwisu `RecipeService` oraz komponentu React odpowiedzialnego za wyrenderowanie szczegółów.

## 3. Struktura komponentów

```
RecipeDetailPage (.astro)
│
└── <RecipeDetailView /> (React, client:load)
    ├── <FullScreenSpinner />
    ├── <AlertAIError /> (conditional)
    ├── <header>
    │   └── <h1> & <p>
    ├── <NutritionTable />
    ├── <IngredientsList />
    └── <StepsList />
```

## 4. Szczegóły komponentów

### RecipeDetailView

- **Opis:** Komponent kontenerowy pobierający dane przepisu, przechowujący stan i renderujący pod-komponenty.
- **Elementy główne:** `useEffect` do inicjalnego fetchu, kondycjonalne renderowanie spinnera/błędów, sekcje nagłówka i stopki.
- **Zdarzenia:** brak (display only).
- **Walidacja:** Sprawdzenie poprawności `id` (UUID) zanim wywołamy API; obsługa kodów 401/403/404.
- **Typy:** `RecipeDTO`, `RecipeDetailViewState`.
- **Propsy:** `id: string`.

### NutritionTable

- **Opis:** Tabela wartości odżywczych (kcal, białko, tłuszcze, węglowodany) + znacznik "ręczna korekta".
- **Elementy:** `<table>` z czterema wierszami + opcjonalny badge "Manual override".
- **Zdarzenia:** brak (display only).
- **Walidacja:** liczby >= 0.
- **Typy:** `NutritionDTO`.
- **Propsy:** `{ kcal: number; proteinG: number; fatG: number; carbsG: number; isManualOverride: boolean }`.

### IngredientsList

- **Opis:** Lista składników z ilościami i jednostkami.
- **Elementy:** `<ul>` → `<li>`.
- **Zdarzenia:** brak.
- **Walidacja:** `amount > 0`.
- **Typy:** `IngredientDTO[]`.
- **Propsy:** `{ ingredients: IngredientDTO[] }`.

### StepsList

- **Opis:** Numerowana lista kroków przygotowania.
- **Elementy:** `<ol>` → `<li>`.
- **Zdarzenia:** brak.
- **Walidacja:** co najmniej 1 krok, max 20.
- **Typy:** `string[]`.
- **Propsy:** `{ steps: string[] }`.

### AlertAIError

- **Opis:** Komunikat ostrzegawczy, gdy `aiRun.status === 'error'`.
- **Elementy:** `Shadcn/ui <Alert>` z ikoną ! i tekstem `errorMessage`.
- **Zdarzenia:** brak.
- **Walidacja:** `errorMessage` niepusty.
- **Typy:** `{ message: string }`.
- **Propsy:** `{ message: string }`.

## 5. Typy

```
// Istniejące
import { RecipeDTO, IngredientDTO } from '@/types';

// Nowe
export interface NutritionDTO {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  isManualOverride: boolean;
}

export interface RecipeDetailViewState {
  recipe: RecipeDTO | null;
  loading: boolean;
  error: 'NOT_FOUND' | 'FORBIDDEN' | 'AI_ERROR' | 'NETWORK' | null;
}
```

## 6. Zarządzanie stanem

- **Hook:** `useRecipe(id)` – pobiera `RecipeDTO`, zwraca `{ data, loading, error }` (SWR lub własny fetch + abort).
- **Stan widoku:** zarządzany w `RecipeDetailView` poprzez `useState`/`useReducer`:
  - `recipe`, `loading`, `error`.

## 7. Integracja API

- **GET /api/recipes/{id}** – używany w `useRecipe`.
  - Odpowiedź: `RecipeDTO` (zawiera pola nutrition & isManualOverride).
  - Obsługa kodów: 401 → redirect `/login`, 403 → redirect `/`, 404 → render komponent 404.

## 8. Interakcje użytkownika

1. **Wejście na stronę** → renderuje się `FullScreenSpinner` → po 200ms fetch → dane → widok.
2. **AI zwraca błąd** → renderuje się `AlertAIError` nad treścią.

## 9. Warunki i walidacja

- `id` musi być UUID – walidacja przed fetch.
- API błędy 401/403/404 → obsługa/kierowanie.
- `recipe.ingredients.length >= 1`, `steps.length >= 1` – w przeciwnym razie pokazać informację "Brak danych".
- Wartości odżywcze ≥ 0.

## 10. Obsługa błędów

- **NETWORK** – toast „Nie można połączyć z serwerem”.
- **NOT_FOUND** – przekierowanie do `/recipes` + toast.
- **FORBIDDEN** – przekierowanie `/login`.
- **AI_ERROR** – `AlertAIError` z treścią `recipe.aiErrorMessage`.

## 11. Kroki implementacji

1. **Utwórz komponent React `RecipeDetailView`** w `src/components/views`.
2. **Dodaj custom hook `useRecipe`** w `src/components/hooks`.
3. **Zaimplementuj komponenty prezentacyjne:** `NutritionTable`, `IngredientsList`, `StepsList`, `AlertAIError` w `src/components`.
4. **Zaktualizuj stronę Astro** `src/pages/recipes/[id].astro` – wstrzyknij `<RecipeDetailView client:load />` i usuń placeholder.
5. **Pokryj logikę testami jednostkowymi** dla hooka i serwisu (mock Supabase).
6. **Weryfikacja UX/UI** z projektantem, poprawki stylów.
