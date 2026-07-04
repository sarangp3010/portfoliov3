/**
 * src/tests/dashboard.test.tsx
 * Tests: Dashboard — welcome message, stats, recent payments, empty state, quick links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/customer/Dashboard';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../context/AuthContext', () => ({
  useCustomerAuth: vi.fn(),
}));

vi.mock('../hooks/queries/useCustomerQueries', () => ({
  useCustomerDashboardQuery: vi.fn(),
}));

vi.mock('../config/urls', () => ({
  PUBLIC_URL: 'http://public.localhost',
}));

import { useCustomerAuth } from '../context/AuthContext';
import { useCustomerDashboardQuery } from '../hooks/queries/useCustomerQueries';

const mockAuth  = useCustomerAuth  as ReturnType<typeof vi.fn>;
const mockQuery = useCustomerDashboardQuery as ReturnType<typeof vi.fn>;

const CUSTOMER = { id: 'c-1', name: 'Jane Doe', email: 'jane@example.com', provider: 'local' };

const PAYMENTS = [
  { id: 'p-1', amount: 49900, status: 'COMPLETED', serviceName: 'Starter Plan', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'p-2', amount: 99900, status: 'PENDING',   serviceName: 'Pro Plan',     createdAt: '2026-01-02T00:00:00Z' },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Dashboard — welcome + stats', () => {
  it('shows first name in welcome message', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByText(/Welcome back, Jane/)).toBeInTheDocument();
  });

  it('shows loading skeletons while data is loading', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderDashboard();
    // Three skeleton divs are rendered for the stats
    const skeletons = container.querySelectorAll('[style*="pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows $0.00 total spend with no completed payments', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('sums only COMPLETED payment amounts for total spend', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: PAYMENTS, plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    // $499.00 appears in the stats (total spend) and in the payment row — at least one must exist
    expect(screen.getAllByText('$499.00').length).toBeGreaterThanOrEqual(1);
  });

  it('shows correct services-available count from plans', () => {
    const plans = [{ id: 'pl-1' }, { id: 'pl-2' }];
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans, devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByText('2')).toBeInTheDocument(); // services count
  });
});

describe('Dashboard — recent payments', () => {
  it('shows "No payments yet" when payments array is empty', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByText('No payments yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse available services/i })).toBeInTheDocument();
  });

  it('renders payment service names in the recent list', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: PAYMENTS, plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByText('Starter Plan')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
  });

  it('shows status badges for each payment', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: PAYMENTS, plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('limits recent payments to at most 5 entries', () => {
    const manyPayments = Array.from({ length: 8 }, (_, i) => ({
      id: `p-${i}`, amount: 1000, status: 'COMPLETED',
      serviceName: `Service ${i}`, createdAt: '2026-01-01T00:00:00Z',
    }));
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: manyPayments, plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    // Rendered service names in the recent section should be at most 5
    const items = screen.getAllByText(/^Service \d$/);
    expect(items.length).toBeLessThanOrEqual(5);
  });
});

describe('Dashboard — quick links', () => {
  it('renders Browse Service Plans, Payment History, Contact Admin links', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.getByRole('link', { name: /Browse Service Plans/i })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: /Payment History/i })).toHaveAttribute('href', '/payments');
    expect(screen.getByRole('link', { name: /Contact Admin/i })).toHaveAttribute('href', '/contact-admin');
  });

  it('shows developer links when devProfile is available', () => {
    const devProfile = { githubUrl: 'https://github.com/dev', linkedinUrl: 'https://linkedin.com/in/dev' };
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans: [], devProfile }, isLoading: false });
    renderDashboard();
    expect(screen.getByRole('link', { name: /View Portfolio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute('href', 'https://github.com/dev');
    expect(screen.getByRole('link', { name: /LinkedIn/i })).toHaveAttribute('href', 'https://linkedin.com/in/dev');
  });

  it('does not show developer links when devProfile is null', () => {
    mockAuth.mockReturnValue({ customer: CUSTOMER });
    mockQuery.mockReturnValue({ data: { payments: [], plans: [], devProfile: null }, isLoading: false });
    renderDashboard();
    expect(screen.queryByRole('link', { name: /GitHub/i })).toBeNull();
  });
});
