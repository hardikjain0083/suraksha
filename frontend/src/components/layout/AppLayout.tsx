import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ─── Nav configs ────────────────────────────────────────────────────────────

const adminNav = [
  { to: '/admin', icon: '🛡️', label: 'Dashboard', exact: true },
  { to: '/admin/circulars', icon: '📄', label: 'Circulars' },
  { to: '/admin/gaps', icon: '🔍', label: 'Gap Detection' },
  { to: '/admin/gaps/queue', icon: '📋', label: 'Triage Queue' },
  { to: '/admin/triage', icon: '⚖️', label: 'MAP Triage' },
  { to: '/admin/maps', icon: '📂', label: 'MAPs' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/validation', icon: '✅', label: 'Validation' },
  { to: '/audit/logs', icon: '📜', label: 'Audit Logs' },
];

const auditorNav = [
  { to: '/audit', icon: '📜', label: 'Audit Portal', exact: true },
  { to: '/audit/logs', icon: '📋', label: 'Audit Logs' },
  { to: '/admin/maps', icon: '📂', label: 'View MAPs' },
];

const employeeNav = [
  { to: '/employee/dashboard', icon: '📋', label: 'My Tasks', exact: true },
];

// ─── Role badge colours ──────────────────────────────────────────────────────
const roleBadge: Record<string, string> = {
  admin: 'bg-red-700 text-white',
  compliance_officer: 'bg-canara-blue text-white',
  department_head: 'bg-purple-700 text-white',
  auditor: 'bg-amber-600 text-white',
  employee: 'bg-emerald-700 text-white',
};

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  compliance_officer: 'Compliance',
  department_head: 'Dept Head',
  auditor: 'Auditor',
  employee: 'Employee',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isEmployee, isAuditor, logout } = useAuth();

  const isAuthOrHome =
    location.pathname.startsWith('/auth') || location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isAuthOrHome) {
    return <div className="flex-1 overflow-y-auto">{children}</div>;
  }

  // Pick nav for role
  let navItems = adminNav;
  if (isEmployee) navItems = employeeNav;
  else if (isAuditor) navItems = auditorNav;

  const role = user?.role ?? 'compliance_officer';
  const badgeClass = roleBadge[role] ?? 'bg-slate-600 text-white';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col z-20">

        {/* User identity block */}
        <div className="p-4 border-b border-slate-700 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-canara-blue flex items-center justify-center text-sm font-bold shrink-0">
              {((user?.name || user?.empId || '?')[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || user?.empId || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.empId}</p>
            </div>
          </div>
          <span className={`self-start mt-1 px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>
            {roleLabel[role] ?? role}
          </span>
        </div>

        {/* Nav */}
        <div className="px-2 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Navigation
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
          {navItems.map(({ to, icon, label, exact }) => {
            const active = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`p-3 rounded-md flex items-center gap-3 transition-colors text-sm ${
                  active
                    ? 'bg-canara-blue text-white font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 mt-auto border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full p-2 bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 transition-colors flex justify-center items-center gap-2 text-sm"
          >
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {children}
      </main>
    </div>
  );
}
