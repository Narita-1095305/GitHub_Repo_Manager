import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the main heading and navigation', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.locator('h1')).toContainText('GitHub Repository Manager');
    
    // Check description
    await expect(page.locator('text=Manage your GitHub repositories with ease')).toBeVisible();
    
    // Check Get Started button
    const getStartedButton = page.locator('text=Get Started');
    await expect(getStartedButton).toBeVisible();
    await expect(getStartedButton).toHaveAttribute('href', '/dashboard');
    
    // Check GitHub link
    const githubLink = page.locator('text=View on GitHub');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com');
  });

  test('should have proper responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should navigate to dashboard when Get Started is clicked', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Get Started');
    await expect(page).toHaveURL('/dashboard');
  });
});