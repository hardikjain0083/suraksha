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
  admin: 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-glow-red/20',
  compliance_officer: 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 shadow-glow-cyan/20',
  department_head: 'bg-cyber-magenta/10 text-cyber-magenta border border-cyber-magenta/20 shadow-glow-magenta/20',
  auditor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-glow-yellow/20',
  employee: 'bg-cyber-green/10 text-cyber-green border border-cyber-green/20 shadow-glow-green/20',
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

  // Periodic subtle variation in threat telemetry for cyber ambiance
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
    logout();
    navigate('/');
  };

  // Convert current pathname to a high-tech breadcrumb array
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0 
    ? ['SYSTEM', ...pathParts.map(p => p.toUpperCase().replace('-', '_'))]
    : ['SYSTEM', 'ROOT'];

  if (isAuthOrHome) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#080808', overflowY: 'auto', position: 'relative', fontFamily: "'Space Grotesk', system-ui, sans-serif", color: '#FFFFFF' }}>
        {/* Public Header — Blackbird IT style */}
        <header style={{
          background: 'transparent',
          borderBottom: '1px solid rgba(170, 255, 0, 0.1)',
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#FFFFFF',
              textTransform: 'uppercase',
            }}>SuRaksha MAPS</span>
            <span style={{
              background: 'rgba(170, 255, 0, 0.1)',
              color: '#AAFF00',
              border: '1px solid rgba(170, 255, 0, 0.3)',
              borderRadius: '4px',
              fontSize: '10px',
              padding: '2px 7px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '1px',
            }}>v4.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/judge-guide"
              style={{
                background: 'transparent',
                border: '1px solid #AAFF00',
                color: '#AAFF00',
                borderRadius: '999px',
                padding: '6px 18px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#AAFF00';
                (e.currentTarget as HTMLElement).style.color = '#080808';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#AAFF00';
              }}
            >
              JUDGE GUIDE
            </Link>
          </div>
        </header>

        {/* Content Wrapper */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, width: '100%' }}>
          {children}
        </main>

        {/* Public Footer */}
        <footer style={{
          background: 'transparent',
          borderTop: '1px solid rgba(170, 255, 0, 0.08)',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: 'rgba(170, 255, 0, 0.3)',
          letterSpacing: '1px',
          zIndex: 10,
        }}>
          <p>SuRaksha Compliance Intelligence Platform &copy; 2026</p>
        </footer>
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
  const badgeClass = roleBadge[role] ?? 'bg-slate-800/30 text-slate-400 border border-slate-700/50';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian-900 text-foreground font-sans">
      {/* Cybersecurity scan line effect (subtle overlay) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,54,0)_50%,rgba(0,217,255,0.015)_50%),linear-gradient(90deg,rgba(18,24,54,0)_50%,rgba(0,217,255,0.015)_50%)] bg-[size:4px_4px] pointer-events-none z-50" />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-obsidian-955 border-r border-cyber-cyan/10 flex flex-col z-20 transition-all duration-300 shadow-xl shrink-0`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-cyber-cyan/10 flex items-center justify-between bg-obsidian-950/50">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-cyan to-cyber-blue flex items-center justify-center font-bold text-obsidian-950 shrink-0 shadow-glow-cyan/20">
              <Shield className="w-5.5 h-5.5 text-obsidian-900" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-widest text-cyber-cyan font-mono">{t('SURAKSHA')}</span>
                <span className="text-[10px] text-cyber-blue font-mono font-bold tracking-wider">{t('MAPS v4.0')}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Identity Information */}
        <div className="p-4 border-b border-cyber-cyan/10 bg-obsidian-950/30">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-cyan/20 to-cyber-blue/20 flex items-center justify-center text-sm font-mono font-bold text-cyber-cyan border border-cyber-cyan/40 shadow-glow-cyan/10">
                {((user?.name || user?.empId || '?')[0] || '?').toUpperCase()}
              </div>
              {/* Online Pulse Indicator */}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-cyber-green border-2 border-obsidian-950 animate-pulse" />
            </div>
            
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate font-mono">
                  {user?.name || 'Compliance Officer'}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{user?.empId || 'EMP-SEC-991'}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${badgeClass}`}>
                {roleLabel[role] ?? role}
              </span>
              <span className="text-[9px] text-cyber-green font-mono flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                DECRYPTED
              </span>
            </div>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              {sidebarOpen && (
                <div className="text-[9px] font-bold text-cyber-cyan/40 uppercase tracking-widest px-3 font-mono">
                  {group.title}
                </div>
              )}
              <nav className="space-y-1">
                {group.items.map(({ to, icon: Icon, label, exact }) => {
                  const active = exact
                    ? location.pathname === to
                    : location.pathname.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`group relative py-2.5 px-3 rounded-lg flex items-center gap-3 transition-all duration-200 font-mono text-xs font-semibold ${
                        active
                          ? 'bg-gradient-to-r from-cyber-cyan/15 to-cyber-blue/15 text-cyber-cyan border border-cyber-cyan/30 shadow-glow-cyan'
                          : 'text-slate-400 hover:bg-white/5 hover:text-foreground border border-transparent'
                      }`}
                      title={label}
                    >
                      {/* Active glow indicator line */}
                      {active && (
                        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyber-cyan rounded-r shadow-glow-cyan" />
                      )}
                      
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-cyber-cyan' : 'text-slate-400 group-hover:text-cyber-cyan'}`} />
                      {sidebarOpen && (
                        <span className="truncate">{label}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Logout Control */}
        <div className="p-3 border-t border-cyber-cyan/10 bg-obsidian-950/40">
          <button
            onClick={handleLogout}
            className={`w-full p-2.5 bg-red-950/20 text-red-400 hover:bg-red-950/45 border border-red-500/20 hover:border-red-500/40 rounded-lg flex items-center gap-2 text-xs font-mono font-bold transition-all duration-200 ${!sidebarOpen ? 'justify-center' : 'justify-start'}`}
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
             {sidebarOpen && <span>{t('LOGOUT SESSION')}</span>}
          </button>
        </div>

        {/* Sidebar Toggle */}
        <div className="p-2 border-t border-cyber-cyan/10 bg-obsidian-950/60 flex items-center justify-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-muted-foreground hover:text-cyber-cyan transition-colors rounded-lg hover:bg-white/5"
            title={sidebarOpen ? 'Collapse Console' : 'Expand Console'}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-obsidian-950 border-b border-cyber-cyan/10 flex items-center justify-between px-6 z-10 shrink-0 shadow-lg">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <Terminal className="w-4 h-4 text-cyber-cyan" />
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-cyber-cyan/30">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-cyber-cyan font-bold animate-pulse-glow' : 'text-slate-500'}>{b}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Telemetry Status widgets */}
          <div className="flex items-center gap-6">
            {/* Threat Index */}
            <div className="hidden md:flex items-center gap-2 border border-cyber-cyan/10 bg-obsidian-900/50 px-3 py-1 rounded font-mono text-[10px]">
              <span className="text-slate-500">{t('THREAT_LEVEL:')}</span>
              <span className="text-cyber-green font-bold flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
                {threatLevel} ({threatRatio}%)
              </span>
            </div>

            {/* Shield State */}
            <div className="hidden sm:flex items-center gap-2 border border-cyber-cyan/10 bg-obsidian-900/50 px-3 py-1 rounded font-mono text-[10px]">
              <span className="text-slate-500">{t('SECURE_TUNNEL:')}</span>
              <span className="text-cyber-cyan font-bold">{t('AES_256_GCM')}</span>
            </div>

            {/* Quick guide and tools */}
            <div className="flex items-center gap-3">
              <Link 
                to="/judge-guide" 
                className="px-2.5 py-1 border border-cyber-green/30 hover:border-cyber-green/60 text-cyber-green bg-cyber-green/5 hover:bg-cyber-green/10 rounded text-[10px] font-mono font-bold transition-all shadow-glow-green/10 flex items-center gap-1 animate-pulse-glow"
              >
                <Cpu className="w-3 h-3" />
                GUIDE
              </Link>
              
              {/* Latency Pulse */}
              <div className="flex items-center gap-1.5" title="Server Latency: 22ms">
                <Activity className="w-4 h-4 text-cyber-cyan animate-pulse" />
                <span className="text-[10px] font-mono text-cyber-cyan">22MS</span>
              </div>
            </div>
          </div>
        </header>

        {/* Route content */}
        <main className="flex-1 overflow-y-auto relative bg-gradient-cyber-subtle p-6">
          <div className="absolute inset-0 bg-[radial-gradient(#1f293720_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>

        {/* Dashboard Footer */}
        <footer className="h-10 bg-obsidian-950 border-t border-cyber-cyan/10 flex items-center justify-between px-6 text-[10px] font-mono text-muted-foreground shrink-0">
          <span className="text-cyber-cyan/40">{t('SuRaksha MAPS © 2026. Zero Trust Compliance Ledger Active.')}</span>
          <span className="text-cyber-blue font-bold">{t('SECURE NODE // SESSION_ID: ')}{localStorage.getItem('session_id')?.substring(0, 8) || 'N/A_LOCAL'}</span>
        </footer>
      </div>
    </div>
  );
}
