# Architektura UI dla MealPlanner MVP

## 1. Przegląd struktury UI

MealPlanner MVP składa się z pięciu głównych widoków osadzonych w układzie single-page (Astro + React 19) z responsywnym gridem Tailwind. Główny kontener `Layout` renderuje pasek nagłówka z ikoną hamburgera, strefę toasts oraz główny obszar routingu React Router. Wszystkie dane są pobierane przez TanStack Query (SW-R) i cache’owane w pamięci przeglądarki.

## 2. Lista widoków

### 2.1 Formularz logowania / rejestracji

- **Ścieżka**: `/login`
- **Cel**: Uwierzytelnienie użytkownika oraz utworzenie konta.
- **Kluczowe informacje**: pola `email`, `hasło`, przełącznik _Zaloguj / Zarejestruj_, link „Zapomniałeś hasła?” (out of scope).
- **Kluczowe komponenty**: `AuthForm`, `Button`, `Input`, `AlertError`.
- **UX / A11Y / Bezpieczeństwo**:
  - Klawisz Enter wysyła formularz.
  - Błąd 401/400 wyświetlany w komponencie `AlertError`.
  - Pola oznaczone `aria-invalid` przy błędnych danych.
  - Zapobieganie XSS poprzez server-side render Astro.

### 2.2 Lista przepisów

- **Ścieżka**: `/recipes`
- **Cel**: Przegląd i wyszukiwanie prywatnych przepisów użytkownika.
- **Kluczowe informacje**: nazwa, kcal, białko, tłuszcze, węglowodany, data dodania.
- **Kluczowe komponenty**: `RecipeCard`, `SearchBar`, `LoadMoreButton`, `EmptyState`, `DrawerMenu`.
- **UX / A11Y / Bezpieczeństwo**:
  - Infinite scroll / „Załaduj więcej” (keyset paginacja) z blokadą podczas ładowania.
  - Debounce 300 ms w `SearchBar`, zapytanie wysyłane po kliknięciu **Szukaj** (decyzja #1 nierozstrzygnięta — przyjęto kliknięcie Szukaj).
  - Gdy `results.length === 0` wyświetlany `EmptyState` z CTA „Dodaj przepis”.
  - Przy 100 przepisach komponent `AddRecipeButton` disabled z tooltipem „Osiągnięto limit 100 przepisów”.

### 2.3 Dodawanie przepisu

- **Ścieżka**: `/recipes/new`
- **Cel**: Wprowadzenie składników i kroków, walidacja oraz zapis.
- **Kluczowe informacje**: pola `name`, `description`, lista składników (nazwa, ilość, jednostka), lista kroków.
- **Kluczowe komponenty**: `RecipeForm`, `IngredientRow`, `UnitSelect`, `StepsTextarea`, `Button`, `DrawerMenu`.
- **UX / A11Y / Bezpieczeństwo**:
  - Walidacja Zod + komunikaty inline.
  - Jednostki pobierane 1× przy starcie (`GET /api/units`) i wykorzystywane w `UnitSelect`.
  - Po `202 Accepted` natychmiastowy `navigate('/recipes/:id')` + `FullScreenSpinner`.
  - CSRF ograniczone przez cookie SameSite=Lax.

### 2.4 Szczegóły przepisu

- **Ścieżka**: `/recipes/:id`
- **Cel**: Wyświetlenie pełnych danych przepisu, statusu AI, opcji edycji i usunięcia.
- **Kluczowe informacje**: wszystkie pola przepisu + status AI.
- **Kluczowe komponenty**: `NutritionTable`, `IngredientsList`, `StepsList`, `AlertAIError`, `ButtonEdit`, `ButtonDelete`, `FullScreenSpinner`.
- **UX / A11Y / Bezpieczeństwo**:
  - Jeśli `ai_run.status === 'error'` pokazuje się `AlertAIError` z treścią `errorMessage`.
  - Przy ładowaniu widoku (po redirect) widoczny `FullScreenSpinner` do pierwszego 200.
  - `ModalConfirmDelete` z focus-trapem i klawiszem ESC.

## 3. Mapa podróży użytkownika

1. **Nieautoryzowany** → `/login` — użytkownik loguje się lub rejestruje.
2. **Po zalogowaniu** → redirect do `/recipes`.
3. Użytkownik może:
   a. Kliknąć **Dodaj przepis** (o ile <100) → `/recipes/new` → zapis → redirect `/recipes/:id` → powrót strzałką/hamburgerem.
   b. Kliknąć kartę przepisu na liście → `/recipes/:id` → edytować lub usunąć.
   c. Wyszukać przepisy poprzez `SearchBar`.
   d. Wylogować się przez `DrawerMenu` (link `Wyloguj`).

## 4. Układ i struktura nawigacji

```
<App>
 ├─ <Header>
 │   ├─ <HamburgerIcon onClick=toggleDrawer />
 │   └─ <Logo />
 ├─ <DrawerMenu>   « Recipes | Dodaj przepis | Wyloguj
 ├─ <ToastContainer />  « globalne toasty (np. 429)
 └─ <RouterOutlet />    « dynamiczne widoki opisane w §2
```

- `DrawerMenu` (shadcn/ui `Sheet`) zamyka się po wyborze linku lub kliknięciu poza.
- Przy szerokości ≥768 px menu renderuje się jako horyzontalny `NavBar`.

## 5. Kluczowe komponenty wielokrotnego użytku

| Komponent            | Przeznaczenie                                                 |
| -------------------- | ------------------------------------------------------------- |
| `Layout`             | Wspólny wrapper – nagłówek, menu, obszar treści, toasty       |
| `AuthForm`           | Formularz logowanie/rejestracja z przełącznikiem trybu        |
| `RecipeCard`         | Pozycja listy z nazwą i makro                                 |
| `RecipeForm`         | Złożony formularz dodawania/edycji przepisu                   |
| `UnitSelect`         | Select jednokrotnego wyboru jednostki (dane z `/api/units`)   |
| `LoadMoreButton`     | Przyciski infinite scroll / ręczne ładowanie następnej strony |
| `FullScreenSpinner`  | Loader pełnoekranowy podczas fetch/redirect                   |
| `AlertAIError`       | Alert w widoku detalu gdy `ai_run.status=error`               |
| `Toast`              | Globalne powiadomienia – szczególnie kod 429                  |
| `ModalConfirmDelete` | Potwierdzenie usunięcia z focus-trap                          |
