import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from './AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <div className="auth-loading-spinner" />
          <p>Verificando sua sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
