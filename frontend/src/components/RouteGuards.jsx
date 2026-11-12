import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PageSpinner() {
  return (
    <div className="page-spinner" role="status" aria-label="Loading">
      <div className="spinner spinner-lg" />
    </div>
  );
}

/** Logged-in users only. Others are sent to /login and returned here afterwards. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Login/register pages: logged-in users skip straight to where they were headed. */
export function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (user) {
    const from = location.state?.from;
    const target = from?.pathname ? `${from.pathname}${from.search || ''}` : '/dashboard';
    return <Navigate to={target} replace />;
  }
  return children;
}
