import { config } from "dotenv";
import path from "path";

// Ładowanie zmiennych z .env.test
const result = config({ path: path.resolve(process.cwd(), ".env.test") });
const env = result.parsed || {};

// Logowanie stanu zmiennych środowiskowych (bez wrażliwych danych)
console.log("Environment variables loaded:", {
  SUPABASE_URL: env.SUPABASE_URL ? "✓" : "✗",
  SUPABASE_PUBLIC_KEY: env.SUPABASE_PUBLIC_KEY ? "✓" : "✗",
  E2E_USERNAME: env.E2E_USERNAME ? "✓" : "✗",
  E2E_USERNAME_ID: env.E2E_USERNAME_ID ? "✓" : "✗",
  E2E_PASSWORD: env.E2E_PASSWORD ? "✓" : "✗",
});

export const TEST_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL as string,
  supabaseKey: process.env.SUPABASE_PUBLIC_KEY as string,
  testUser: {
    id: process.env.E2E_USERNAME_ID as string,
    email: process.env.E2E_USERNAME as string,
    password: process.env.E2E_PASSWORD as string,
  },
};

// Sprawdzenie, czy wszystkie wymagane zmienne środowiskowe są zdefiniowane
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_PUBLIC_KEY",
  "E2E_USERNAME_ID",
  "E2E_USERNAME",
  "E2E_PASSWORD",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
