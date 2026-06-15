import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AuthUser {
  empId: string;
  role: string;
  name?: string;
  department?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isEmployee: boolean;
  isAuditor: boolean;
  isLoggedIn: boolean;
  setAuth: (user: AuthUser) => void;
  logout: () => void;
}

const ADMIN_ROLES = ['admin', 'compliance_officer', 'auditor', 'super_admin'];
const DEPT_ROLES = ['employee', 'department_head', 'dept_head'];

const AuthContext = createContext<AuthContextValue | null>(null);

function readFromStorage(): AuthUser | null {
  const empId = localStorage.getItem('emp_id');
  const role = localStorage.getItem('user_role');
  if (!empId || !role) return null;
  return {
    empId,
    role,
    name: localStorage.getItem('user_name') ?? undefined,
    department: localStorage.getItem('user_dept') ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readFromStorage);

  // Sync on storage changes (multi-tab support)
  useEffect(() => {
    const handler = () => setUser(readFromStorage());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setAuth = useCallback((u: AuthUser) => {
    localStorage.setItem('emp_id', u.empId);
    localStorage.setItem('user_role', u.role);
    if (u.name) localStorage.setItem('user_name', u.name);
    if (u.department) localStorage.setItem('user_dept', u.department);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const role = user?.role ?? '';
  const isAdmin = ADMIN_ROLES.includes(role);
  const isEmployee = DEPT_ROLES.includes(role);
  const isAuditor = role === 'auditor';

  return (
    <AuthContext.Provider value={{ user, isAdmin, isEmployee, isAuditor, isLoggedIn: !!user, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
