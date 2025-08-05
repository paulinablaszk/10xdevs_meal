import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from '../lib/services/recipe.service';
import { supabaseClient } from '@/db/supabase.client';

describe('RecipeService', () => {
  let service: RecipeService;
  const userId = 'test-user';

  beforeEach(() => {
    service = new RecipeService(supabaseClient, userId);
    vi.clearAllMocks();
  });

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
      await service.listRecipes({ search: 'test' });
      expect(supabaseClient.from).toHaveBeenCalledWith('recipes');
    });

    it('should apply ingredient filter when provided', async () => {
      await service.listRecipes({ 
        ingredient: ['ingredient1'] 
      });
      
      expect(supabaseClient.from).toHaveBeenCalledWith('recipes');
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