import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, ChevronDown, RefreshCw, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface User {
  emp_id: string;
  name: string;
  email: string;
  dept: string;
  role: string;
  designation: string;
  baseline_status: string;
  accessibility_flag: boolean;
  assigned_maps: number;
  status: string;
}

const ROLES = ['admin', 'compliance_officer', 'department_head', 'auditor', 'employee'];

const roleBadge: Record<string, { border: string; text: string; bg: string; label: string }> = {
  admin:              { border: 'border-red-500/30',     text: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Admin' },
  compliance_officer: { border: 'border-cyan-500/30',   text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: 'Compliance' },
  department_head:    { border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Dept Head' },
  auditor:            { border: 'border-amber-500/30',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Auditor' },
  employee:           { border: 'border-emerald-500/30',text: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'Employee' },
};

const roleLabel: Record<string, string> = {
  admin:              'Admin',
  compliance_officer: 'Compliance',
  department_head:    'Dept Head',
  auditor:            'Auditor',
  employee:           'Employee',
};

const roleStatAccent: Record<string, { badge: string; badgeBg: string; badgeText: string }> = {
  admin:              { badge: 'ADMIN',      badgeBg: 'bg-red-500/10',     badgeText: 'text-red-400' },
  compliance_officer: { badge: 'COMPLIANCE', badgeBg: 'bg-cyan-500/10',   badgeText: 'text-cyan-400' },
  department_head:    { badge: 'DEPT HEAD',  badgeBg: 'bg-purple-500/10', badgeText: 'text-purple-400' },
  auditor:            { badge: 'AUDITOR',    badgeBg: 'bg-amber-500/10',  badgeText: 'text-amber-400' },
  employee:           { badge: 'EMPLOYEE',   badgeBg: 'bg-emerald-500/10',badgeText: 'text-emerald-400' },
};

const DEPARTMENTS = [
  { id: 'DEPT-COMPLIANCE',        name: 'Compliance' },
  { id: 'DEPT-LEGAL',             name: 'Legal' },
  { id: 'DEPT-RISK',              name: 'Risk' },
  { id: 'DEPT-OPS',               name: 'Operations' },
  { id: 'DEPT-BRANCH-BANKING',    name: 'Branch Banking' },
  { id: 'DEPT-IT-CYBER',          name: 'IT / Cybersecurity' },
  { id: 'DEPT-FINANCE',           name: 'Finance / Accounts' },
  { id: 'DEPT-HR',                name: 'HR' },
  { id: 'DEPT-RECOVERY',          name: 'Recovery / Collections' },
  { id: 'DEPT-TREASURY',          name: 'Treasury' },
  { id: 'DEPT-SME-CREDIT',        name: 'SME / Retail / Credit' },
  { id: 'DEPT-SECURITY-VIGILANCE',name: 'Security / Vigilance' },
  { id: 'DEPT-CUSTOMER-SERVICE',  name: 'Customer Service' },
  { id: 'DEPT-MIS',               name: 'MIS / Reporting' },
  { id: 'DEPT-AUDIT',             name: 'Audit / Inspection' },
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingDept, setUpdatingDept] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = () => {
    setLoading(true);
    apiClient
      .get('/api/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => showToast('Could not load users', false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (emp_id: string, newRole: string) => {
    setUpdatingRole(emp_id);
    try {
      await apiClient.patch(`/api/admin/users/${emp_id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.emp_id === emp_id ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${roleLabel[newRole] ?? newRole}`);
    } catch {
      showToast('Failed to update role', false);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDepartmentChange = async (emp_id: string, newDept: string) => {
    setUpdatingDept(emp_id);
    try {
      await apiClient.patch(`/api/admin/users/${emp_id}/department`, { department_id: newDept });
      setUsers(prev => prev.map(u => u.emp_id === emp_id ? { ...u, dept: newDept } : u));
      const deptName = DEPARTMENTS.find(d => d.id === newDept)?.name || newDept;
      showToast(`Department updated to ${deptName}`);
    } catch {
      showToast('Failed to update department', false);
    } finally {
      setUpdatingDept(null);
    }
  };

  const handleReset = async (emp_id: string) => {
    try {
      await apiClient.post(`/api/admin/users/${emp_id}/reset-enrollment`);
      showToast('Enrollment reset successfully');
      fetchUsers();
    } catch {
      showToast('Reset failed', false);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.emp_id.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) =>
    (name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded border font-mono font-bold text-xs shadow-xl ${
              toast.ok
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400'
                : 'bg-red-950/90 border-red-500/40 text-red-400'
            }`}
          >
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#B8FF00]/10 pb-5 mb-2">
        <div>
          <span className="font-mono text-[9px] font-bold tracking-[2.5px] uppercase text-[#B8FF00] opacity-80 mb-2 block">
            // USER DIRECTORY MODULE
          </span>
          <h1 className="text-3xl font-bold font-sans text-[#F4F7F2] tracking-tight uppercase flex items-center gap-3">
            <Users className="w-7 h-7 text-[#45D8FF]" />
            User Management
          </h1>
          <p className="text-[11px] text-[#A7ADA7] font-mono tracking-widest mt-2 uppercase">
            Role Assignment &bull; Access Control &bull; Department Routing &bull; Enrollment Management
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 border border-[#B8FF00]/30 hover:border-[#B8FF00] bg-[#B8FF00]/5 hover:bg-[#B8FF00]/10 rounded text-[11px] font-bold uppercase font-mono text-[#B8FF00] transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Users
        </button>
      </div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length;
          const acc = roleStatAccent[r];
          return (
            <motion.div
              key={r}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
              className="bg-[#101411]/90 border border-[#B8FF00]/10 rounded-lg p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-default hover:-translate-y-0.5 hover:border-[#B8FF00]/30 hover:shadow-[0_0_18px_rgba(184,255,0,0.08)] transition-all duration-200"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B8FF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[9px] font-mono text-[#A7ADA7] font-bold tracking-widest uppercase mb-2 relative z-10">
                {roleLabel[r]}
              </span>
              <div className="flex items-end justify-between relative z-10">
                <h3 className="text-4xl font-sans font-bold text-[#F4F7F2]">{count}</h3>
                <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded tracking-wider ${acc.badgeBg} ${acc.badgeText}`} style={{ borderColor: 'currentColor', opacity: 1 }}>
                  {acc.badge}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search + Filter Bar */}
      <div className="bg-[#101411]/80 border border-[#B8FF00]/10 rounded-lg p-4 font-mono text-[10px] flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#B8FF00] pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, ID, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0B0D0C] border border-[#B8FF00]/20 focus:border-[#B8FF00]/60 text-[#F4F7F2] placeholder-[#64705D] pl-8 pr-3 py-2 rounded outline-none transition-all text-[11px] font-mono"
            style={{ boxShadow: 'none' }}
            onFocus={e => e.target.style.boxShadow = '0 0 12px rgba(184,255,0,0.1)'}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none bg-[#0B0D0C] border border-[#B8FF00]/20 focus:border-[#B8FF00]/50 text-[#F4F7F2] pl-3 pr-8 py-2 rounded outline-none uppercase tracking-wide cursor-pointer transition-colors text-[10px] font-mono hover:border-[#B8FF00]/40"
          >
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#B8FF00]/60" />
        </div>
        <div className="ml-auto text-[#A7ADA7] tracking-widest uppercase">
          <span className="text-[#F4F7F2] font-bold">{filtered.length}</span> / {users.length} users
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-24 text-[#A7ADA7] font-mono text-[11px] animate-pulse uppercase tracking-widest flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#45D8FF]" />
          Syncing user directory...
        </div>
      ) : (
        <motion.div
          className="bg-[#101411]/50 border border-[#B8FF00]/10 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#B8FF00]/15 bg-[#0B0D0C]/60">
                  {['Employee', 'Department', 'Role', 'Behavioral', 'MAPs', 'Actions'].map(col => (
                    <th
                      key={col}
                      className="px-5 py-3.5 text-[9px] font-mono font-bold text-[#A7ADA7] uppercase tracking-[2px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <motion.tr
                    key={u.emp_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    className={`border-b border-white/[0.04] hover:bg-[#B8FF00]/[0.03] transition-colors ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-[#0B0D0C]/30'
                    }`}
                  >
                    {/* Employee */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-[#B8FF00]/30 bg-[#0B0D0C] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-mono font-bold text-[#B8FF00]">
                            {getInitials(u.name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#F4F7F2] text-sm leading-tight">{u.name || '—'}</div>
                          <div className="text-[10px] font-mono text-[#B8FF00]/60 mt-0.5">{u.emp_id}</div>
                          <div className="text-[10px] text-[#A7ADA7]">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select
                          value={u.dept}
                          disabled={updatingDept === u.emp_id}
                          onChange={e => handleDepartmentChange(u.emp_id, e.target.value)}
                          className={`appearance-none bg-[#0B0D0C] border border-[#B8FF00]/20 focus:border-[#B8FF00]/50 text-[#F4F7F2] pl-2.5 pr-7 py-1.5 rounded outline-none text-[10px] font-mono cursor-pointer transition-colors hover:border-[#B8FF00]/40 ${
                            updatingDept === u.emp_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#B8FF00]/50" />
                      </div>
                      {updatingDept === u.emp_id && (
                        <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin text-[#45D8FF]" />
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select
                          value={u.role}
                          disabled={updatingRole === u.emp_id}
                          onChange={e => handleRoleChange(u.emp_id, e.target.value)}
                          className={`appearance-none bg-[#0B0D0C] border pl-2.5 pr-7 py-1.5 rounded outline-none text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            roleBadge[u.role]
                              ? `${roleBadge[u.role].border} ${roleBadge[u.role].text} ${roleBadge[u.role].bg}`
                              : 'border-white/10 text-[#F4F7F2]'
                          } ${updatingRole === u.emp_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{roleLabel[r] ?? r}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                      </div>
                      {updatingRole === u.emp_id && (
                        <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin text-[#45D8FF]" />
                      )}
                    </td>

                    {/* Behavioral */}
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border tracking-wider ${
                        u.baseline_status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {u.baseline_status || 'PENDING'}
                      </span>
                      {u.accessibility_flag && (
                        <span className="ml-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                          A11Y
                        </span>
                      )}
                    </td>

                    {/* MAPs */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#45D8FF]/10 border border-[#45D8FF]/25 text-[#45D8FF] text-[10px] font-mono font-bold">
                        {u.assigned_maps ?? 0}
                        <span className="text-[#45D8FF]/60 font-normal">assigned</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleReset(u.emp_id)}
                        className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 text-[10px] font-mono font-bold rounded uppercase tracking-wider transition-all active:scale-95"
                        style={{ transition: 'all 0.15s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 10px rgba(255,176,32,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        Reset Enrollment
                      </button>
                    </td>
                  </motion.tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-16 text-[#A7ADA7] font-mono text-[11px] uppercase tracking-widest"
                    >
                      No users match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Access Summary Panel */}
      <div className="p-4 bg-[#101411]/80 border border-[#B8FF00]/15 rounded-lg flex items-start gap-3">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#B8FF00]" />
        <div className="font-mono text-[10px] text-[#A7ADA7] uppercase tracking-widest leading-relaxed">
          <span className="text-[#F4F7F2] font-bold">Role Access Matrix: </span>
          Admin &amp; Compliance Officer &rarr; full portal &nbsp;|&nbsp;
          Dept Head &rarr; MAPs &nbsp;|&nbsp; Auditor &rarr; Audit logs &nbsp;|&nbsp;
          <span className="text-[#B8FF00] font-bold">Employee &rarr; My Tasks (evidence upload &amp; completion only)</span>
        </div>
      </div>

    </div>
  );
}
