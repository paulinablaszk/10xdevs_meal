import type { UnitType } from '@/types';

export interface IngredientViewModel {
  name: string;
  amount: string; // zawsze string w formularzu, konwertowany na number przy wysyłce
  unit: UnitType;
}

export interface RecipeFormViewModel {
  name: string;
  ingredients: IngredientViewModel[];
  steps: string; // Kroki jako pojedynczy string, dzielony nowymi liniami
} 