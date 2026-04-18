/**
 * src/tests/form.test.tsx
 * Tests: AdminLogin form — inputs, validation, submission, loading state, error display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('../api', () => ({
  login: (...args: any[]) => mockLogin(...args),
}));

const mockSetUser = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ setUser: mockSetUser }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <>{children}</>,
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Subject ───────────────────────────────────────────────────────────────────

import AdminLogin from '../pages/admin/AdminLogin';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AdminLogin />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminLogin form', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockSetUser.mockReset();
  });

  it('renders email and password fields and a submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('updates email field on user input', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'admin@test.com');
    expect(emailInput).toHaveValue('admin@test.com');
  });

  it('updates password field on user input', async () => {
    renderLogin();
    const pwInput = screen.getByLabelText(/password/i);
    await userEvent.type(pwInput, 'secret123');
    expect(pwInput).toHaveValue('secret123');
  });

  it('calls login API with entered credentials on submit', async () => {
    mockLogin.mockResolvedValue({
      data: { data: { token: 'tok', user: { email: 'admin@test.com' } } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'pass1234');
  });

  it('navigates to / after successful login', async () => {
    mockLogin.mockResolvedValue({
      data: { data: { token: 'tok', user: { email: 'admin@test.com' } } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'a@a.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('stores token in localStorage after successful login', async () => {
    mockLogin.mockResolvedValue({
      data: { data: { token: 'abc123', user: { email: 'a@a.com' } } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'a@a.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('admin_token')).toBe('abc123');
    });
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'a@a.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    // Never resolves during the test
    mockLogin.mockReturnValue(new Promise(() => {}));

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'a@a.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  it('submit button is not disabled initially', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
  });
});
