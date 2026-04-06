import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders a component with QueryClient + Router context.
 * @param {JSX.Element} ui - component to render
 * @param {object} options
 * @param {string} options.route - initial URL (e.g. '/books/book123')
 * @param {string} options.path  - route pattern   (e.g. '/books/:id')
 */
export function renderWithProviders(ui, { route = '/', path = '/' } = {}) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
