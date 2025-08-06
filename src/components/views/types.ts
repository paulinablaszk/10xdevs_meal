import type { AiStatus } from "@/types";

export interface RecipeListItemVM {
  id: string;
  name: string;
  kcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  createdAt: string;
  aiStatus: AiStatus;
}

export interface RecipeListState {
  recipes: RecipeListItemVM[];
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  isError: boolean;
  search: string;
}

export interface RecipeListActions {
  search: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
}

export interface HeaderBarProps {
  recipeCount: number;
  onSearch: (term: string) => void;
}

export interface RecipeCardProps {
  recipe: RecipeListItemVM;
}
