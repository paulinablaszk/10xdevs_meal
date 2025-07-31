import { useRecipeList } from '../hooks/useRecipeList';
import { HeaderBar } from './HeaderBar';
import { RecipeCard } from './RecipeCard';
import { Button } from '../ui/button';
import { AlertAIError } from '../AlertAIError';

export const RecipeListView = () => {
  const { 
    recipes, 
    total, 
    isLoading, 
    isError, 
    search: searchTerm,
    search,
    loadMore,
    refresh 
  } = useRecipeList();

  const hasNextPage = recipes.length < total;

  if (isError) {
    return (
      <AlertAIError 
        title="Błąd podczas ładowania przepisów"
        description="Nie udało się pobrać listy przepisów. Spróbuj ponownie później."
        onRetry={refresh}
      />
    );
  }

  if (recipes.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Brak przepisów</h2>
        <p className="text-gray-600 mb-8">
          {searchTerm 
            ? "Nie znaleziono przepisów spełniających kryteria wyszukiwania." 
            : "Nie masz jeszcze żadnych przepisów. Dodaj swój pierwszy przepis!"}
        </p>
        <Button asChild>
          <a href="/recipes/new">Dodaj przepis</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeaderBar recipeCount={total} onSearch={search} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={loadMore} 
            disabled={isLoading}
          >
            {isLoading ? "Ładowanie..." : "Załaduj więcej"}
          </Button>
        </div>
      )}
    </div>
  );
}; 