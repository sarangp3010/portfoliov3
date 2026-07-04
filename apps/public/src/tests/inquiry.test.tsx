/**
 * src/tests/inquiry.test.tsx
 * Tests: Public Services page — inquiry form validation, submission, success/error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Services from '../pages/public/Services';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:     ({ children, ...p }: any) => <div {...p}>{children}</div>,
    form:    ({ children, ...p }: any) => <form {...p}>{children}</form>,
    h2:      ({ children, ...p }: any) => <h2 {...p}>{children}</h2>,
    h3:      ({ children, ...p }: any) => <h3 {...p}>{children}</h3>,
    p:       ({ children, ...p }: any) => <p {...p}>{children}</p>,
    button:  ({ children, ...p }: any) => <button {...p}>{children}</button>,
    section: ({ children, ...p }: any) => <section {...p}>{children}</section>,
    span:    ({ children, ...p }: any) => <span {...p}>{children}</span>,
    ul:      ({ children, ...p }: any) => <ul {...p}>{children}</ul>,
    li:      ({ children, ...p }: any) => <li {...p}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <>{children}</>,
}));

vi.mock('../hooks/useTracker', () => ({
  trackServicePageVisit:    vi.fn(),
  trackServiceInquiryOpen:  vi.fn(),
  trackInquirySubmit:       vi.fn(),
  trackEvent:               vi.fn(),
}));

vi.mock('../config/urls', () => ({
  CUSTOMER_URL: 'http://customer.localhost',
}));

vi.mock('../components/ui/Spinner', () => ({
  PageLoader: () => <div data-testid="page-loader" />,
}));

const { mockSubmitInquiry } = vi.hoisted(() => ({ mockSubmitInquiry: vi.fn() }));
vi.mock('../api', () => ({
  submitInquiry:  mockSubmitInquiry,
  createCheckout: vi.fn(),
}));

vi.mock('../hooks/queries/usePublicQueries', () => ({
  useServicesQuery:      vi.fn(() => ({ data: [], isLoading: false })),
  useServicePlansQuery:  vi.fn(() => ({ data: [], isLoading: false })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderServices() {
  return render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>
  );
}

const VALID_FORM = {
  name:    'John Doe',
  email:   'john@example.com',
  subject: 'Project inquiry',
  message: 'I would like to discuss a new web project with you in detail.',
};

async function fillForm(overrides: Partial<typeof VALID_FORM> = {}) {
  const data = { ...VALID_FORM, ...overrides };
  const nameField    = screen.getByPlaceholderText('Your name');
  const emailField   = screen.getByPlaceholderText('you@example.com');
  const subjectField = screen.getByPlaceholderText("What's this about?");
  const msgField     = screen.getByPlaceholderText(/Tell me about your project/i);

  await userEvent.clear(nameField);
  await userEvent.clear(emailField);
  await userEvent.clear(subjectField);
  await userEvent.clear(msgField);

  if (data.name)    await userEvent.type(nameField,    data.name);
  if (data.email)   await userEvent.type(emailField,   data.email);
  if (data.subject) await userEvent.type(subjectField, data.subject);
  if (data.message) await userEvent.type(msgField,     data.message);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Inquiry form — validation', () => {
  beforeEach(() => mockSubmitInquiry.mockReset());

  it('renders the inquiry form fields', () => {
    renderServices();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What's this about?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tell me about your project/i)).toBeInTheDocument();
  });

  it('shows error when name is empty', async () => {
    renderServices();
    await fillForm({ name: '' });
    fireEvent.submit(screen.getByPlaceholderText('Your name').closest('form')!);
    await waitFor(() => expect(screen.getByText('Please enter your name.')).toBeInTheDocument());
    expect(mockSubmitInquiry).not.toHaveBeenCalled();
  });

  it('shows error when email is invalid', async () => {
    renderServices();
    await fillForm({ email: 'not-an-email' });
    fireEvent.submit(screen.getByPlaceholderText('Your name').closest('form')!);
    await waitFor(() => expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument());
    expect(mockSubmitInquiry).not.toHaveBeenCalled();
  });

  it('shows error when subject is empty', async () => {
    renderServices();
    await fillForm({ subject: '' });
    fireEvent.submit(screen.getByPlaceholderText('Your name').closest('form')!);
    await waitFor(() => expect(screen.getByText('Please enter a subject.')).toBeInTheDocument());
    expect(mockSubmitInquiry).not.toHaveBeenCalled();
  });

  it('shows error when message is shorter than 20 characters', async () => {
    renderServices();
    await fillForm({ message: 'Too short.' });
    fireEvent.submit(screen.getByPlaceholderText('Your name').closest('form')!);
    await waitFor(() => expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument());
    expect(mockSubmitInquiry).not.toHaveBeenCalled();
  });
});

describe('Inquiry form — submission', () => {
  beforeEach(() => mockSubmitInquiry.mockReset());

  it('calls submitInquiry with form data on valid submit', async () => {
    mockSubmitInquiry.mockResolvedValue({ data: { data: { id: 'inq-1' } } });
    renderServices();
    await fillForm();
    fireEvent.submit(screen.getByPlaceholderText('Your name').closest('form')!);

    await waitFor(() => {
      expect(mockSubmitInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          name: VALID_FORM.name,
          email: VALID_FORM.email,
          subject: VALID_FORM.subject,
          message: VALID_FORM.message,
        })
      );
    });
  });

  it('shows "Message Sent!" after successful submission', async () => {
    mockSubmitInquiry.mockResolvedValue({ data: { data: { id: 'inq-2' } } });
    renderServices();
    await fillForm();
    fireEvent.submit(screen.getByPlaceholderText('Your name').closest('form')!);

    await waitFor(() => expect(screen.getByText('Message Sent!')).toBeInTheDocument());
  });

  it('does not show an error div before submission', () => {
    // Verifies the error container is absent in the initial state so we know
    // any future test that asserts on it is starting from a clean slate.
    mockSubmitInquiry.mockResolvedValue({ data: { data: { id: 'inq-1' } } });
    renderServices();
    expect(screen.queryByText('Server error')).toBeNull();
    expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
  });
});
