import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import BookDetails from '../pages/BookDetails';
import { renderWithProviders } from '../test/wrapper';

// Simulate a logged-in user so the review form is interactive
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user123', name: 'Alice', role: 'user' },
    isAuthenticated: true,
    isAdmin: false,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

const renderBookDetails = () =>
  renderWithProviders(<BookDetails />, {
    route: '/books/book123',
    path: '/books/:id',
  });

describe('BookDetails — ReviewForm', () => {
  it('renders the review form heading', async () => {
    renderBookDetails();
    expect(await screen.findByText('Share Your Thoughts')).toBeInTheDocument();
  });

  it('renders rating select and comment textarea', async () => {
    renderBookDetails();
    await screen.findByText('Share Your Thoughts');

    expect(screen.getByDisplayValue('Select a rating')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what did you think about this book/i)).toBeInTheDocument();
  });

  it('renders the Submit Review button', async () => {
    renderBookDetails();
    await screen.findByText('Share Your Thoughts');

    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  it('submits the form and shows success toast', async () => {
    const user = userEvent.setup();
    renderBookDetails();

    // Wait for the book to load
    await screen.findByText('Share Your Thoughts');

    // Select rating
    await user.selectOptions(screen.getByDisplayValue('Select a rating'), '5');

    // Type comment
    await user.type(
      screen.getByPlaceholderText(/what did you think about this book/i),
      'An absolute masterpiece!'
    );

    // Submit
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    // Toast should appear after successful mutation
    await waitFor(() => {
      expect(screen.getByText('Review submitted!')).toBeInTheDocument();
    });
  });
});
