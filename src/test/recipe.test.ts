import { describe, it, expect, beforeEach, vi } from "vitest";
import { RecipeService } from "../lib/services/recipe.service";
import { supabaseClient } from "@/db/supabase.client";
import { nutritionService } from "@/lib/services/nutrition.service";
import type { RecipeCreateCommand } from "@/types";
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

describe("RecipeService", () => {
  let service: RecipeService;
  const userId = "test-user";

  const mockRecipeData: RecipeRow = {
    id: "1",
    name: "Test Recipe",
    description: "Test Description",
    ingredients: [{ name: "ingredient1", amount: 100, unit: "g" }],
    steps: ["step1"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: userId,
    kcal: 100,
    protein_g: 10,
    fat_g: 5,
    carbs_g: 15,
    is_manual_override: false,
  };

  beforeEach(() => {
    service = new RecipeService(supabaseClient, userId);
    vi.clearAllMocks();

    // Domyślny mock dla from().select()
    vi.spyOn(supabaseClient, "from").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      }),
      then(onFulfilled: (value: SupabaseResponse) => void) {
        onFulfilled({
          data: [mockRecipeData],
          count: 1,
          error: null,
        });
      },
    });
  });

  describe("listRecipes", () => {
    it("should return paginated recipes with default parameters", async () => {
      const result = await service.listRecipes({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "1",
            name: "Test Recipe",
          }),
        ]),
      });
    });

    it("should apply search filter when provided", async () => {
      await service.listRecipes({ search: "test" });
      expect(supabaseClient.from).toHaveBeenCalledWith("recipes");
    });

    it("should apply ingredient filter when provided", async () => {
      await service.listRecipes({
        ingredient: ["ingredient1"],
      });

      expect(supabaseClient.from).toHaveBeenCalledWith("recipes");
    });

    it("should handle custom pagination parameters", async () => {
      const result = await service.listRecipes({
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe("getRecipeById", () => {
    it("should return recipe by id", async () => {
      const recipe = await service.getRecipeById("1");

      expect(recipe).toEqual(
        expect.objectContaining({
          id: "1",
          name: "Test Recipe",
          userId: userId,
        })
      );
    });

    it("should throw NOT_FOUND error when recipe does not exist", async () => {
      vi.spyOn(supabaseClient, "from").mockReturnValueOnce({
        ...supabaseClient.from("recipes"),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue({ code: "PGRST116", message: "NOT_FOUND" }),
      });

      await expect(service.getRecipeById("999")).rejects.toThrow("NOT_FOUND");
    });

    it("should throw FORBIDDEN error when recipe belongs to different user", async () => {
      vi.spyOn(supabaseClient, "from").mockReturnValueOnce({
        ...supabaseClient.from("recipes"),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockRecipeData,
            user_id: "different-user",
          },
          error: null,
        }),
      });

      await expect(service.getRecipeById("1")).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("createRecipe", () => {
    const mockRecipe: RecipeCreateCommand = {
      name: "New Recipe",
      description: "Test Description",
      ingredients: [{ name: "ingredient1", amount: 100, unit: "g" }],
      steps: ["step1"],
    };

    it("should create recipe with nutrition values", async () => {
      const mockNutrition = {
        kcal: 100,
        protein_g: 10,
        fat_g: 5,
        carbs_g: 15,
      };

      // Mock dla pierwszego wywołania - tworzenie przepisu
      const createMock = vi.fn().mockResolvedValue({
        data: {
          id: "1",
          user_id: userId,
          name: mockRecipe.name,
          description: mockRecipe.description,
          ingredients: mockRecipe.ingredients,
          steps: mockRecipe.steps,
          created_at: new Date().toISOString(),
          kcal: 0,
          protein_g: 0,
          fat_g: 0,
          carbs_g: 0,
        },
        error: null,
      });

      // Mock dla drugiego wywołania - aktualizacja wartości odżywczych
      const updateMock = vi.fn().mockResolvedValue({
        data: {
          id: "1",
          user_id: userId,
          name: mockRecipe.name,
          description: mockRecipe.description,
          ingredients: mockRecipe.ingredients,
          steps: mockRecipe.steps,
          created_at: new Date().toISOString(),
          ...mockNutrition,
        },
        error: null,
      });

      vi.spyOn(nutritionService, "calculateNutrition").mockResolvedValue(mockNutrition);

      vi.spyOn(supabaseClient, "from").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockImplementationOnce(createMock) // Pierwsze wywołanie - insert
          .mockImplementationOnce(updateMock), // Drugie wywołanie - update
      });

      const result = await service.createRecipe(mockRecipe);

      expect(result).toEqual(
        expect.objectContaining({
          name: mockRecipe.name,
          description: mockRecipe.description,
          kcal: mockNutrition.kcal,
          proteinG: mockNutrition.protein_g,
          fatG: mockNutrition.fat_g,
          carbsG: mockNutrition.carbs_g,
        })
      );
    });

    it("should delete recipe if nutrition calculation fails", async () => {
      vi.spyOn(nutritionService, "calculateNutrition").mockRejectedValue(new Error("AI Error"));
      const deleteSpy = vi.spyOn(supabaseClient.from("recipes"), "delete");

      await expect(service.createRecipe(mockRecipe)).rejects.toThrow("AI Error");
      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  describe("createRecipe validation", () => {
    const baseMockRecipe: RecipeCreateCommand = {
      name: "New Recipe",
      description: "Test Description",
      ingredients: [{ name: "ingredient1", amount: 100, unit: "g" }],
      steps: ["step1"],
    };

    it("should throw validation error if name is missing", async () => {
      const mockRecipe = { ...baseMockRecipe, name: "" };
      await expect(service.createRecipe(mockRecipe)).rejects.toThrow();
    });

    it("should throw validation error if ingredients are missing", async () => {
      const mockRecipe = { ...baseMockRecipe, ingredients: [] };
      await expect(service.createRecipe(mockRecipe)).rejects.toThrow();
    });

    it("should throw validation error if steps are missing", async () => {
      const mockRecipe = { ...baseMockRecipe, steps: [] };
      await expect(service.createRecipe(mockRecipe)).rejects.toThrow();
    });
  });
});
