import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Rozszerzamy interfejs Window o __env
declare global {
  interface Window {
    __env?: {
      SUPABASE_URL?: string;
      SUPABASE_PUBLIC_KEY?: string;
    };
  }
}

// Sprawdzamy czy jesteśmy po stronie klienta
const isBrowser = typeof window !== "undefined";

// Jeśli jesteśmy w przeglądarce, używamy zmiennych z window.__env
// W przeciwnym razie używamy import.meta.env
const supabaseUrl = isBrowser ? window.__env?.SUPABASE_URL : import.meta.env.SUPABASE_URL;

const supabaseAnonKey = isBrowser
  ? window.__env?.SUPABASE_PUBLIC_KEY
  : import.meta.env.SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Authentication features will not work.");
}

export const supabaseClient = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: isBrowser ? window.localStorage : undefined,
  },
  global: {
    headers: {
      "x-client-info": "meal-planner",
    },
  },
});

// Tymczasowo przywracamy DEFAULT_USER_ID do czasu pełnej migracji
export const DEFAULT_USER_ID = "77cba856-5259-4019-96c3-6044e8e993d3";
