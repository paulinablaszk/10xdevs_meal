import { useState, useEffect } from 'react';
import type { RecipeDTO } from '@/types';

interface UseRecipeResult {
  data: RecipeDTO | null;
  loading: boolean;
  error: 'NOT_FOUND' | 'FORBIDDEN' | 'AI_ERROR' | 'NETWORK' | null;
}

export function useRecipe(id: string): UseRecipeResult {
  const [data, setData] = useState<RecipeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UseRecipeResult['error']>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          switch (response.status) {
            case 401:
              window.location.href = '/login';
              return;
            case 403:
              window.location.href = '/';
              return;
            case 404:
              setError('NOT_FOUND');
              return;
            default:
              throw new Error('Network error');
          }
        }

        const recipe = await response.json();
        setData(recipe);
        setError(null);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setError('NETWORK');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();

    return () => {
      controller.abort();
    };
  }, [id]);

  return { data, loading, error };
} 