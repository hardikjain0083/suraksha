import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DEPT_ROLES = ['employee', 'department_head', 'dept_head'];

/** Redirect to login if not authenticated */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

/** Admin-only: department employees/heads redirected to dept portal */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isEmployee, user } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (isEmployee) {
    return <Navigate to="/dept" replace />;
  }
  return <>{children}</>;
}

/** Department portal: employee or department_head only */
export function EmployeeRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  const role = user?.role ?? '';
  if (!DEPT_ROLES.includes(role)) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}
