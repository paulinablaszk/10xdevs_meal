import { type JSONSchemaSpec } from "@/types";
import Ajv from "ajv";

type Role = "system" | "user" | "assistant";

interface ChatMessage {
  role: Role;
  content: string;
}

interface ModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface SendChatArgs {
  messages: ChatMessage[];
  model?: string;
  params?: Partial<ModelParams>;
  responseFormat?: JSONSchemaSpec;
}

interface LLMResponse {
  content: string;
  model: string;
  created_at: string;
}

interface ModelMeta {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}

// Bazowa klasa błędu
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// Specyficzne typy błędów
export class AuthenticationError extends OpenRouterError {
  constructor(message = "Nieprawidłowy klucz API") {
    super(message, "authentication_error", 401);
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message = "Przekroczono limit zapytań") {
    super(message, "rate_limit_error", 429);
  }
}

export class ModelNotSupportedError extends OpenRouterError {
  constructor(model: string) {
    super(`Model ${model} jest niedostępny`, "model_not_found", 404);
  }
}

export class NetworkError extends OpenRouterError {
  constructor(message = "Błąd sieci - sprawdź połączenie internetowe") {
    super(message, "network_error", 503);
  }
}

export class InvalidSchemaError extends OpenRouterError {
  constructor(message = "Nieprawidłowy format odpowiedzi") {
    super(message, "invalid_schema", 422);
  }
}

export class OpenRouterService {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  #defaultModel: string;
  #defaultParams: ModelParams;
  readonly #fetchImpl: typeof fetch;
  readonly #ajv: Ajv;

  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    defaultParams?: ModelParams;
    fetchImpl?: typeof fetch;
  }) {
    if (!options.apiKey) {
      throw new Error("Wymagany jest klucz API");
    }

    this.#apiKey = options.apiKey;
    this.#baseUrl = options.baseUrl || "https://openrouter.ai/api/v1";
    this.#defaultModel = options.defaultModel || "openai/gpt-4o";
    this.#defaultParams = {
      temperature: 0.7,
      top_p: 1,
      ...options.defaultParams,
    };
    this.#fetchImpl = options.fetchImpl || fetch;
    this.#ajv = new Ajv();
  }

  /**
   * Buduje nagłówki HTTP dla zapytań do OpenRouter API.
   * Zapewnia poprawne uwierzytelnienie i ukrywa wrażliwe dane w logach.
   */
  #buildHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.#apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": import.meta.env.PROD ? import.meta.env.SITE : "http://localhost:4321",
      "X-Title": "10xDevs Meal Planner",
    };
  }

  /**
   * Buduje payload żądania zgodny z wymaganiami OpenRouter API.
   */
  #buildPayload(args: SendChatArgs): Record<string, unknown> {
    return {
      model: args.model || this.#defaultModel,
      messages: args.messages,
      ...this.#defaultParams,
      ...(args.params || {}),
      ...(args.responseFormat ? { response_format: args.responseFormat } : {}),
    };
  }

  /**
   * Obsługuje błędy HTTP i API, mapując je na odpowiednie klasy wyjątków.
   */
  async #handleError(response: Response): Promise<never> {
    try {
      const data = await response.json();
      const message = data.error?.message || "Nieznany błąd API";
      const code = data.error?.type || "unknown_error";

      switch (response.status) {
        case 401:
          throw new AuthenticationError(message);
        case 429:
          throw new RateLimitError(message);
        case 404:
          if (code === "model_not_found") {
            throw new ModelNotSupportedError(message);
          }
          break;
        case 500:
        case 502:
        case 504:
          throw new NetworkError("Błąd serwera OpenRouter - spróbuj ponownie za chwilę");
      }

      throw new OpenRouterError(message, code, response.status);
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new NetworkError("Nie udało się przetworzyć odpowiedzi z serwera");
    }
  }

  /**
   * Waliduje odpowiedź modelu względem zadanego schematu JSON.
   * Rzuca InvalidSchemaError jeśli odpowiedź nie spełnia schematu.
   */
  #validateResponse(content: string, schema?: JSONSchemaSpec): void {
    if (!schema?.json_schema.strict) return;

    try {
      const parsed = JSON.parse(content);

      if (typeof parsed !== "object") {
        throw new InvalidSchemaError("Odpowiedź nie jest obiektem JSON");
      }

      const validate = this.#ajv.compile(schema.json_schema.schema);
      const valid = validate(parsed);

      if (!valid) {
        const errors = validate.errors
          ?.map((err) => `${err.instancePath}: ${err.message}`)
          .join(", ");

        throw new InvalidSchemaError(`Odpowiedź nie spełnia schematu: ${errors}`);
      }
    } catch (error) {
      if (error instanceof InvalidSchemaError) {
        throw error;
      }
      throw new InvalidSchemaError(
        error instanceof Error ? error.message : "Nie udało się zwalidować odpowiedzi"
      );
    }
  }

  /**
   * Wysyła pojedyncze zapytanie czatu do OpenRouter API.
   * Obsługuje retry dla błędów przejściowych i walidację odpowiedzi.
   */
  async sendChat(args: SendChatArgs): Promise<LLMResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    // Jeśli wymagany jest format JSON, dodajemy instrukcję do promptu systemowego
    if (args.responseFormat?.json_schema) {
      const schema = JSON.stringify(args.responseFormat.json_schema.schema, null, 2);
      const systemMessage = args.messages.find((m) => m.role === "system");

      if (systemMessage) {
        systemMessage.content += `\n\nOdpowiadaj zawsze w formacie JSON zgodnym z poniższym schematem:\n${schema}`;
      } else {
        args.messages.unshift({
          role: "system",
          content: `Odpowiadaj zawsze w formacie JSON zgodnym z poniższym schematem:\n${schema}`,
        });
      }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.#fetchImpl(`${this.#baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.#buildHeaders(),
          body: JSON.stringify(
            this.#buildPayload({
              ...args,
              // Tymczasowo wyłączamy response_format do czasu pełnego wsparcia
              responseFormat: undefined,
            })
          ),
        });

        if (!response.ok) {
          await this.#handleError(response);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new OpenRouterError("Nieprawidłowa struktura odpowiedzi", "invalid_response", 500);
        }

        // Jeśli wymagany jest format JSON, walidujemy odpowiedź
        if (args.responseFormat?.json_schema) {
          this.#validateResponse(content, args.responseFormat);
        }

        return {
          content,
          model: data.model,
          created_at: new Date(data.created).toISOString(),
        };
      } catch (error) {
        lastError = error as Error;

        // Retry tylko dla błędów sieciowych i rate limit
        if (error instanceof NetworkError || error instanceof RateLimitError) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError || new Error("Nieznany błąd");
  }

  /**
   * Strumieniuje odpowiedź z modelu token po tokenie.
   * Nie obsługuje response_format (zawsze plain text).
   */
  async streamChat(args: SendChatArgs, onDelta: (chunk: string) => void): Promise<void> {
    const payload = this.#buildPayload({ ...args, responseFormat: undefined });
    const response = await this.#fetchImpl(`${this.#baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        ...this.#buildHeaders(),
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ ...payload, stream: true }),
    });

    if (!response.ok) {
      await this.#handleError(response);
    }

    if (!response.body) {
      throw new NetworkError("Brak strumienia odpowiedzi");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onDelta(content);
            }
          } catch (e) {
            console.warn("Błąd parsowania chunka SSE:", e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Pobiera listę dostępnych modeli z ich metadanymi.
   */
  async getModels(): Promise<ModelMeta[]> {
    const response = await this.#fetchImpl(`${this.#baseUrl}/models`, {
      headers: this.#buildHeaders(),
    });

    if (!response.ok) {
      await this.#handleError(response);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Zmienia domyślny model używany przez serwis.
   */
  setDefaultModel(modelName: string): void {
    this.#defaultModel = modelName;
  }

  /**
   * Aktualizuje domyślne parametry modelu.
   */
  setDefaultParams(params: Partial<ModelParams>): void {
    this.#defaultParams = {
      ...this.#defaultParams,
      ...params,
    };
  }
}

// Eksport domyślnej instancji
export const openRouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "openai/gpt-4o-mini",
});
