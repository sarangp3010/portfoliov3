import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from './Spinner';
import { ReactNode } from 'react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  // Admin app routes are at the root — login is at /login, not /admin/login
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
