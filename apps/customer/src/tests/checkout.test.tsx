/**
 * src/tests/checkout.test.tsx
 * Tests: Services page — plan listing, checkout initiation, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Services from '../pages/customer/Services';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:  ({ children, ...p }: any) => <div {...p}>{children}</div>,
    h2:   ({ children, ...p }: any) => <h2 {...p}>{children}</h2>,
    p:    ({ children, ...p }: any) => <p {...p}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}));

const mockCreateCheckout = vi.fn();

vi.mock('../hooks/queries/useCustomerQueries', () => ({
  useCustomerServicePlansQuery: vi.fn(),
  useCustomerMutations: () => ({
    createCheckout: { mutateAsync: mockCreateCheckout, isPending: false },
  }),
}));

import { useCustomerServicePlansQuery } from '../hooks/queries/useCustomerQueries';
import { loadStripe } from '@stripe/stripe-js';

const mockPlansQuery = useCustomerServicePlansQuery as ReturnType<typeof vi.fn>;
const mockLoadStripe = loadStripe as ReturnType<typeof vi.fn>;

const PLANS = [
  { id: 'plan-1', name: 'Starter', price: 49900, priceLabel: '$499', description: 'Basic plan', features: ['1 page', 'Support'] },
  { id: 'plan-2', name: 'Pro',     price: 99900, priceLabel: '$999', description: 'Pro plan',   features: ['5 pages', 'Priority support'] },
];

function renderServices() {
  return render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Services (customer checkout)', () => {
  beforeEach(() => {
    mockCreateCheckout.mockReset();
    mockLoadStripe.mockReset();
  });

  it('shows loading skeletons while plans are loading', () => {
    mockPlansQuery.mockReturnValue({ data: [], isLoading: true });
    renderServices();
    // Three skeleton divs with animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders plan names and pay buttons after loading', () => {
    mockPlansQuery.mockReturnValue({ data: PLANS, isLoading: false });
    renderServices();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $499.00' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $999.00' })).toBeInTheDocument();
  });

  it('shows empty state when no plans are available', () => {
    mockPlansQuery.mockReturnValue({ data: [], isLoading: false });
    renderServices();
    expect(screen.getByText(/no service plans available/i)).toBeInTheDocument();
  });

  it('calls createCheckout and redirectToCheckout on Pay Now click', async () => {
    mockPlansQuery.mockReturnValue({ data: PLANS, isLoading: false });
    const mockStripeInstance = { redirectToCheckout: vi.fn().mockResolvedValue({}) };
    mockLoadStripe.mockResolvedValue(mockStripeInstance);
    mockCreateCheckout.mockResolvedValue({
      data: { data: { sessionId: 'sess_123', publishableKey: 'pk_test' } },
    });

    renderServices();
    const payButtons = screen.getAllByRole('button', { name: /pay \$/i });
    await userEvent.click(payButtons[0]);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith({
        planId: 'plan-1',
        planName: 'Starter',
        amount: 49900,
      });
      expect(mockLoadStripe).toHaveBeenCalledWith('pk_test');
      expect(mockStripeInstance.redirectToCheckout).toHaveBeenCalledWith({ sessionId: 'sess_123' });
    });
  });

  it('shows error message when checkout fails', async () => {
    mockPlansQuery.mockReturnValue({ data: PLANS, isLoading: false });
    mockCreateCheckout.mockRejectedValue({ response: { data: { error: 'Payment provider unavailable' } } });

    renderServices();
    const payButtons = screen.getAllByRole('button', { name: /pay \$/i });
    await userEvent.click(payButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Payment provider unavailable')).toBeInTheDocument();
    });
  });

  it('shows fallback error when checkout fails with no message', async () => {
    mockPlansQuery.mockReturnValue({ data: PLANS, isLoading: false });
    mockCreateCheckout.mockRejectedValue({});

    renderServices();
    const payButtons = screen.getAllByRole('button', { name: /pay \$/i });
    await userEvent.click(payButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Checkout failed. Please try again.')).toBeInTheDocument();
    });
  });
});
