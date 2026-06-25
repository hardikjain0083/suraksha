import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield,
  FileText,
  Search,
  CheckSquare,
  Map,
  Users,
  LogOut,
  Menu,
  X,
  BarChart3,
  Zap,
  Scale,
  Layers,
  Clock,
  Radio,
  Cpu,
  Activity,
  Terminal,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const t = (s: string) => s;

// ─── Nav configs grouped by categories ───────────────────────────────────────

const adminNavGroups = [
  {
    title: 'System Control',
    items: [
      { to: '/admin', icon: Shield, label: 'Admin Dashboard', exact: true },
    ]
  }
];

const deptHeadNavGroups = [
  {
    title: 'Department Head',
    items: [
      { to: '/dept/dashboard', icon: Layers, label: 'Department Gaps', exact: true },
    ]
  }
];

const employeeNavGroups = [
  {
    title: 'Task Center',
    items: [
      { to: '/employee/dashboard', icon: CheckSquare, label: 'My Gaps', exact: true },
    ]
  }
];


// ─── Role badge colours ──────────────────────────────────────────────────────
const roleBadge: Record<string, string> = {
  admin: 'al-badge-admin',
  compliance_officer: 'al-badge-compliance',
  department_head: 'al-badge-dept',
  auditor: 'al-badge-auditor',
  employee: 'al-badge-employee',
};

const roleLabel: Record<string, string> = {
  admin: 'SUPER ADMIN',
  compliance_officer: 'COMPLIANCE',
  department_head: 'DEPT HEAD',
  auditor: 'AUDITOR',
  employee: 'STAFF MEMBER',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isEmployee, isAuditor, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [threatLevel, setThreatLevel] = useState('NOMINAL');
  const [threatRatio, setThreatRatio] = useState(0.02);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setThreatRatio(prev => {
        const delta = (Math.random() - 0.5) * 0.01;
        const next = Math.max(0.01, Math.min(0.08, prev + delta));
        return parseFloat(next.toFixed(3));
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const isAuthOrHome =
    location.pathname.startsWith('/auth') || location.pathname === '/';

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate('/');
    }, 600);
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0
    ? ['SYSTEM', ...pathParts.map(p => p.toUpperCase().replace('-', '_'))]
    : ['SYSTEM', 'ROOT'];

  // ── PUBLIC LAYOUT (auth / home) ──────────────────────────────────────────
  if (isAuthOrHome) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#070907',
        overflowY: 'auto',
        position: 'relative',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        color: '#F4F7F2',
      }}>
        {/* Header removed for login page */}

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, width: '100%' }}>
          {children}
        </main>

        {/* Footer removed for login page */}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        `}</style>
      </div>
    );
  }

  // Pick navigation items based on role
  let navGroups = adminNavGroups;
  if (user?.role === 'employee') {
    navGroups = employeeNavGroups;
  } else if (user?.role === 'dept_head' || user?.role === 'department_head') {
    navGroups = deptHeadNavGroups;
  }

  const role = user?.role ?? 'compliance_officer';
  const badgeClass = roleBadge[role] ?? 'al-badge-default';

  return (
    <div className="al-root">
      {/* Sidebar */}
      <aside className={`al-sidebar${sidebarOpen ? ' al-sidebar--open' : ' al-sidebar--collapsed'}`}>
        {/* Brand */}
        <div className="al-brand">
          <div className={`al-brand-inner${!sidebarOpen ? ' al-brand-inner--center' : ''}`}>
            <div className="al-logo-mark">
              <Shield className="al-logo-icon" />
            </div>
            {sidebarOpen && (
              <div className="al-brand-text">
                <span className="al-brand-name">SURAKSHA</span>
                <span className="al-brand-sub">MAPS v4.0</span>
              </div>
            )}
          </div>
        </div>

        {/* User Identity */}
        <div className="al-user-block">
          <div className={`al-user-inner${!sidebarOpen ? ' al-user-inner--center' : ''}`}>
            <div className="al-avatar-wrap">
              <div className="al-avatar">
                {((user?.name || user?.empId || '?')[0] || '?').toUpperCase()}
              </div>
              <span className="al-online-dot" />
            </div>
            {sidebarOpen && (
              <div className="al-user-info">
                <p className="al-user-name">{user?.name || 'Compliance Officer'}</p>
                <p className="al-user-id">{user?.empId || 'EMP-SEC-991'}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="al-user-meta">
              <span className={`al-role-badge ${badgeClass}`}>
                {roleLabel[role] ?? role}
              </span>
              <span className="al-secure-dot">
                <Radio className="al-radio-icon" />
                ACTIVE
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="al-nav-scroll">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="al-nav-group">
              {sidebarOpen && (
                <div className="al-nav-group-label">{group.title}</div>
              )}
              <nav className="al-nav-items">
                {group.items.map(({ to, icon: Icon, label, exact }) => {
                  const active = exact
                    ? location.pathname === to
                    : location.pathname.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`al-nav-item${active ? ' al-nav-item--active' : ''}${!sidebarOpen ? ' al-nav-item--icon-only' : ''}`}
                      title={label}
                    >
                      {active && <span className="al-nav-indicator" />}
                      <Icon className={`al-nav-icon${active ? ' al-nav-icon--active' : ''}`} />
                      {sidebarOpen && <span className="al-nav-label">{label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* System status visual */}
        {sidebarOpen && (
          <div className="al-sys-status">
            <p className="al-sys-label">SECURE NODE ACTIVE</p>
            <div className="al-sys-dot-row">
              <span className="al-sys-dot al-sys-dot--lime" />
              <span className="al-sys-dot-text">ZERO-TRUST ENFORCED</span>
            </div>
          </div>
        )}

        {/* Toggle */}
        <div className="al-toggle-wrap">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="al-toggle-btn"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? <X className="al-toggle-icon" /> : <Menu className="al-toggle-icon" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="al-main">
        {/* Top bar */}
        <header className="al-topbar">
          <div className="al-breadcrumb">
            <Terminal className="al-breadcrumb-icon" />
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="al-breadcrumb-sep">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'al-breadcrumb-active' : 'al-breadcrumb-seg'}>
                  {b}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="al-topbar-right">
            <div className="al-telemetry">
              <span className="al-telemetry-label">THREAT_LEVEL:</span>
              <span className="al-telemetry-value">
                <span className="al-pulse-dot" />
                {threatLevel} ({threatRatio}%)
              </span>
            </div>
            <div className="al-telemetry">
              <span className="al-telemetry-label">TUNNEL:</span>
              <span className="al-telemetry-value">AES_256_GCM</span>
            </div>
            <Link
              to="/judge-guide"
              className="al-guide-btn"
            >
              <Cpu className="al-guide-icon" />
              GUIDE
            </Link>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="al-header-logout-btn"
              title="Terminate Session"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="al-header-logout-icon animate-spin" />
                  <span className="al-header-logout-text">SIGNING OUT...</span>
                </>
              ) : (
                <>
                  <LogOut className="al-header-logout-icon" />
                  <span className="al-header-logout-text">LOG OUT</span>
                </>
              )}
            </button>
            <div className="al-latency">
              <Activity className="al-latency-icon" />
              <span>22MS</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="al-content">
          {children}
        </main>

        {/* Footer */}
        <footer className="al-footer">
          <span className="al-footer-left">SuRaksha MAPS © 2026. Zero Trust Compliance Ledger Active.</span>
          <span className="al-footer-right">
            SECURE NODE // SESSION_ID: {localStorage.getItem('session_id')?.substring(0, 8) || 'N/A_LOCAL'}
          </span>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── Root ───────────────────────────────────────── */
        .al-root {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #0B0D0C;
          color: #F4F7F2;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }

        /* ── Sidebar ───────────────────────────────────── */
        .al-sidebar {
          display: flex;
          flex-direction: column;
          background: #101411;
          border-right: 1px solid rgba(184, 255, 0, 0.08);
          flex-shrink: 0;
          transition: width 0.25s ease;
          z-index: 20;
          overflow: hidden;
        }
        .al-sidebar--open { width: 240px; }
        .al-sidebar--collapsed { width: 64px; }

        /* Brand */
        .al-brand {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid rgba(184, 255, 0, 0.07);
          flex-shrink: 0;
        }
        .al-brand-inner {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .al-brand-inner--center { justify-content: center; }
        .al-logo-mark {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: rgba(184, 255, 0, 0.1);
          border: 1px solid rgba(184, 255, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .al-logo-icon { width: 18px; height: 18px; color: #B8FF00; }
        .al-brand-text { display: flex; flex-direction: column; }
        .al-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #F4F7F2;
          text-transform: uppercase;
          line-height: 1;
        }
        .al-brand-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #B8FF00;
          letter-spacing: 1.5px;
          margin-top: 3px;
          opacity: 0.7;
        }

        /* User block */
        .al-user-block {
          padding: 0.85rem 0.75rem;
          border-bottom: 1px solid rgba(184, 255, 0, 0.07);
          flex-shrink: 0;
        }
        .al-user-inner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .al-user-inner--center { justify-content: center; }
        .al-avatar-wrap { position: relative; flex-shrink: 0; }
        .al-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: rgba(184, 255, 0, 0.08);
          border: 1px solid rgba(184, 255, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #B8FF00;
        }
        .al-online-dot {
          position: absolute;
          bottom: 0; right: 0;
          width: 9px; height: 9px;
          border-radius: 50%;
          background: #B8FF00;
          border: 2px solid #101411;
        }
        .al-user-info { min-width: 0; flex: 1; }
        .al-user-name {
          font-size: 11px;
          font-weight: 600;
          color: #F4F7F2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Space Grotesk', sans-serif;
        }
        .al-user-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #A7ADA7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .al-user-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.6rem;
        }
        .al-role-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 3px;
        }
        .al-badge-admin { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .al-badge-compliance { background: rgba(184,255,0,0.08); color: #B8FF00; border: 1px solid rgba(184,255,0,0.2); }
        .al-badge-dept { background: rgba(139,92,246,0.1); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }
        .al-badge-auditor { background: rgba(245,158,11,0.1); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .al-badge-employee { background: rgba(20,184,166,0.1); color: #2dd4bf; border: 1px solid rgba(20,184,166,0.2); }
        .al-badge-default { background: rgba(100,116,139,0.1); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }

        .al-secure-dot {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: #B8FF00;
          display: flex;
          align-items: center;
          gap: 3px;
          opacity: 0.7;
        }
        .al-radio-icon { width: 9px; height: 9px; animation: al-pulse 2s infinite; }
        @keyframes al-pulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }

        /* Nav */
        .al-nav-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem 0.5rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(184,255,0,0.1) transparent;
        }
        .al-nav-group { margin-bottom: 1.25rem; }
        .al-nav-group-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(184,255,0,0.3);
          text-transform: uppercase;
          padding: 0 0.5rem;
          margin-bottom: 0.4rem;
        }
        .al-nav-items { display: flex; flex-direction: column; gap: 2px; }
        .al-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0.65rem;
          border-radius: 7px;
          text-decoration: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #A7ADA7;
          transition: background 0.15s, color 0.15s;
          border: 1px solid transparent;
          overflow: hidden;
        }
        .al-nav-item:hover { background: rgba(184,255,0,0.05); color: #F4F7F2; }
        .al-nav-item--active {
          background: rgba(184,255,0,0.07);
          color: #B8FF00;
          border-color: rgba(184,255,0,0.15);
        }
        .al-nav-item--icon-only { justify-content: center; }
        .al-nav-indicator {
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 2px;
          background: #B8FF00;
          border-radius: 0 2px 2px 0;
          box-shadow: 0 0 8px rgba(184,255,0,0.5);
        }
        .al-nav-icon { width: 15px; height: 15px; color: #A7ADA7; flex-shrink: 0; }
        .al-nav-icon--active { color: #B8FF00; }
        .al-nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* System status */
        .al-sys-status {
          margin: 0 0.75rem 0.5rem;
          padding: 0.65rem 0.75rem;
          border: 1px solid rgba(184,255,0,0.08);
          border-radius: 8px;
          background: rgba(184,255,0,0.03);
          flex-shrink: 0;
        }
        .al-sys-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          letter-spacing: 2px;
          color: rgba(184,255,0,0.5);
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .al-sys-dot-row { display: flex; align-items: center; gap: 0.4rem; }
        .al-sys-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .al-sys-dot--lime { background: #B8FF00; box-shadow: 0 0 6px rgba(184,255,0,0.6); }
        .al-sys-dot-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: #A7ADA7;
          letter-spacing: 0.5px;
        }

        /* ── Header Logout Button ─────────────────────── */
        .al-header-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          height: 38px;
          padding: 0 1rem;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .al-header-logout-btn:hover:not(:disabled) {
          background: rgba(220, 38, 38, 0.2);
          border-color: rgba(220, 38, 38, 0.5);
          box-shadow: 0 0 12px rgba(220, 38, 38, 0.2);
          transform: translateY(-1px);
        }
        .al-header-logout-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.96);
        }
        .al-header-logout-btn:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }
        .al-header-logout-icon {
          width: 14px;
          height: 14px;
        }
        @media (max-width: 768px) {
          .al-header-logout-btn {
            padding: 0 0.6rem;
          }
          .al-header-logout-text {
            display: none;
          }
        }

        /* Toggle */
        .al-toggle-wrap {
          padding: 0.4rem 0.75rem;
          border-top: 1px solid rgba(184,255,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .al-toggle-btn {
          padding: 0.4rem;
          background: transparent;
          border: none;
          color: #A7ADA7;
          cursor: pointer;
          border-radius: 5px;
          transition: color 0.15s, background 0.15s;
        }
        .al-toggle-btn:hover { color: #B8FF00; background: rgba(184,255,0,0.05); }
        .al-toggle-icon { width: 15px; height: 15px; }

        /* ── Main area ───────────────────────────────── */
        .al-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Top bar */
        .al-topbar {
          height: 52px;
          background: #101411;
          border-bottom: 1px solid rgba(184,255,0,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          flex-shrink: 0;
        }
        .al-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
        }
        .al-breadcrumb-icon { width: 13px; height: 13px; color: #B8FF00; margin-right: 0.2rem; }
        .al-breadcrumb-sep { color: rgba(184,255,0,0.2); }
        .al-breadcrumb-active { color: #B8FF00; font-weight: 600; }
        .al-breadcrumb-seg { color: #A7ADA7; }

        .al-topbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .al-telemetry {
          display: none;
          align-items: center;
          gap: 0.4rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 0.25rem 0.65rem;
          border: 1px solid rgba(184,255,0,0.08);
          border-radius: 4px;
        }
        @media (min-width: 900px) { .al-telemetry { display: flex; } }
        .al-telemetry-label { color: #A7ADA7; }
        .al-telemetry-value { color: #B8FF00; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .al-pulse-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #B8FF00;
          animation: al-pulse 2s infinite;
        }
        .al-guide-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.75rem;
          border: 1px solid rgba(184,255,0,0.25);
          border-radius: 4px;
          color: #B8FF00;
          text-decoration: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: background 0.15s, border-color 0.15s;
          background: rgba(184,255,0,0.04);
        }
        .al-guide-btn:hover { background: rgba(184,255,0,0.1); border-color: rgba(184,255,0,0.45); }
        .al-guide-icon { width: 11px; height: 11px; }
        .al-latency {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #B8FF00;
        }
        .al-latency-icon { width: 12px; height: 12px; animation: al-pulse 2s infinite; }

        /* Content */
        .al-content {
          flex: 1;
          overflow-y: auto;
          background: #0B0D0C;
          padding: 1.5rem 1.75rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(184,255,0,0.1) transparent;
        }

        /* Footer */
        .al-footer {
          height: 36px;
          background: #101411;
          border-top: 1px solid rgba(184,255,0,0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          flex-shrink: 0;
        }
        .al-footer-left { color: rgba(167,173,167,0.4); }
        .al-footer-right { color: rgba(184,255,0,0.4); font-weight: 600; }
      `}</style>
    </div>
  );
}
