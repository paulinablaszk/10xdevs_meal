import { useEffect, useState } from 'react';
import type { RecipeDTO } from '@/types';
import { FullScreenSpinner } from '@/components/ui/full-screen-spinner';
import { AlertAIError } from '@/components/AlertAIError';
import { NutritionTable } from '@/components/NutritionTable';
import { IngredientsList } from '@/components/IngredientsList';
import { StepsList } from '@/components/StepsList';

interface RecipeDetailViewProps {
  id: string;
}

interface RecipeDetailViewState {
  recipe: RecipeDTO | null;
  loading: boolean;
  error: 'NOT_FOUND' | 'FORBIDDEN' | 'AI_ERROR' | 'NETWORK' | null;
}

export function RecipeDetailView({ id }: RecipeDetailViewProps) {
  const [state, setState] = useState<RecipeDetailViewState>({
    recipe: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      setState(prev => ({ ...prev, error: 'NOT_FOUND', loading: false }));
      return;
    }

    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`);
        
        if (!response.ok) {
          switch (response.status) {
            case 401:
              window.location.href = '/login';
              return;
            case 403:
              window.location.href = '/';
              return;
            case 404:
              setState(prev => ({ ...prev, error: 'NOT_FOUND', loading: false }));
              return;
            default:
              throw new Error('Network error');
          }
        }

        const recipe = await response.json();
        setState({ recipe, loading: false, error: null });
      } catch (error) {
        setState(prev => ({ ...prev, error: 'NETWORK', loading: false }));
      }
    };

    fetchRecipe();
  }, [id]);

  if (state.loading) {
    return <FullScreenSpinner />;
  }

  if (state.error === 'NETWORK') {
    return <AlertAIError message="Nie można połączyć z serwerem" />;
  }

  if (state.error === 'NOT_FOUND') {
    // Przekierowanie do /recipes po 3 sekundach
    useEffect(() => {
      const timer = setTimeout(() => {
        window.location.href = '/recipes';
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return <AlertAIError message="Przepis nie został znaleziony. Za chwilę nastąpi przekierowanie..." />;
  }

  if (!state.recipe) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {state.recipe.aiStatus === 'error' && (
        <AlertAIError message={state.recipe.aiErrorMessage || 'Wystąpił błąd podczas przetwarzania AI'} />
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{state.recipe.name}</h1>
        {state.recipe.description && (
          <p className="text-gray-600">{state.recipe.description}</p>
        )}
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <IngredientsList ingredients={state.recipe.ingredients} />
        <NutritionTable 
          kcal={state.recipe.kcal ?? 0}
          proteinG={state.recipe.proteinG ?? 0}
          fatG={state.recipe.fatG ?? 0}
          carbsG={state.recipe.carbsG ?? 0}
          isManualOverride={state.recipe.isManualOverride}
        />
      </div>

      <div className="mt-8">
        <StepsList steps={state.recipe.steps} />
      </div>
    </div>
  );
} 