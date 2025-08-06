import { z } from "zod";
import type { UnitType, IngredientDTO, RecipeCreateCommand } from "../../types";

// Schemat dla pojedynczego składnika
export const ingredientSchema = z.object({
  name: z.string().min(1).max(150),
  amount: z.number().positive().max(99999),
  unit: z.enum([
    "g",
    "dag",
    "kg",
    "ml",
    "l",
    "łyżeczka",
    "łyżka",
    "szklanka",
    "pęczek",
    "garść",
    "sztuka",
    "plaster",
    "szczypta",
    "ząbek",
  ] as [UnitType, ...UnitType[]]),
}) as z.ZodType<IngredientDTO>;

// Schemat dla tworzenia nowego przepisu
export const recipeCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(65535).nullable().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string()).min(1),
}) as z.ZodType<RecipeCreateCommand>;

// Typ inferowany ze schematu dla type-safety
export type RecipeCreateSchema = z.infer<typeof recipeCreateSchema>;

export const recipeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  sort: z.enum(["created_at", "name", "kcal"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  ingredient: z.array(z.string()).optional(),
});

// Schemat dla parametru id przepisu
export const recipeIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type RecipeIdParam = z.infer<typeof recipeIdParamSchema>;
