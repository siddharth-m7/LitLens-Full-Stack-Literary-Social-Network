import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AboutPage from '../pages/AboutPage';
import { renderWithProviders } from '../test/wrapper';

describe('AboutPage', () => {
  it('renders the main platform headline and mission', () => {
    renderWithProviders(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/LitLens/i);
    expect(screen.getByText(/A high-performance literary social network/i)).toBeInTheDocument();
  });

  it('renders Siddharth Mishra developer profile with verified 9.09 CGPA', () => {
    renderWithProviders(<AboutPage />);
    expect(screen.getByText('Siddharth Mishra')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument();
    expect(screen.getByText(/IIIT Ranchi · ECE · 9.09 CGPA/i)).toBeInTheDocument();
  });

  it('renders platform pillars (Curated Discovery, In-Depth Reviews, Social Circle)', () => {
    renderWithProviders(<AboutPage />);
    expect(screen.getByText('Curated Discovery')).toBeInTheDocument();
    expect(screen.getByText('In-Depth Reviews')).toBeInTheDocument();
    expect(screen.getByText('Social Circle')).toBeInTheDocument();
  });

  it('renders technology stack items', () => {
    renderWithProviders(<AboutPage />);
    expect(screen.getByText('React 19 + Vite')).toBeInTheDocument();
    expect(screen.getByText('Node.js + Express 5')).toBeInTheDocument();
    expect(screen.getByText('MongoDB Atlas + Mongoose 8')).toBeInTheDocument();
  });
});
