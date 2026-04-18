import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { customerMe, customerLogout } from '../api';
import { AuthCustomer } from '../types';

interface AuthContextType {
  customer: AuthCustomer | null;
  loading: boolean;
  signIn: (token: string, customer: AuthCustomer) => void;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<AuthCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (token) {
      customerMe()
        .then(r => setCustomer(r.data.data))
        .catch(() => localStorage.removeItem('customer_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (token: string, cust: AuthCustomer) => {
    localStorage.setItem('customer_token', token);
    setCustomer(cust);
  };

  const signOut = async () => {
    try { await customerLogout(); } catch {}
    localStorage.removeItem('customer_token');
    setCustomer(null);
  };

  const refresh = async () => {
    try {
      const r = await customerMe();
      setCustomer(r.data.data);
    } catch {
      signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ customer, loading, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
};
