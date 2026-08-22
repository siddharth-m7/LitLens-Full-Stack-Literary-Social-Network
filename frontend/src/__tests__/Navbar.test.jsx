import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../components/Navbar';
import { renderWithProviders } from '../test/wrapper';

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

describe('Navbar Component', () => {
  it('renders brand logo and title', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('LitLens')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
  });

  it('renders primary navigation links', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: /HOME/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DASHBOARD/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ABOUT/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /LEADERBOARD/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /PROFILE/i })).toBeInTheDocument();
  });

  it('renders user action controls for authenticated session', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
  });
});
