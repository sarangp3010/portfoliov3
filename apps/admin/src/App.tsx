import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { PageLoader } from './components/ui/Spinner';

const AdminLogin          = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard           = lazy(() => import('./pages/admin/Dashboard'));
const Analytics           = lazy(() => import('./pages/admin/Analytics'));
const ProfileEditor       = lazy(() => import('./pages/admin/ProfileEditor'));
const BlogManager         = lazy(() => import('./pages/admin/BlogManager'));
const ProjectsManager     = lazy(() => import('./pages/admin/ProjectsManager'));
const ServicesManager     = lazy(() => import('./pages/admin/ServicesManager'));
const TestimonialsManager = lazy(() => import('./pages/admin/TestimonialsManager'));
const ResumeManager       = lazy(() => import('./pages/admin/ResumeManager'));
const InquiriesManager    = lazy(() => import('./pages/admin/InquiriesManager'));
const Settings            = lazy(() => import('./pages/admin/Settings'));
const SessionsViewer      = lazy(() => import('./pages/admin/SessionsViewer'));
const FeatureFlags        = lazy(() => import('./pages/admin/FeatureFlags'));
const DevDiagnostics      = lazy(() => import('./pages/admin/DevDiagnostics'));
const InsightsPanel       = lazy(() => import('./pages/admin/InsightsPanel'));
const PaymentsManager     = lazy(() => import('./pages/admin/PaymentsManager'));
const ThemeManager        = lazy(() => import('./pages/admin/ThemeManager'));
const CustomersManager    = lazy(() => import('./pages/admin/CustomersManager'));
const EmailTemplatesManager = lazy(() => import('./pages/admin/EmailTemplatesManager'));
const NotificationsPage     = lazy(() => import('./pages/admin/NotificationsPage'));
const PageSectionsManager   = lazy(() => import('./pages/admin/PageSectionsManager'));
const NotFound              = lazy(() => import('./pages/admin/NotFound'));

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index                     element={<Dashboard />} />
              <Route path="analytics"          element={<Analytics />} />
              <Route path="analytics/sessions" element={<SessionsViewer />} />
              <Route path="insights"           element={<InsightsPanel />} />
              <Route path="payments"           element={<PaymentsManager />} />
              <Route path="customers"          element={<CustomersManager />} />
              <Route path="email-templates"   element={<EmailTemplatesManager />} />
              <Route path="notifications"     element={<NotificationsPage />} />
              <Route path="page-sections"     element={<PageSectionsManager />} />
              <Route path="profile"            element={<ProfileEditor />} />
              <Route path="blog"               element={<BlogManager />} />
              <Route path="projects"           element={<ProjectsManager />} />
              <Route path="services"           element={<ServicesManager />} />
              <Route path="testimonials"       element={<TestimonialsManager />} />
              <Route path="resume"             element={<ResumeManager />} />
              <Route path="inquiries"          element={<InquiriesManager />} />
              <Route path="flags"              element={<FeatureFlags />} />
              <Route path="diagnostics"        element={<DevDiagnostics />} />
              <Route path="theme"              element={<ThemeManager />} />
              <Route path="settings"           element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </AuthProvider>
  );
}
