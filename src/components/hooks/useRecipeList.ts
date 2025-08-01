import { useState, useCallback, useEffect } from 'react';
import type { RecipeDTO, RecipeListQuery, AiStatus } from '@/types';
import type { RecipeListState, RecipeListItemVM, RecipeListActions } from '../views/types';

const DEFAULT_LIMIT = 20;

const mapToViewModel = (recipe: RecipeDTO): RecipeListItemVM => {
  return {
    id: recipe.id,
    name: recipe.name,
    kcal: recipe.kcal ?? null,
    proteinG: recipe.proteinG ?? null,
    fatG: recipe.fatG ?? null,
    carbsG: recipe.carbsG ?? null,
    createdAt: recipe.createdAt,
    aiStatus: 'pending' // Tymczasowo ustawiam na 'pending', później dodamy właściwe mapowanie
  };
};

export const useRecipeList = (): Omit<RecipeListState, 'search'> & RecipeListActions & { searchTerm: string } => {
  const [state, setState] = useState<Omit<RecipeListState, 'search'>>({
    recipes: [],
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    isLoading: false,
    isError: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecipes = useCallback(async (query: RecipeListQuery) => {
    setState(prev => ({ ...prev, isLoading: true, isError: false }));
    
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await fetch(`/api/recipes?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const mappedRecipes = data.results.map(mapToViewModel);

      setState(prev => ({
        ...prev,
        recipes: query.page === 1 ? mappedRecipes : [...prev.recipes, ...mappedRecipes],
        total: data.total,
        page: data.page,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, isError: true }));
      console.error('Failed to fetch recipes:', error);
    }
  }, []);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    fetchRecipes({ page: 1, limit: DEFAULT_LIMIT, search: term });
  }, [fetchRecipes]);

  const loadMore = useCallback(() => {
    if (state.isLoading) return;
    
    const nextPage = state.page + 1;
    fetchRecipes({ 
      page: nextPage, 
      limit: DEFAULT_LIMIT, 
      search: searchTerm 
    });
  }, [state.isLoading, state.page, searchTerm, fetchRecipes]);

  const refresh = useCallback(() => {
    fetchRecipes({ 
      page: 1, 
      limit: DEFAULT_LIMIT, 
      search: searchTerm 
    });
  }, [searchTerm, fetchRecipes]);

  // Initial fetch
  useEffect(() => {
    fetchRecipes({ page: 1, limit: DEFAULT_LIMIT });
  }, [fetchRecipes]);

  return {
    ...state,
    searchTerm,
    search,
    loadMore,
    refresh
  };
}; 