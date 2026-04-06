import { test, expect } from '@playwright/test';

/**
 * Full user journey: Login → Create book (admin) → Add review → Delete review
 *
 * Prerequisites:
 *   - Backend running on http://localhost:5000
 *   - Admin user exists: admin@example.com / admin123
 *     (run: node backend/scripts/seedE2E.js)
 */
test('Login → Create book → Add review → Delete review', async ({ page }) => {
  const bookTitle = `E2E Test Book ${Date.now()}`;

  // ── 1. Login ────────────────────────────────────────────────────────────────
  await page.goto('/login');

  await page.getByLabel('Email Address').fill('admin@example.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL('/dashboard');
  await expect(page).toHaveURL('/dashboard');

  // ── 2. Create a book ────────────────────────────────────────────────────────
  await page.getByPlaceholder('Enter the book title').fill(bookTitle);
  await page.getByPlaceholder("Enter the author's name").fill('Playwright Author');

  // Capture the created book's _id from the API response
  const [createResponse] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/books') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    ),
    page.getByRole('button', { name: 'Add Book to Library' }).click(),
  ]);

  const createdBook = await createResponse.json();
  expect(createdBook._id).toBeTruthy();
  expect(createdBook.title).toBe(bookTitle);

  // ── 3. Navigate to the book's detail page ───────────────────────────────────
  await page.goto(`/books/${createdBook._id}`);
  await expect(page.getByRole('heading', { name: bookTitle, level: 1 })).toBeVisible();

  // ── 4. Add a review ─────────────────────────────────────────────────────────
  // Wait for the review form to load
  await expect(page.getByRole('heading', { name: 'Share Your Thoughts' })).toBeVisible();

  await page.locator('select[name="rating"]').selectOption('4');
  await page.getByPlaceholder(/what did you think about this book/i).fill('E2E automated review comment');

  const [reviewResponse] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/reviews') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    ),
    page.getByRole('button', { name: 'Submit Review' }).click(),
  ]);

  const createdReview = await reviewResponse.json();
  expect(createdReview.rating).toBe(4);

  // Toast should appear
  await expect(page.getByText('Review submitted!')).toBeVisible();

  // Review text should appear in the reviews section
  await expect(page.getByText('E2E automated review comment')).toBeVisible();

  // ── 5. Delete the review ────────────────────────────────────────────────────
  // The Delete button is shown only for the review owner
  await page.getByRole('button', { name: 'Delete' }).first().click();

  await expect(page.getByText('Review deleted')).toBeVisible();

  // Review should no longer be in the DOM
  await expect(page.getByText('E2E automated review comment')).not.toBeVisible();
});
