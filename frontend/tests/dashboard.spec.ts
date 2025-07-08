import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for dashboard tests
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token');
    });
    
    // Mock API responses
    await page.route('**/api/repositories', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              name: 'test-repo',
              full_name: 'testuser/test-repo',
              description: 'A test repository',
              private: false,
              archived: false,
              html_url: 'https://github.com/testuser/test-repo',
              owner: {
                login: 'testuser',
                avatar_url: 'https://github.com/testuser.png',
                html_url: 'https://github.com/testuser'
              }
            }
          ]
        })
      });
    });
  });

  test('should display repository list', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if repositories are displayed
    // This test will be updated once we implement the dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow repository visibility toggle', async ({ page }) => {
    // This test will be implemented once we have the repository management UI
    test.skip('Repository management UI not yet implemented');
  });

  test('should allow repository archiving', async ({ page }) => {
    // This test will be implemented once we have the archive functionality
    test.skip('Archive functionality not yet implemented');
  });

  test('should allow repository deletion with confirmation', async ({ page }) => {
    // This test will be implemented once we have the delete functionality
    test.skip('Delete functionality not yet implemented');
  });
});