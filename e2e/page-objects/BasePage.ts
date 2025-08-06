import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForUrl(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  protected async fillInput(locator: Locator, value: string) {
    await locator.clear();
    await locator.fill(value);
  }

  protected async clickAndWaitForNavigation(locator: Locator) {
    await Promise.all([this.page.waitForNavigation(), locator.click()]);
  }

  async expectToBeVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  async expectToHaveText(locator: Locator, text: string) {
    await expect(locator).toHaveText(text);
  }
}
