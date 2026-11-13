import { Routes, Route, Outlet, Link } from 'react-router-dom';
import AppShell from './components/AppShell';
import { RequireAuth, GuestOnly } from './components/RouteGuards';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ComparePage from './pages/ComparePage';
import AlertsPage from './pages/AlertsPage';
import PCBuilderPage from './pages/PCBuilderPage';
import { EmptyState } from './components/States';

function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="Page not found"
      action={
        <Link to="/dashboard" className="btn btn-primary btn-sm">
          Back to dashboard
        </Link>
      }
    >
      The page you are looking for does not exist.
    </EmptyState>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />

      {/* Logged-in app */}
      <Route
        element={
          <RequireAuth>
            <AppShell>
              <Outlet />
            </AppShell>
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/pc-builder" element={<PCBuilderPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
