# Specyfikacja architektury modułu autentykacji użytkowników

## 1. Architektura interfejsu użytkownika

### 1.1. Przegląd widoków i nawigacji

| Ścieżka               | Layout             | Przeznaczenie                                          |
| --------------------- | ------------------ | ------------------------------------------------------ |
| `/auth/login`         | `AuthLayout.astro` | Logowanie użytkownika                                  |
| `/auth/register`      | `AuthLayout.astro` | Rejestracja użytkownika                                |
| `/auth/reset-request` | `AuthLayout.astro` | Formularz żądania resetu hasła (podanie e-maila)       |
| `/auth/reset-confirm` | `AuthLayout.astro` | Formularz ustawienia nowego hasła z linku resetującego |
| `* (pozostałe)`       | `Layout.astro`     | Główna aplikacja (wymaga sesji ‑ patrz middleware)     |

- **`AuthLayout.astro`** – minimalistyczny layout bez menu aplikacji, wspólny nagłówek z logo, opcjonalne odnośniki do pozostałych stron auth i powrót do `index.astro`.
- Widoki auth **nie ładują** ciężkich zależności aplikacji (brak Supabase queries do danych biznesowych).
- Po pomyślnym logowaniu/rejestracji użytkownik jest przekierowany na `/recipes` (lub poprzednio żądaną stronę – obsługa w middleware).

### 1.2. Komponenty React (client-side)

| Plik                                        | Odpowiedzialność                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/components/forms/LoginForm.tsx`        | 1. Pólka email + hasło<br/>2. Walidacja klienta<br/>3. Wywołanie `/api/auth/login` |
| `src/components/forms/RegisterForm.tsx`     | Email, hasło, potwierdzenie hasła, zgody RODO<br/>Walidacja + `/api/auth/register` |
| `src/components/forms/ResetRequestForm.tsx` | Email; wysyłka linku resetującego (`/api/auth/reset-request`)                      |
| `src/components/forms/ResetConfirmForm.tsx` | Hasło + potwierdzenie; token z query; `/api/auth/reset-confirm`                    |
| `src/components/AlertAIError.tsx` (reuse)   | Wyświetlanie komunikatów błędów/ sukcesu dla akcji auth                            |

- Wszystkie formularze używają **`react-hook-form`**+`zod` resolvera (spójność z istniejącą walidacją receptury).
- Komponenty komunikują się z backendem poprzez **`fetch`** (POST) i reagują na statusy: `200 OK`, `400 ValidationError`, `401 InvalidCredentials`, `409 UserExists`.
- Spinner z `ui/full-screen-spinner.tsx` pojawia się w stanie oczekiwania na odpowiedź.

### 1.3. Walidacja i komunikaty

| Pole            | Reguły                        | Błąd – komunikat              |
| --------------- | ----------------------------- | ----------------------------- |
| Email           | RFC 5322, max 255 znaków      | „Nieprawidłowy adres e-mail.” |
| Hasło           | ≥ 8 znaków, 1 litera, 1 cyfra | „Hasło zbyt słabe.”           |
| Potwierdź hasło | identyczne z **Hasło**        | „Hasła nie są takie same.”    |

Błędy serwera mapują się na toast/bannery (Shadcn/ui `alert.tsx`).

### 1.4. Scenariusze główne

1. **Rejestracja** – pozytywny, zajęty email, słabe hasło.
2. **Logowanie** – poprawne, zły email/hasło, konto nieaktywne.
3. **Wylogowanie** – kliknięcie w `Header` > `Wyloguj` → `api/auth/logout` → redirect `/auth/login`.
4. **Reset hasła** – żądanie linku, nieznany email, ustawienie nowego hasła, nieważny token.

## 2. Logika backendowa

### 2.1. Struktura endpointów (Astro API Routes)

```
src/pages/api/auth/
  ├─ register.ts       POST
  ├─ login.ts          POST
  ├─ logout.ts         POST
  ├─ reset-request.ts  POST
  └─ reset-confirm.ts  POST
```

- Każdy endpoint przyjmuje `application/json` i zwraca JSON `{ status: 'ok' | 'error', message?: string }`.
- Status HTTP:
  - `200` sukces,
  - `400` błąd walidacji wejścia,
  - `401` nieprawidłowe dane logowania lub token,
  - `409` konflikt (użytkownik już istnieje).

### 2.2. Warstwa usług (`src/lib/services/auth.service.ts`)

| Metoda                      | Opis                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `register(email, password)` | Wywołuje `supabase.auth.signUp`                                      |
| `login(email, password)`    | `supabase.auth.signInWithPassword`                                   |
| `logout()`                  | `supabase.auth.signOut`                                              |
| `requestReset(email)`       | `supabase.auth.resetPasswordForEmail`                                |
| `confirmReset(token, pass)` | `supabase.auth.updateUser({ password: pass })` po weryfikacji tokena |

- Serwis enkapsuluje komunikację z Supabase SDK, dzięki czemu endpoint jest cienki.

### 2.3. Walidacja danych wejściowych

Nowy plik `src/lib/validation/auth.ts` zawiera schematy `zod`:

```ts
export const RegisterSchema = z
  .object({
    email: z.string().email().max(255),
    password: z
      .string()
      .min(8)
      .regex(/(?=.*[A-Za-z])(?=.*\d)/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
// LoginSchema, ResetRequestSchema, ResetConfirmSchema …
```

Endpoint używa schematu → `safeParse` → błąd 400 z listą pól, zgodnie z istniejącym stylem.

### 2.4. Obsługa wyjątków i logowanie

- Wszystkie wyjątki SDK Supabase są łapane i mapowane na przyjazne komunikaty.
- Błędy krytyczne logujemy przez `console.error` (na produkcji – integracja z usługą logowania).

### 2.5. Renderowanie SSR

- Middleware `src/middleware/index.ts` rozszerzamy o:
  1. Odczyt ciasteczka Supabase (`sb:token`) → walidacja sesji.
  2. Jeśli brak sesji i ścieżka wymaga auth (np. zaczyna się od `/recipes`), redirect na `/auth/login` z `?next=`.
- Użytkownik zalogowany widzi link „Wyloguj” w `Header` (komponent już istnieje – dodaj akcję).

## 3. System autentykacji – Supabase

### 3.1. Konfiguracja

- Ustawiamy **Supabase Auth** w trybie **email + password** (disable OAuth).
- Zmienne `.env` (zaczytywane w `astro.config.mjs`):
  - `SUPABASE_URL` – URL projektu,
  - `SUPABASE_ANON_KEY` – klucz publik.

### 3.2. Zarządzanie sesją

- W warstwie klienta korzystamy z `@supabase/auth-helpers-react` (provider w `src/components/AuthProvider.tsx`).
- Po stronie serwera `@supabase/auth-helpers-astro` umożliwia dostęp do `supabaseServerClient` w endpointach i middleware.
- Sesja przechowywana w HTTP-only cookie ustawianym przez Supabase.

### 3.3. Reset hasła

- Supabase wysyła e-mail z linkiem w domenie aplikacji `https://app.example.com/auth/reset-confirm#access_token=…`.
- Hash fragment tokena odczytywany client-side w `ResetConfirmForm.tsx` → przesyłany do `/api/auth/reset-confirm`.

### 3.4. Tabela profili

```
supabase.public.profiles
  id uuid primary key references auth.users (id)
  full_name text
  avatar_url text
  allergies text[]
  calorie_limit int4
  created_at timestamptz default now()
```

- Wypełniana triggerem `on_auth_user_created` (Supabase function) podczas rejestracji.

---

## 4. Kontrakty interfejsów

```ts
// DTOs (src/types.ts)
export interface AuthResponse {
  status: "ok" | "error";
  message?: string;
}

export interface AuthError {
  field?: string;
  message: string;
}
```

## 5. Wpływ na istniejące elementy aplikacji

- Brak zmian w przepływie receptur poza wprowadzeniem ochrony trasy (`middleware`).
- Komponenty `Header.tsx` i `DrawerMenu.tsx` – dodanie przycisku „Wyloguj” i dynamiczna prezentacja linków (Logowanie/Rejestracja vs Nazwa użytkownika).
- Żaden z istniejących serwisów (np. `recipe.service.ts`) nie wymaga zmian – korzystają z tej samej instancji Supabase mającej już sesję.

## 6. Dalsze kroki implementacyjne (poza zakresem specyfikacji)

1. Utworzenie rout z layoutami i stronami.
2. Implementacja formularzy wraz z walidacją.
3. Dodanie endpointów API i serwisu.
4. Aktualizacja middleware i Header.
5. Testy E2E scenariuszy auth (Playwright / Cypress).
