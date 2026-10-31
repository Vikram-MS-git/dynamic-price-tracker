import { Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ComparePage from './pages/ComparePage';
import AlertsPage from './pages/AlertsPage';
import { EmptyState } from './components/States';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="Page not found"
      action={
        <Link to="/" className="btn btn-primary btn-sm">
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
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
