// This file is used to set up the test environment for Vitest.
// You can use this file to import global styles, set up mocks, etc.

import "@testing-library/jest-dom";
import { vi } from "vitest";
import type { Database } from "@/db/database.types";

type RecipeRow = Database["public"]["Tables"]["recipes"]["Row"];
interface SupabaseResponse {
  data: RecipeRow[];
  count: number;
  error: null | {
    message: string;
    code: string;
  };
}

const mockRecipeData: RecipeRow = {
  id: "1",
  name: "Test Recipe",
  description: "Test Description",
  ingredients: [{ name: "ingredient1", amount: 100, unit: "g" }],
  steps: ["step1"],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: "test-user",
  kcal: 100,
  protein_g: 10,
  fat_g: 5,
  carbs_g: 15,
  is_manual_override: false,
};

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockRecipeData, error: null }),
  then(onFulfilled: (value: SupabaseResponse) => void) {
    onFulfilled({
      data: [mockRecipeData],
      count: 1,
      error: null,
    });
  },
};

vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(() => mockQueryBuilder),
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock("@/lib/services/openrouter.service", () => ({
  openRouter: {
    sendChat: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        kcal: 100,
        protein_g: 10,
        fat_g: 5,
        carbs_g: 20,
      }),
    }),
  },
}));
