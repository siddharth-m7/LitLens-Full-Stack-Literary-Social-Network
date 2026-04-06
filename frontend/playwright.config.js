import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    // Capture screenshot and video only on failure
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  // Automatically start the Vite dev server before tests.
  // The backend must be running separately on port 5000.
  // Local setup:
  //   1. node backend/scripts/seedE2E.js   (once, to create admin user)
  //   2. npm run dev --prefix backend       (in one terminal)
  //   3. npx playwright test                (runs this config + starts frontend)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
