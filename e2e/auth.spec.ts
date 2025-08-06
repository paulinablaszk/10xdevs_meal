import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { TEST_CONFIG } from "./test-config";

test.describe("Authentication", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    // Arrange
    const { email, password } = TEST_CONFIG.testUser;
    console.log("Test user credentials:", { email });

    // Loguj wszystkie konsole z przeglądarki
    page.on("console", (msg) => {
      console.log("Browser console:", msg.text());
    });

    // Act
    await loginPage.login(email, password);

    // Assert
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should show error message with invalid credentials", async ({ page }) => {
    // Arrange
    const invalidEmail = "invalid@example.com";
    const invalidPassword = "wrongpassword";

    // Loguj wszystkie konsole z przeglądarki
    page.on("console", (msg) => {
      console.log("Browser console:", msg.text());
    });

    // Act
    await loginPage.login(invalidEmail, invalidPassword);

    // Assert
    await loginPage.expectLoginError();
    await loginPage.expectToHaveText(loginPage.errorAlert, "Nieprawidłowy email lub hasło");
  });
});
