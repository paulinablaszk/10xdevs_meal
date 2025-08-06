import { useState } from 'react';
import { useRecipeList } from '../hooks/useRecipeList';
import { RecipeCard } from './RecipeCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AlertAIError } from '../AlertAIError';
import { X } from 'lucide-react';

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

  const [searchInput, setSearchInput] = useState('');
  const hasNextPage = recipes.length < total;
  const isAddDisabled = total >= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchInput);
  };

  const handleClear = () => {
    setSearchInput('');
    search('');
  };

  if (isError) {
    return (
      <AlertAIError 
        title="Błąd podczas ładowania przepisów"
        message="Nie udało się pobrać listy przepisów. Spróbuj ponownie później."
      />
    );
  }

  if (recipes.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Brak przepisów</h2>
        <p className="text-muted-foreground mb-8" data-testid="empty-recipes-message">
          {searchInput.trim() !== "" 
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSubmit} className="flex w-full sm:w-auto gap-2">
          <Input
            type="search"
            placeholder="Szukaj przepisów..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-80"
          />
          <Button type="submit">
            Szukaj
          </Button>
          {searchInput && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Wyczyść
            </Button>
          )}
        </form>

        <Button 
          asChild
          variant="default"
          disabled={isAddDisabled}
          className="w-full sm:w-auto"
        >
          <a 
            href="/recipes/new"
            title={isAddDisabled ? "Osiągnięto limit 100 przepisów" : undefined}
          >
            Dodaj przepis
          </a>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="recipe-list">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => loadMore()} 
            disabled={isLoading}
          >
            {isLoading ? "Ładowanie..." : "Załaduj więcej"}
          </Button>
        </div>
      )}
    </div>
  );
}; 