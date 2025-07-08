import { test as base } from '@playwright/test';

// Extend the base test with custom fixtures
export const test = base.extend({
  // Add custom fixtures here if needed
});

export { expect } from '@playwright/test';