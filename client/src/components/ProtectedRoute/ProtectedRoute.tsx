import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/pages/Loading/Loading';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  return children ?? <Outlet />;
}

export default ProtectedRoute;
