/**
 * src/tests/auth.test.tsx
 * Tests: Login form, Register form, OAuthCallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import OAuthCallback from '../pages/customer/OAuthCallback';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useCustomerAuth: () => ({ signIn: mockSignIn }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../api', () => ({
  customerLogin:    vi.fn(),
  customerRegister: vi.fn(),
  customerMe:       vi.fn(),
}));

vi.mock('../components/auth/OAuthButtons', () => ({
  OAuthButtons: () => <div data-testid="oauth-buttons" />,
}));

import { customerLogin, customerRegister, customerMe } from '../api';

const mockLogin    = customerLogin    as ReturnType<typeof vi.fn>;
const mockRegister = customerRegister as ReturnType<typeof vi.fn>;
const mockMe       = customerMe       as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLogin(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/login${search}`]}>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderCallback(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <Routes>
        <Route path="/auth/callback" element={<OAuthCallback />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

describe('Login', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockNavigate.mockReset();
    mockLogin.mockReset();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders a link to register', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: 'Create one' })).toBeInTheDocument();
  });

  it('calls signIn and navigates to /dashboard on success', async () => {
    mockLogin.mockResolvedValue({ data: { data: { token: 'tok', customer: { id: '1' } } } });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(mockSignIn).toHaveBeenCalledWith('tok', { id: '1' });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('respects ?redirect query param', async () => {
    mockLogin.mockResolvedValue({ data: { data: { token: 'tok', customer: { id: '1' } } } });
    renderLogin('?redirect=/payments');

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/payments', { replace: true });
    });
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'bad@user.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows fallback error when response has no message', async () => {
    mockLogin.mockRejectedValue({});
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'somepass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('disables button and shows loading text while submitting', async () => {
    let resolve!: (v: unknown) => void;
    mockLogin.mockReturnValue(new Promise(r => { resolve = r; }));
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'pass1234');
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Signing in…')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    resolve({ data: { data: { token: 't', customer: {} } } });
  });
});

// ── Register ─────────────────────────────────────────────────────────────────

describe('Register', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockNavigate.mockReset();
    mockRegister.mockReset();
  });

  it('renders all fields', () => {
    renderRegister();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows password length error without calling API', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText('Full Name'), 'John');
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls signIn and navigates to /dashboard on success', async () => {
    mockRegister.mockResolvedValue({ data: { data: { token: 'tok', customer: { id: '2' } } } });
    renderRegister();

    await userEvent.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      }));
      expect(mockSignIn).toHaveBeenCalledWith('tok', { id: '2' });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('does not include phone in payload when empty', async () => {
    mockRegister.mockResolvedValue({ data: { data: { token: 't', customer: {} } } });
    renderRegister();

    await userEvent.type(screen.getByLabelText('Full Name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Email'), 'j@j.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      const payload = mockRegister.mock.calls[0][0];
      expect(payload).not.toHaveProperty('phone');
    });
  });

  it('shows API error on registration failure', async () => {
    mockRegister.mockRejectedValue({ response: { data: { error: 'Email already in use' } } });
    renderRegister();

    await userEvent.type(screen.getByLabelText('Full Name'), 'Dup User');
    await userEvent.type(screen.getByLabelText('Email'), 'dup@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });
});

// ── OAuthCallback ─────────────────────────────────────────────────────────────

describe('OAuthCallback', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockNavigate.mockReset();
    mockMe.mockReset();
    localStorage.clear();
  });

  it('shows loading state by default (no params)', () => {
    mockMe.mockReturnValue(new Promise(() => {})); // never resolves
    renderCallback('?token=abc');
    expect(screen.getByText('Signing you in…')).toBeInTheDocument();
  });

  it('shows error when ?error= param is present', () => {
    renderCallback('?error=access_denied');
    expect(screen.getByText('Sign-in Failed')).toBeInTheDocument();
    expect(screen.getByText('access_denied')).toBeInTheDocument();
  });

  it('shows error when no token and no error param', () => {
    renderCallback('');
    expect(screen.getByText('Sign-in Failed')).toBeInTheDocument();
    expect(screen.getByText('Authentication failed — no token received.')).toBeInTheDocument();
  });

  it('calls customerMe, signIn, navigate on valid token', async () => {
    const customer = { id: '3', name: 'Test' };
    mockMe.mockResolvedValue({ data: { data: customer } });
    renderCallback('?token=valid-jwt');

    await waitFor(() => {
      expect(localStorage.getItem('customer_token')).toBe('valid-jwt');
      expect(mockSignIn).toHaveBeenCalledWith('valid-jwt', customer);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('shows error and clears token when customerMe fails', async () => {
    mockMe.mockRejectedValue(new Error('network'));
    localStorage.setItem('customer_token', 'bad-token');
    renderCallback('?token=bad-token');

    await waitFor(() => {
      expect(screen.getByText('Sign-in Failed')).toBeInTheDocument();
      expect(screen.getByText('Could not load your account. Please try again.')).toBeInTheDocument();
      expect(localStorage.getItem('customer_token')).toBeNull();
    });
  });

  it('navigates to /login on "Back to Login" button click', async () => {
    renderCallback('?error=denied');
    await userEvent.click(screen.getByRole('button', { name: 'Back to Login' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
