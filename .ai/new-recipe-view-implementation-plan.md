# Plan implementacji widoku: Dodaj nowy przepis

## 1. Przegląd

Celem tego widoku jest umożliwienie użytkownikom dodawania nowych przepisów do systemu. Widok będzie zawierał formularz do wprowadzania nazwy, opisu, listy składników (z ilością i jednostką) oraz kroków przygotowania. Po pomyślnej walidacji i przesłaniu, dane zostaną wysłane do API, a użytkownik zostanie przekierowany na stronę nowo utworzonego przepisu, gdzie w tle rozpocznie się proces analizy AI w celu obliczenia wartości odżywczych.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/recipes/new`

## 3. Struktura komponentów

Hierarchia komponentów dla widoku dodawania przepisu będzie wyglądać następująco:

```
src/pages/recipes/new.astro
└── src/components/views/RecipeNewView.tsx
    ├── h1 (Tytuł strony)
    └── components/forms/RecipeForm.tsx
        ├── Input (dla nazwy przepisu)
        ├── Textarea (dla opisu)
        ├── h3 (Tytuł sekcji "Składniki")
        ├── IngredientRow.tsx (mapowane po liście składników)
        │   ├── Input (nazwa składnika)
        │   ├── Input (ilość)
        │   └── UnitSelect.tsx (jednostka)
        │   └── Button (usuwanie składnika)
        ├── Button (dodawanie nowego składnika)
        ├── h3 (Tytuł sekcji "Kroki")
        ├── StepsTextarea.tsx (dla kroków przygotowania)
        └── Button (zapisz przepis)
```

## 4. Szczegóły komponentów

### `RecipeNewView.tsx`

- **Opis**: Główny komponent widoku, który renderuje cały interfejs strony `/recipes/new`. Jest odpowiedzialny za inicjalizację logiki formularza i wyświetlanie nagłówka.
- **Główne elementy**: `<RecipeForm />`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje wszystko do `RecipeForm`.
- **Typy**: Brak.
- **Propsy**: Brak.

### `RecipeForm.tsx`

- **Opis**: Sercem widoku jest ten komponent formularza, który zarządza stanem całego przepisu, obsługuje walidację i komunikuje się z API. Wykorzystuje customowy hook `useRecipeForm` do enkapsulacji logiki.
- **Główne elementy**: `Input` (Shadcn/ui), `Textarea` (Shadcn/ui), `Button` (Shadcn/ui), `IngredientRow`, `StepsTextarea`.
- **Obsługiwane interakcje**:
  - Wprowadzanie danych w polach formularza.
  - Dodawanie i usuwanie wierszy składników.
  - Przesłanie formularza.
- **Obsługiwana walidacja**:
  - `name`: Wymagane, minimum 3 znaki.
  - `ingredients`: Musi zawierać co najmniej jeden składnik. Każdy składnik musi mieć poprawnie wypełnione wszystkie pola.
- **Typy**: `RecipeFormViewModel`, `RecipeCreateCommand`.
- **Propsy**: Brak.

### `IngredientRow.tsx`

- **Opis**: Reprezentuje pojedynczy wiersz na liście składników. Umożliwia użytkownikowi wprowadzenie nazwy, ilości i jednostki dla jednego składnika.
- **Główne elementy**: `Input` (dla nazwy i ilości), `UnitSelect`, `Button` (do usunięcia wiersza).
- **Obsługiwane interakcje**:
  - `onChange` na polach `name` i `amount`.
  - `onValueChange` na komponencie `UnitSelect`.
  - `onClick` na przycisku usuwania.
- **Obsługiwana walidacja**:
  - `name`: Wymagane.
  - `amount`: Wymagane, musi być liczbą większą od 0.
  - `unit`: Wymagane.
- **Typy**: `IngredientViewModel`.
- **Propsy**:
  - `ingredient: IngredientViewModel`
  - `index: number`
  - `onUpdate: (index: number, field: string, value: any) => void`
  - `onRemove: (index: number) => void`
  - `errors: FieldErrors<IngredientViewModel>`

### `UnitSelect.tsx`

- **Opis**: Komponent `select` do wyboru jednostki miary. Pobiera listę dostępnych jednostek z API przy pierwszym renderowaniu.
- **Główne elementy**: `Select` z `Shadcn/ui`.
- **Obsługiwane interakcje**: `onValueChange`.
- **Typy**: `UnitType[]`.
- **Propsy**:
  - `value: UnitType`
  - `onChange: (value: UnitType) => void`

### `StepsTextarea.tsx`

- **Opis**: Pole tekstowe do wprowadzania kroków przygotowania przepisu. Kroki powinny być oddzielone nowymi liniami.
- **Główne elementy**: `Textarea` z `Shadcn/ui`.
- **Obsługiwane interakcje**: `onChange`.
- **Typy**: `string`.
- **Propsy**:
  - `value: string`
  - `onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void`

## 5. Typy

### `IngredientViewModel`

Reprezentuje stan pojedynczego składnika w formularzu. Jest identyczny z `IngredientDTO`, ale używany w kontekście stanu formularza.

```typescript
interface IngredientViewModel {
  name: string;
  amount: number | string; // Może być stringiem podczas edycji
  unit: UnitType;
}
```

### `RecipeFormViewModel`

Główny model widoku dla formularza. Reprezentuje dane, które użytkownik wprowadza, zanim zostaną one przekonwertowane na `RecipeCreateCommand` i wysłane do API.

```typescript
interface RecipeFormViewModel {
  name: string;
  description: string;
  ingredients: IngredientViewModel[];
  steps: string; // Kroki jako pojedynczy string, dzielony nowymi liniami
}
```

### `RecipeCreateCommand` (istniejący typ)

DTO używane do wysłania danych do `POST /api/recipes`. Przed wysłaniem, `RecipeFormViewModel` jest transformowany do tego typu (głównie `steps` ze `string` na `string[]`).

```typescript
interface RecipeCreateCommand {
  name: string;
  description?: string | null;
  ingredients: IngredientDTO[];
  steps: string[];
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem formularza zostanie zrealizowane przy użyciu biblioteki `react-hook-form` w połączeniu z `@hookform/resolvers/zod` do walidacji.

Zostanie stworzony customowy hook `useRecipeForm`, który będzie zawierał:

- **`useForm` hook**: Inicjalizacja z `RecipeFormViewModel` jako domyślnymi wartościami.
- **Schemat Zod**: Definicja reguł walidacji dla `RecipeFormViewModel`.
- **`useFieldArray`**: Do zarządzania dynamiczną listą składników (`ingredients`).
- **Funkcje pomocnicze**:
  - `addIngredient()`: Dodaje nowy, pusty obiekt składnika do tablicy.
  - `removeIngredient(index)`: Usuwa składnik z tablicy.
  - `onSubmit(data: RecipeFormViewModel)`: Funkcja obsługująca wysyłkę formularza. Transformuje dane z `RecipeFormViewModel` do `RecipeCreateCommand`, wywołuje API i obsługuje przekierowanie.
- **Zwracane wartości**: Hook zwróci `register`, `handleSubmit`, `errors`, `control` (dla `useFieldArray`), `isSubmitting` oraz funkcje do zarządzania składnikami.

## 7. Integracja API

### `GET /api/units`

- **Cel**: Pobranie listy dostępnych jednostek miary.
- **Kiedy**: Wywoływane jednorazowo w komponencie `UnitSelect` przy jego pierwszym załadowaniu (np. w `useEffect` lub przy użyciu `react-query`/`swr` do cachowania).
- **Odpowiedź**: `UnitsDTO` (czyli `UnitType[]`).
- **Obsługa**: Pobrane dane zasilą opcje w każdym `UnitSelect`.

### `POST /api/recipes`

- **Cel**: Zapisanie nowego przepisu.
- **Kiedy**: Wywoływane po pomyślnej walidacji front-endowej i kliknięciu przycisku "Zapisz przepis".
- **Żądanie (Request Body)**: Obiekt typu `RecipeCreateCommand`.
- **Odpowiedź (Success - 202 Accepted)**: Obiekt `{ recipe: RecipeDTO }`. Po otrzymaniu odpowiedzi, aplikacja natychmiast przekieruje użytkownika na stronę `/recipes/{recipe.id}`. Na czas ładowania nowej strony zostanie wyświetlony `FullScreenSpinner`.
- **Odpowiedź (Error)**: Patrz sekcja "Obsługa błędów".

## 8. Interakcje użytkownika

- **Wprowadzanie tekstu**: Użytkownik wpisuje dane w polach `name`, `description` oraz w polach składników. Stan jest zarządzany przez `react-hook-form`.
- **Dodawanie składnika**: Użytkownik klika przycisk "Dodaj składnik". Do formularza dodawany jest nowy, pusty `IngredientRow`.
- **Usuwanie składnika**: Użytkownik klika ikonę kosza obok składnika. `IngredientRow` jest usuwany z formularza.
- **Wysyłanie formularza**: Użytkownik klika "Zapisz przepis".
  - Jeśli walidacja nie przejdzie, komunikaty o błędach pojawią się pod odpowiednimi polami.
  - Jeśli walidacja przejdzie, przycisk jest blokowany, a formularz jest wysyłany.
  - Po sukcesie następuje przekierowanie.
  - W razie błędu API, wyświetlany jest komunikat (np. toast).

## 9. Warunki i walidacja

- **Warunki na poziomie UI**:
  - Przycisk "Zapisz przepis" jest wyłączony (`disabled`), gdy formularz jest w trakcie wysyłania (`isSubmitting`).
  - Przycisk "Usuń składnik" jest widoczny tylko, gdy w formularzu jest więcej niż jeden składnik.
- **Walidacja (Zod schema)**:
  - `name`: `string().min(3, "Nazwa musi mieć co najmniej 3 znaki")`
  - `description`: `string().optional()`
  - `ingredients`: `array(object({...})).min(1, "Przepis musi zawierać co najmniej jeden składnik")`
    - `name`: `string().min(1, "Nazwa składnika jest wymagana")`
    - `amount`: `coerce.number().gt(0, "Ilość musi być większa od 0")`
    - `unit`: `nativeEnum(UnitType)`
  - `steps`: `string()` (transformowany do `string[]` przed wysłaniem)

Komunikaty o błędach walidacji będą wyświetlane inline, bezpośrednio pod polami, których dotyczą.

## 10. Obsługa błędów

- **Błędy walidacji (front-end)**: Obsługiwane przez `react-hook-form` i Zod. Komunikaty są wyświetlane przy polach.
- **Błędy API (`POST /api/recipes`)**:
  - **400 (Validation failed)**: Wyświetlenie generycznego komunikatu typu toast: "Błąd walidacji po stronie serwera. Sprawdź wprowadzone dane." Ten błąd nie powinien wystąpić przy poprawnej walidacji front-endowej.
  - **401 (Unauthenticated)**: Przekierowanie na stronę logowania.
  - **429 (Recipe quota exceeded)**: Wyświetlenie komunikatu typu toast: "Przekroczono limit przepisów na użytkownika."
  - **Błąd sieciowy/inny błąd serwera**: Wyświetlenie generycznego komunikatu typu toast: "Wystąpił błąd. Spróbuj ponownie później."

## 11. Kroki implementacji

1.  **Struktura plików**: Utworzenie pliku `src/pages/recipes/new.astro` oraz komponentu `src/components/views/RecipeNewView.tsx`.
2.  **Komponenty UI**: Stworzenie szkieletów komponentów: `RecipeForm.tsx`, `IngredientRow.tsx`, `UnitSelect.tsx` i `StepsTextarea.tsx` z użyciem komponentów z `Shadcn/ui`.
3.  **Integracja `UnitSelect`**: Zaimplementowanie w `UnitSelect.tsx` logiki pobierania i cachowania jednostek z `GET /api/units`.
4.  **Logika formularza**: Stworzenie customowego hooka `useRecipeForm.ts`, w którym zostanie zdefiniowany schemat walidacji Zod i cała logika `react-hook-form` (w tym `useFieldArray`).
5.  **Połączenie stanu z UI**: Połączenie `useRecipeForm` z komponentem `RecipeForm.tsx`, przekazanie `register`, `errors` etc. do odpowiednich pól i komponentów (`IngredientRow`).
6.  **Obsługa wysyłki**: Implementacja funkcji `onSubmit` w `useRecipeForm`, która będzie transformować dane i wysyłać je do `POST /api/recipes`.
7.  **Obsługa odpowiedzi API**: Implementacja logiki obsługi odpowiedzi `202 Accepted` (przekierowanie z `FullScreenSpinner`) oraz obsługa błędów (wyświetlanie toastów).
8.  **Stylowanie i A11Y**: Dopracowanie wyglądu za pomocą Tailwind CSS, upewnienie się, że wszystkie elementy formularza mają etykiety, a stany `focus` są poprawnie obsłużone.
9.  **Testowanie**: Ręczne przetestowanie wszystkich ścieżek użytkownika, walidacji i obsługi błędów.
