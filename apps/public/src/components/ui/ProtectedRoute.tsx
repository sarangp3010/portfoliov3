import { ReactNode, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from './Spinner';
import { ADMIN_URL } from '../../config/urls';

/**
 * NOTE: This ProtectedRoute is a monolith remnant and is not mounted by the
 * public app's router. The admin panel lives at the admin subdomain.
 * Kept here only for reference.
 */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      // Redirect to admin subdomain login — not the old monolith /admin/login path
      window.location.href = `${ADMIN_URL}/login`;
    }
  }, [isAdmin, isLoading]);

  if (isLoading) return <PageLoader />;
  if (!isAdmin) return null; // useEffect handles redirect
  return <>{children}</>;
};
