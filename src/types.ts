import type { Database } from './db/database.types';

/**
 * Re-eksport wybranych typów z Supabase dla wygody.
 */
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type RecipeRow = Database['public']['Tables']['recipes']['Row'];
export type AiRunRow = Database['public']['Tables']['ai_runs']['Row'];
export type UnitType = Database['public']['Enums']['unit_type'];
export type AiStatus = Database['public']['Enums']['ai_status'];

/**
 * Util: konwersja snake_case → camelCase przy pomocy typów szablonowych.
 */
type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
  : S;

/**
 * Util: mapuje wszystkie klucze obiektu na camelCase.
 */
type RenameKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

/* -------------------------------------------------------------------------- */
/*                                 PROFILE                                   */
/* -------------------------------------------------------------------------- */

/**
 * DTO zwracany z API dla profilu użytkownika.
 */
export type ProfileDTO = RenameKeys<ProfileRow>;

/**
 * Model komendy tworzenia profilu (POST /api/profile).
 */
export type ProfileCreateCommand = Pick<ProfileDTO, 'calorieTarget' | 'allergens'>;

/**
 * Model komendy aktualizacji profilu (PUT/PATCH /api/profile).
 * Wszystkie pola opcjonalne, aby umożliwić częściową aktualizację.
 */
export type ProfileUpdateCommand = Partial<ProfileCreateCommand>;

/* -------------------------------------------------------------------------- */
/*                                   UNITS                                   */
/* -------------------------------------------------------------------------- */

/**
 * DTO zwracany z API /api/units – po prostu lista dopuszczalnych jednostek.
 */
export type UnitsDTO = UnitType[];

/* -------------------------------------------------------------------------- */
/*                                INGREDIENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * Reprezentacja pojedynczego składnika w recepturze.
 */
export interface IngredientDTO {
  name: string;
  amount: number;
  unit: UnitType;
}

/* -------------------------------------------------------------------------- */
/*                                  RECIPE                                    */
/* -------------------------------------------------------------------------- */

type RecipeBaseDTO = RenameKeys<RecipeRow>;

/**
 * Pełny DTO receptury zwracany z API.
 */
export type RecipeDTO = Omit<RecipeBaseDTO, 'ingredients' | 'steps'> & {
  ingredients: IngredientDTO[];
  steps: string[];
};

/**
 * Model komendy tworzenia receptury (POST /api/recipes).
 */
export interface RecipeCreateCommand {
  name: string;
  description?: string | null;
  ingredients: IngredientDTO[];
  steps: string[];
}

/**
 * Model komendy aktualizacji receptury (PUT/PATCH /api/recipes/{id}).
 * Dzięki Partial wszystkie pola są opcjonalne.
 */
export type RecipeUpdateCommand = Partial<RecipeCreateCommand>;

/**
 * Model komendy ręcznej korekty wartości odżywczych (PATCH /api/recipes/{id}/nutrition).
 */
export interface RecipeNutritionOverrideCommand {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

/**
 * Parametry query string dla listingu /api/recipes.
 */
export interface RecipeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'created_at' | 'name' | 'kcal';
  order?: 'asc' | 'desc';
}

/* -------------------------------------------------------------------------- */
/*                                   AI RUN                                   */
/* -------------------------------------------------------------------------- */

/**
 * DTO pojedynczego zadania AI (GET /api/ai-runs/{id}).
 */
export type AiRunDTO = RenameKeys<AiRunRow>; 