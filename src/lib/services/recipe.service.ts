import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { RecipeCreateCommand, RecipeDTO, IngredientDTO, RecipeListQuery } from '../../types';
import { recipeCreateSchema } from '../validation/recipe';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import { nutritionService } from './nutrition.service';

// Przykładowe przepisy do testów z wartościami odżywczymi dla całych dań
export const TEST_RECIPES = {
  CHICKEN_RICE: {
    name: 'Kurczak z ryżem',
    description: 'Prosty i zdrowy obiad bogaty w białko',
    ingredients: [
      { name: 'Pierś z kurczaka', amount: 200, unit: 'g' },
      { name: 'Ryż biały', amount: 100, unit: 'g' },
      { name: 'Brokuły', amount: 150, unit: 'g' },
      { name: 'Oliwa z oliwek', amount: 15, unit: 'ml' },
    ],
    steps: [
      'Ugotuj ryż według instrukcji na opakowaniu',
      'Pokrój kurczaka w kostkę i usmaż na oliwie',
      'Ugotuj brokuły na parze',
      'Połącz wszystkie składniki'
    ],
    nutrition: {
      kcal: 650,
      protein_g: 52,
      fat_g: 28,
      carbs_g: 45
    }
  },
  PROTEIN_SHAKE: {
    name: 'Shake proteinowy',
    description: 'Szybki shake po treningu',
    ingredients: [
      { name: 'Mleko 3.2%', amount: 300, unit: 'ml' },
      { name: 'Banan', amount: 1, unit: 'sztuka' },
      { name: 'Masło orzechowe', amount: 15, unit: 'g' },
    ],
    steps: [
      'Wszystkie składniki zmiksuj w blenderze',
      'Podawaj od razu po przygotowaniu'
    ],
    nutrition: {
      kcal: 380,
      protein_g: 15,
      fat_g: 18,
      carbs_g: 42
    }
  }
} as const;

export class RecipeService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly userId: string = DEFAULT_USER_ID
  ) {}

  async createRecipe(command: RecipeCreateCommand): Promise<RecipeDTO> {
    // 1. Walidacja danych wejściowych
    const validatedData = recipeCreateSchema.parse(command);

    // 2. Sprawdzenie limitu przepisów
    const { count } = await this.supabase
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', this.userId);

    if (count && count >= 100) {
      throw new Error('Przekroczono limit 100 przepisów na użytkownika');
    }

    // 3. Najpierw tworzymy przepis bez wartości odżywczych
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .insert({
        user_id: this.userId,
        name: validatedData.name,
        description: validatedData.description,
        ingredients: validatedData.ingredients as unknown as Database['public']['Tables']['recipes']['Insert']['ingredients'],
        steps: validatedData.steps as unknown as Database['public']['Tables']['recipes']['Insert']['steps'],
        kcal: 0,
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0
      })
      .select()
      .single();

    if (recipeError) {
      throw recipeError;
    }

    if (!recipe) {
      throw new Error('Nie udało się utworzyć przepisu');
    }

    // 4. Obliczamy wartości odżywcze
    try {
      const nutritionValues = await nutritionService.calculateNutrition(validatedData.ingredients, recipe.id);

      // 5. Aktualizujemy przepis o wartości odżywcze
      const { data: updatedRecipe, error: updateError } = await this.supabase
        .from('recipes')
        .update(nutritionValues)
        .eq('id', recipe.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (!updatedRecipe) {
        throw new Error('Nie udało się zaktualizować przepisu o wartości odżywcze');
      }

      // 6. Mapowanie na DTO
      return {
        id: updatedRecipe.id,
        userId: updatedRecipe.user_id,
        name: updatedRecipe.name,
        description: updatedRecipe.description,
        ingredients: updatedRecipe.ingredients as unknown as IngredientDTO[],
        steps: updatedRecipe.steps as unknown as string[],
        kcal: updatedRecipe.kcal ?? 0,
        proteinG: updatedRecipe.protein_g ?? 0,
        fatG: updatedRecipe.fat_g ?? 0,
        carbsG: updatedRecipe.carbs_g ?? 0,
        isManualOverride: updatedRecipe.is_manual_override,
        createdAt: updatedRecipe.created_at,
        updatedAt: updatedRecipe.updated_at,
      };
    } catch (error) {
      // W przypadku błędu AI, usuwamy utworzony przepis
      await this.supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);
      
      throw error;
    }
  }

  async listRecipes(filters: RecipeListQuery) {
    const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc', ingredient } = filters;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('user_id', this.userId);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (ingredient?.length) {
      // Dla każdego składnika dodajemy warunek contains na polu ingredients (JSONB)
      ingredient.forEach(ing => {
        query = query.contains('ingredients', [{ name: ing }]);
      });
    }

    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: recipes, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      page,
      limit,
      total: count || 0,
      results: recipes.map(recipe => ({
        id: recipe.id,
        userId: recipe.user_id,
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients as unknown as IngredientDTO[],
        steps: recipe.steps as unknown as string[],
        kcal: recipe.kcal ?? 0,
        proteinG: recipe.protein_g ?? 0,
        fatG: recipe.fat_g ?? 0,
        carbsG: recipe.carbs_g ?? 0,
        isManualOverride: recipe.is_manual_override,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
      })),
    };
  }

  async getRecipeById(id: string): Promise<RecipeDTO> {
    // 1. Pobierz przepis bez filtrowania po user_id aby móc zwrócić 403 jeśli należy do innego użytkownika
    const { data: recipe, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('NOT_FOUND');
      }
      throw error;
    }

    // 2. Sprawdź czy przepis należy do zalogowanego użytkownika
    if (recipe.user_id !== this.userId) {
      throw new Error('FORBIDDEN');
    }

    // 3. Mapowanie na DTO
    return {
      id: recipe.id,
      userId: recipe.user_id,
      name: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients as unknown as IngredientDTO[],
      steps: recipe.steps as unknown as string[],
      kcal: recipe.kcal ?? 0,
      proteinG: recipe.protein_g ?? 0,
      fatG: recipe.fat_g ?? 0,
      carbsG: recipe.carbs_g ?? 0,
      isManualOverride: recipe.is_manual_override,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    };
  }

  private async calculateNutrition(recipe: RecipeCreateCommand) {
    return nutritionService.calculateNutrition(recipe.ingredients);
  }
} 