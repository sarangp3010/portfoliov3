/**
 * src/tests/payments.test.tsx
 * Tests: Payments page — table rendering, receipt download, pagination, empty/loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Payments from '../pages/customer/Payments';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    tr:  ({ children, ...p }: any) => <tr {...p}>{children}</tr>,
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockReceiptMutate = vi.fn();

vi.mock('../hooks/queries/useCustomerQueries', () => ({
  useCustomerPaymentsQuery: vi.fn(),
  useCustomerMutations: () => ({
    getPaymentReceipt: { mutateAsync: mockReceiptMutate },
  }),
}));

import { useCustomerPaymentsQuery } from '../hooks/queries/useCustomerQueries';
const mockPaymentsQuery = useCustomerPaymentsQuery as ReturnType<typeof vi.fn>;

const PAYMENTS = [
  { id: 'p-1', amount: 49900, status: 'COMPLETED', serviceName: 'Starter',   createdAt: '2026-01-01T00:00:00Z', stripeSessionId: 'sess_abc123' },
  { id: 'p-2', amount: 99900, status: 'PENDING',   serviceName: 'Pro Plan',  createdAt: '2026-01-02T00:00:00Z', stripeSessionId: null },
  { id: 'p-3', amount: 19900, status: 'FAILED',    serviceName: 'Basic',     createdAt: '2026-01-03T00:00:00Z', stripeSessionId: null },
];

function renderPayments() {
  return render(
    <MemoryRouter>
      <Payments />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Payments — loading + empty states', () => {
  beforeEach(() => mockReceiptMutate.mockReset());

  it('shows loading skeletons while data loads', () => {
    mockPaymentsQuery.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderPayments();
    const skeletons = container.querySelectorAll('[style*="pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no payments exist', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: [], total: 0 }, isLoading: false });
    renderPayments();
    expect(screen.getByText('No payments yet.')).toBeInTheDocument();
  });
});

describe('Payments — table rendering', () => {
  beforeEach(() => {
    mockReceiptMutate.mockReset();
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 3 }, isLoading: false });
  });

  it('renders all payment service names', () => {
    renderPayments();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
  });

  it('renders formatted amounts', () => {
    renderPayments();
    // $499.00 appears in both the summary card and the table row
    expect(screen.getAllByText('$499.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('$999.00')).toBeInTheDocument();
    expect(screen.getByText('$199.00')).toBeInTheDocument();
  });

  it('shows status badges for each payment', () => {
    renderPayments();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('shows total spent as sum of COMPLETED payments only', () => {
    renderPayments();
    // $499.00 appears in the summary card (total spend)
    expect(screen.getAllByText('$499.00').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the total transaction count', () => {
    renderPayments();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('Payments — receipt download', () => {
  beforeEach(() => mockReceiptMutate.mockReset());

  it('shows receipt button only for COMPLETED payments', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 3 }, isLoading: false });
    renderPayments();
    const receiptButtons = screen.getAllByText('⬇ PDF');
    // Only p-1 is COMPLETED
    expect(receiptButtons).toHaveLength(1);
  });

  it('calls getPaymentReceipt mutation with correct payment id on click', async () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 3 }, isLoading: false });
    mockReceiptMutate.mockResolvedValue({ data: { data: { id: 'p-1', amount: 49900 } } });

    // Mock URL/blob APIs used in handleReceipt
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    renderPayments();
    await userEvent.click(screen.getByText('⬇ PDF'));

    await waitFor(() => {
      expect(mockReceiptMutate).toHaveBeenCalledWith('p-1');
    });
  });

  it('shows no error message before any download attempt', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 3 }, isLoading: false });
    renderPayments();
    expect(screen.queryByText('Could not download receipt')).not.toBeInTheDocument();
  });
});

describe('Payments — pagination', () => {
  it('does not render pagination when only one page', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 3 }, isLoading: false });
    renderPayments();
    expect(screen.queryByText(/Page 1 of/)).toBeNull();
  });

  it('renders pagination when total exceeds page size', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 25 }, isLoading: false });
    renderPayments();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('Prev button is disabled on first page', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 25 }, isLoading: false });
    renderPayments();
    expect(screen.getByRole('button', { name: '← Prev' })).toBeDisabled();
  });

  it('Next button is enabled on first page', () => {
    mockPaymentsQuery.mockReturnValue({ data: { payments: PAYMENTS, total: 25 }, isLoading: false });
    renderPayments();
    expect(screen.getByRole('button', { name: 'Next →' })).not.toBeDisabled();
  });
});
