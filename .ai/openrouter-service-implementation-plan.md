# Przewodnik implementacji usługi **OpenRouterService**

## 1. Opis usługi

`OpenRouterService` zapewnia jednolity interfejs do komunikacji z API OpenRouter w celu:

1. Wysyłania zapytań czatu (chat completions) do wybranego modelu LLM.
2. Przekazywania system i user promptów zgodnych z wymaganiami OpenRouter.
3. Obsługi `response_format` (sztywne schematy JSON generowane przez model).
4. Zarządzania parametrami modeli (np. `temperature`, `max_tokens`).
5. Standaryzacji obsługi błędów oraz logowania.

Dzięki temu warstwa UI/React może korzystać z prostej, typowanej metody `sendChat`, nie zależąc bezpośrednio od szczegółów API.

---

## 2. Opis konstruktora

```ts
class OpenRouterService {
  constructor(options: {
    apiKey: string;          // Klucz API OpenRouter (wymagany)
    baseUrl?: string;        // Custom endpoint, domyślnie https://openrouter.ai/api/v1
    defaultModel?: string;   // Nazwa domyślnego modelu (np. "openai/gpt-4o" )
    defaultParams?: ModelParams; // Domyślne parametry wysyłane do każdego zapytania
    fetchImpl?: typeof fetch;    // Iniekcja implementacji fetch do łatwiejszego testowania
  })
}
```

**Zachowanie:**
- Waliduje obecność `apiKey` oraz poprawność URL.
- Ustawia bezpieczne domyślne `defaultParams` (`temperature: 0.7`, `top_p: 1`).
- Jeżeli `fetchImpl` nie zostanie podany, używa globalnego `fetch` (w Astro/React dostępny zarówno po stronie klienta, jak i serwera).

---

## 3. Publiczne metody i pola

| Metoda | Sygnatura | Cel |
| ------ | --------- | ---- |
| **`sendChat`** | `(args: SendChatArgs) => Promise<LLMResponse>` | Wyślij pojedyncze zapytanie czatu i zwróć pełną odpowiedź modelu. |
| **`streamChat`** | `(args: SendChatArgs, onDelta: (chunk: string) => void) => Promise<void>` | Strumieniuj odpowiedź token-po-tokenie (Server-Sent Events). |
| **`getModels`** | `() => Promise<ModelMeta[]>` | Pobierz listę dostępnych modeli z API OpenRouter. |
| **`setDefaultModel`** | `(modelName: string) => void` | Zmień model domyślny w trakcie działania aplikacji. |
| **`setDefaultParams`** | `(params: Partial<ModelParams>) => void` | Nadpisz parametry domyślne. |

> **Typy pomocnicze** znajdują się w `src/types.ts`:
> ```ts
> type Role = "system" | "user" | "assistant";
> interface ChatMessage { role: Role; content: string; }
> interface SendChatArgs {
>   messages: ChatMessage[];          // Kolejne wiadomości konwersacji
>   model?: string;                   // Opcjonalnie inny model niż domyślny
>   params?: Partial<ModelParams>;    // Jednorazowe nadpisanie parametrów
>   responseFormat?: JSONSchemaSpec;  // Struktura wymaganej odpowiedzi (patrz niżej)
> }
> ```

---

## 4. Prywatne metody i pola

| Metoda / Pole | Opis |
| ------------- | ---- |
| **`#apiKey`** | Przechowuje klucz API w pamięci tylko-do-odczytu.
| **`#baseUrl`** | Bazowy URL końcówki API.
| **`#buildHeaders()`** | Buduje nagłówki HTTP (`Authorization`, `Content-Type`). Zapewnia brak wycieków w logach. |
| **`#buildPayload()`** | Łączy `messages`, `model`, `params`, `response_format` w payload zgodny z OpenRouter. |
| **`#handleError()`** | Mapuje kody HTTP lub komunikaty błędów OpenRouter na lokalne klasy wyjątków. |
| **`#validateResponse()`** | Jeżeli `response_format` ma `strict: true`, waliduje odpowiedź przy użyciu `ajv` i zwraca błąd `InvalidSchemaError` w razie niezgodności. |

---

## 5. Obsługa błędów

| # | Scenariusz błędu | Rozwiązanie |
|---|------------------|-------------|
| 1 | `401 Unauthorized` – błędny lub wygasły klucz API. | Rzucić `AuthenticationError`; w UI pokazać alert „Nieprawidłowy klucz API”. |
| 2 | `429 Too Many Requests` (rate limit). | Implementacja exponential backoff (np. 3 próby co 2^n s); rzucić `RateLimitError` po wyczerpaniu prób. |
| 3 | `500/502/504` – błąd serwera lub timeout. | Retry z malejącą liczbą prób; logowanie pełnego trace ID. |
| 4 | Niedozwolony model (`model_not_found`). | `ModelNotSupportedError`; UI: „Wybrany model jest niedostępny.” |
| 5 | Niepoprawny `response_format` wygenerowany przez model. | Walidacja AJV ➜ `InvalidSchemaError`; opcjonalnie automatyczna próba ponownego zapytania z instrukcją „strict mode”. |
| 6 | Błąd sieci (brak internetu). | `NetworkError`; UI zachęca do sprawdzenia połączenia. |

Wszystkie wyjątki dziedziczą po bazowej klasie `OpenRouterError`, posiadającej pola `message`, `code`, `statusCode`.

---

## 6. Kwestie bezpieczeństwa

1. **Przechowywanie klucza API** – tylko w zmiennych środowiskowych (`OPENROUTER_API_KEY`). Nie commitujemy do repo.
2. **Szyfrowanie w tranzycie** – wymuszenie `https` oraz `strict-transport-security` po stronie backendu.
3. **Sanityzacja logów** – cenzurujemy treści promptów oraz kluczy API w logach (`***`).
4. **Ochrona przed prompt injection** – filtr/whitelist dla treści systemowych generowanych przez użytkowników; w aplikacji UI ostrzegamy przed wklejaniem poufnych danych.
5. **Walidacja schematów** – `response_format.strict = true` + AJV minimalizuje ryzyko nieoczekiwanego JSON Injection.

---

## 7. Plan wdrożenia krok po kroku

### 7.1 Konfiguracja środowiska

1. Dodaj do `package.json` zależność:
   ```bash
   npm install ajv @types/ajv --save
   ```
2. Utwórz plik `.env` i dodaj:
   ```env
   OPENROUTER_API_KEY="sk-..."
   OPENROUTER_BASE_URL="https://openrouter.ai/api/v1" # opcjonalnie
   ```
3. Zaktualizuj `astro.config.mjs`, aby w środowiskach produkcyjnych zmienne `.env` były dostępne zarówno po stronie serwera, jak i klienta (jeśli wymagane).

### 7.2 Implementacja warstwy serwisowej

1. Utwórz katalog i plik:
   ```
   src/lib/services/openrouter.service.ts
   ```
2. Zaimplementuj klasę `OpenRouterService` zgodnie z sekcjami 2–4.
3. Dodaj eksport instancji z domyślnymi ustawieniami:
   ```ts
   export const openRouter = new OpenRouterService({
     apiKey: import.meta.env.OPENROUTER_API_KEY,
     defaultModel: "openai/gpt-4o"
   });
   ```

### 7.3 Integracja po stronie API (Astro endpoints)

1. W `src/pages/api/...` utwórz endpoint `chat.ts`:
   ```ts
   import type { APIRoute } from "astro";
   import { openRouter } from "@/lib/services/openrouter.service";

   export const POST: APIRoute = async ({ request }) => {
     const body = await request.json();
     const { messages, responseFormat } = body;
     try {
       const res = await openRouter.sendChat({ messages, responseFormat });
       return new Response(JSON.stringify(res), { status: 200 });
     } catch (err) {
       // mapuj lokalne błędy ➜ kod HTTP
       // ...
     }
   };
   ```
2. Zapewnij CORS jeśli endpoint będzie wywoływany z klienta.

### 7.4 Przykłady użycia w komponentach React

```ts
const system = "Jesteś pomocnym asystentem kulinarnym.";
const user = "Podaj przepis na wegańskie brownie.";

const { data, isLoading } = useSWR("/api/chat", () =>
  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "RecipeResponse",
          strict: true,
          schema: {
            type: "object",
            properties: {
              ingredients: { type: "array", items: { type: "string" } },
              steps: { type: "array", items: { type: "string" } },
              kcal: { type: "number" }
            },
            required: ["ingredients", "steps", "kcal"]
          }
        }
      }
    })
  }).then(r => r.json())
);
```

---

## Załącznik: Przykłady konfiguracji żądań OpenRouter

| # | Element | Przykład |
|---|---------|----------|
| 1 | **Komunikat systemowy** | `{ role: "system", content: "Jesteś dietetykiem..." }` |
| 2 | **Komunikat użytkownika** | `{ role: "user", content: "Stwórz jadłospis 2000 kcal" }` |
| 3 | **response_format** | `{ type: "json_schema", json_schema: { name: "MealPlan", strict: true, schema: { /* ... */ } } }` |
| 4 | **Nazwa modelu** | `"openai/gpt-4o"` lub `"google/gemini-pro"` |
| 5 | **Parametry modelu** | `{ temperature: 0.2, max_tokens: 1024, top_p: 0.95 }` |

---

> **Gotowe!** Po wykonaniu powyższych kroków aplikacja w stacku Astro 5 + React 19 będzie mogła bezpiecznie i stabilnie korzystać z OpenRouter do generowania lub uzupełniania treści czatu. 