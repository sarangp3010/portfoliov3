/**
 * src/tests/notfound.test.tsx
 * Tests: NotFound page — 404 display, route in message, navigation links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NotFound from '../pages/public/NotFound';

vi.mock('../config/urls', () => ({
  ADMIN_URL:    'http://admin.localhost',
  CUSTOMER_URL: 'http://customer.localhost',
}));

function renderNotFound(path = '/missing-page') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotFound page', () => {
  it('renders the 404 heading', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('shows the current pathname in the message', () => {
    renderNotFound('/some/broken/path');
    expect(screen.getByText('/some/broken/path')).toBeInTheDocument();
  });

  it('renders a link back to the homepage', () => {
    renderNotFound();
    expect(screen.getByRole('link', { name: 'Go To Homepage' })).toHaveAttribute('href', '/');
  });

  it('renders a link to /services', () => {
    renderNotFound();
    expect(screen.getByRole('link', { name: 'Browse Services' })).toHaveAttribute('href', '/services');
  });

  it('renders Admin Portal link', () => {
    renderNotFound();
    const adminLink = screen.getByRole('link', { name: /Admin Portal/i });
    expect(adminLink).toHaveAttribute('href', 'http://admin.localhost');
  });

  it('renders Customer Portal link', () => {
    renderNotFound();
    const customerLink = screen.getByRole('link', { name: /Customer Portal/i });
    expect(customerLink).toHaveAttribute('href', 'http://customer.localhost');
  });

  it('shows the "Public Portal" label badge', () => {
    renderNotFound();
    expect(screen.getByText('Public Portal')).toBeInTheDocument();
  });
});
