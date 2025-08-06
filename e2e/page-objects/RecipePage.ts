import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RecipePage extends BasePage {
  readonly path = '/recipes';

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.page.goto(this.path);
  }

  async navigateToNew() {
    await this.page.goto(`${this.path}/new`);
  }

  async getRecipesList() {
    return this.page.locator('[data-testid="recipe-list"]');
  }

  // Metody formularza
  async fillRecipeTitle(title: string) {
    await this.page.locator('[data-testid="recipe-title"]').fill(title);
  }

  async addIngredient(name: string, amount: string, unit: string) {
    // Pobierz wszystkie istniejące wiersze składników
    const ingredients = await this.page.locator('[data-testid="ingredient-row"]').all();
    
    // Jeśli to nie pierwszy składnik, dodaj nowy wiersz
    if (ingredients.length > 0 && await ingredients[ingredients.length - 1].locator('[data-testid="ingredient-name"]').inputValue() !== '') {
      await this.page.locator('[data-testid="add-ingredient-button"]').click();
    }
    
    // Pobierz zaktualizowaną listę wierszy
    const updatedIngredients = await this.page.locator('[data-testid="ingredient-row"]').all();
    const currentIngredient = updatedIngredients[updatedIngredients.length - 1];
    
    await currentIngredient.locator('[data-testid="ingredient-name"]').fill(name);
    await currentIngredient.locator('[data-testid="ingredient-amount"]').fill(amount);
    
    // Klikamy w przycisk Select aby otworzyć listę
    const unitSelect = currentIngredient.locator('[data-testid="ingredient-unit"]');
    await unitSelect.click();
    
    // Wybieramy opcję z listy używając dokładnego dopasowania
    await this.page.getByRole('option', { name: unit, exact: true }).click();
  }

  async fillRecipeSteps(steps: string) {
    await this.page.locator('[data-testid="recipe-steps"]').fill(steps);
  }

  async submitRecipe() {
    await this.page.locator('[data-testid="submit-recipe"]').click();
    // Czekamy na przekierowanie do szczegółów przepisu
    await this.page.waitForURL(`${this.path}/**`);
    // Wracamy do listy przepisów
    await this.navigate();
  }
} 