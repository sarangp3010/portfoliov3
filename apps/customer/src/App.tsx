import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerAuthProvider, useCustomerAuth } from './context/AuthContext';
import { CustomerLayout } from './components/layout/CustomerLayout';

const Login    = lazy(() => import('./pages/customer/Login'));
const Register = lazy(() => import('./pages/customer/Register'));
const OAuthCallback     = lazy(() => import('./pages/customer/OAuthCallback'));
const Dashboard         = lazy(() => import('./pages/customer/Dashboard'));
const Services          = lazy(() => import('./pages/customer/Services'));
const Payments          = lazy(() => import('./pages/customer/Payments'));
const PaymentMethods    = lazy(() => import('./pages/customer/PaymentMethods'));
const ContactAdmin      = lazy(() => import('./pages/customer/ContactAdmin'));
const Profile           = lazy(() => import('./pages/customer/Profile'));
const PaymentSuccess    = lazy(() => import('./pages/customer/PaymentSuccess'));
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage'));
const NotFound          = lazy(() => import('./pages/customer/NotFound'));

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { customer, loading } = useCustomerAuth();
  if (loading) return <Loader />;
  if (!customer) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { customer, loading } = useCustomerAuth();
  if (loading) return <Loader />;

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login"    element={customer ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={customer ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        <Route element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/services"        element={<Services />} />
          <Route path="/payments"        element={<Payments />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/contact-admin"   element={<ContactAdmin />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/notifications"   element={<NotificationsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <CustomerAuthProvider>
      <AppRoutes />
    </CustomerAuthProvider>
  );
}
