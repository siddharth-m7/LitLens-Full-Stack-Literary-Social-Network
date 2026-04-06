import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserDashboard from '../pages/UserDashboard';
import { renderWithProviders } from '../test/wrapper';

describe('UserDashboard — BookList', () => {
  it('shows skeleton loading cards initially', () => {
    renderWithProviders(<UserDashboard />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders book titles after the API resolves', async () => {
    renderWithProviders(<UserDashboard />);
    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(await screen.findByText('1984')).toBeInTheDocument();
  });

  it('renders author names after the API resolves', async () => {
    renderWithProviders(<UserDashboard />);
    expect(await screen.findByText(/frank herbert/i)).toBeInTheDocument();
    expect(await screen.findByText(/george orwell/i)).toBeInTheDocument();
  });

  it('renders the genre filter dropdown with All Genres option', async () => {
    renderWithProviders(<UserDashboard />);
    const genreSelect = await screen.findByDisplayValue('All Genres');
    expect(genreSelect).toBeInTheDocument();
  });

  it('renders the sort dropdown', async () => {
    renderWithProviders(<UserDashboard />);
    expect(await screen.findByDisplayValue('Newest First')).toBeInTheDocument();
  });
});
