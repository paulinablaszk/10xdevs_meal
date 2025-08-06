import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Ładowanie zmiennych z .env.test
const env = dotenv.config({ path: path.resolve(process.cwd(), ".env.test") }).parsed || {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Dodajemy dłuższy timeout dla akcji
    actionTimeout: 60000,
    // Włączamy debugowanie
    headless: false,
    launchOptions: {
      slowMo: 1000, // Spowalniamy akcje o 1s dla lepszej widoczności
    },
  },
  // Dodajemy globalny timeout dla testów
  timeout: 60000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...env,
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_PUBLIC_KEY: env.SUPABASE_PUBLIC_KEY,
    },
  },
});
