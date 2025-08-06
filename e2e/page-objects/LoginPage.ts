import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  get emailInput() {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[type="password"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get errorAlert() {
    return this.page.locator('[role="alert"] p');
  }

  async login(email: string, password: string) {
    // Nasłuchuj na odpowiedzi z API
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/login") && response.request().method() === "POST",
      { timeout: 10000 }
    );

    await this.goto("/auth/login");
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.submitButton.click();

    try {
      // Poczekaj na odpowiedź
      const response = await responsePromise;
      console.log("Login response status:", response.status());

      // Poczekaj na nawigację tylko jeśli logowanie się powiodło
      if (response.ok()) {
        await this.waitForUrl("/recipes");
      }
    } catch (error) {
      console.error("Error during login:", error);
      // Nie rzucamy błędu, ponieważ w przypadku niepoprawnych danych
      // oczekujemy komunikatu o błędzie
    }
  }

  async expectLoginError() {
    await this.expectToBeVisible(this.errorAlert);
  }
}
