import { TEST_RECIPES } from '../lib/services/recipe.service';
import { describe, it, expect, vi } from 'vitest';
import { RecipeService } from '../lib/services/recipe.service';
import type { RecipeDTO } from '../types';

const testRecipe = {
  ...TEST_RECIPES.CHICKEN_RICE,
  // Pomijamy pole nutrition, które jest tylko dla mocka
  nutrition: undefined
};

async function testCreateRecipe() {
  try {
    console.log('Wysyłam przepis:', JSON.stringify(testRecipe, null, 2));

    const response = await fetch('http://localhost:3000/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecipe)
    });

    const data = await response.json();
    console.log('\nStatus:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uruchom test
testCreateRecipe();

describe('RecipeService', () => {
  // Mock dla SupabaseClient
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          ilike: vi.fn(() => ({
            contains: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: '1',
                      name: 'Test Recipe',
                      description: 'Test Description',
                      ingredients: [{ name: 'ingredient1', amount: 100, unit: 'g' }],
                      steps: ['step1'],
                      created_at: new Date().toISOString(),
                      user_id: 'test-user',
                      kcal: 100,
                      protein_g: 10,
                      fat_g: 5,
                      carbs_g: 15
                    }
                  ],
                  count: 1,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  };

  const userId = 'test-user';
  const service = new RecipeService(mockSupabase as any, userId);

  describe('listRecipes', () => {
    it('should return paginated recipes with default parameters', async () => {
      const result = await service.listRecipes({});
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        results: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'Test Recipe'
          })
        ])
      });
    });

    it('should apply search filter when provided', async () => {
      const result = await service.listRecipes({ search: 'test' });
      
      expect(mockSupabase.from).toHaveBeenCalled();
      expect(result.results).toHaveLength(1);
    });

    it('should apply ingredient filter when provided', async () => {
      const result = await service.listRecipes({ 
        ingredient: ['ingredient1'] 
      });
      
      expect(mockSupabase.from).toHaveBeenCalled();
      expect(result.results).toHaveLength(1);
    });

    it('should handle custom pagination parameters', async () => {
      const result = await service.listRecipes({ 
        page: 2, 
        limit: 10 
      });
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });
}); 