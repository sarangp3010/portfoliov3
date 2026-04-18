import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { PageLoader } from './components/ui/Spinner';
import { useTracker } from './hooks/useTracker';

const Home           = lazy(() => import('./pages/public/Home'));
const Blog           = lazy(() => import('./pages/public/Blog'));
const BlogPost       = lazy(() => import('./pages/public/BlogPost'));
const Services       = lazy(() => import('./pages/public/Services'));
const Testimonials   = lazy(() => import('./pages/public/Testimonials'));
const Resume         = lazy(() => import('./pages/public/Resume'));
const PaymentSuccess = lazy(() => import('./pages/public/PaymentSuccess'));
const PaymentCancel  = lazy(() => import('./pages/public/PaymentCancel'));

function TrackedApp() {
  useTracker();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/"             element={<Home />} />
          <Route path="/blog"         element={<Blog />} />
          <Route path="/blog/:slug"   element={<BlogPost />} />
          <Route path="/services"     element={<Services />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/resume"       element={<Resume />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel"  element={<PaymentCancel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TrackedApp />
    </ThemeProvider>
  );
}
