import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';
import { RecipePage } from './page-objects/RecipePage';

test.describe('Recipe List', () => {
  let loginPage: LoginPage;
  let recipePage: RecipePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    recipePage = new RecipePage(page);

    // Zaloguj się przed każdym testem
    await loginPage.goto('/auth/login');
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
  });

  test('should display recipe list', async ({ page }) => {
    await recipePage.navigate();
    
    // Sprawdź czy lista przepisów jest widoczna
    const recipesList = await recipePage.getRecipesList();
    await expect(recipesList).toBeVisible();
  });

  test('should create a new recipe successfully', async ({ page }) => {
    await recipePage.navigateToNew();

    // Wypełnij formularz
    await recipePage.fillRecipeTitle('Spaghetti Bolognese');
    
    // Dodaj składniki
    await recipePage.addIngredient('makaron spaghetti', '500', 'g');
    await recipePage.addIngredient('mięso mielone', '400', 'g');
    await recipePage.addIngredient('cebula', '1', 'sztuka');
    
    // Dodaj kroki
    await recipePage.fillRecipeSteps('1. Ugotuj makaron\n2. Podsmaż mięso\n3. Połącz składniki');
    
    // Zapisz przepis
    await recipePage.submitRecipe();

    // Sprawdź czy przepis jest na liście
    const recipesList = await recipePage.getRecipesList();
    await expect(recipesList).toContainText('Spaghetti Bolognese');
  });
}); 