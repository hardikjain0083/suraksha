import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, ChevronDown, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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

const roleBadge: Record<string, string> = {
  admin:              'bg-red-100 text-red-700 border-red-200',
  compliance_officer: 'bg-blue-100 text-blue-700 border-blue-200',
  department_head:    'bg-purple-100 text-purple-700 border-purple-200',
  auditor:            'bg-amber-100 text-amber-700 border-amber-200',
  employee:           'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const roleLabel: Record<string, string> = {
  admin:              'Admin',
  compliance_officer: 'Compliance',
  department_head:    'Dept Head',
  auditor:            'Auditor',
  employee:           'Employee',
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

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
      showToast(`✅ Role updated to ${roleLabel[newRole] ?? newRole}`);
    } catch {
      showToast('❌ Failed to update role', false);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleReset = async (emp_id: string) => {
    try {
      await apiClient.post(`/api/admin/users/${emp_id}/reset-enrollment`);
      showToast('✅ Enrollment reset successfully');
      fetchUsers();
    } catch {
      showToast('❌ Reset failed', false);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm ${
              toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-canara-blue" />
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm text-slate-500">Manage roles, assignments, and access levels</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, ID, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border px-4 py-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-canara-blue/40 text-sm"
        />
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none border px-4 py-2 pr-8 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-canara-blue/40 bg-white"
          >
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length;
          return (
            <div key={r} className={`rounded-xl border px-4 py-3 text-center ${roleBadge[r]}`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs font-semibold">{roleLabel[r]}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-canara-blue" />
        </div>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-left">Dept</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Behavioral</th>
                <th className="px-5 py-3 text-left">MAPs</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {filtered.map(u => (
                <tr key={u.emp_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{u.name || '—'}</div>
                    <div className="text-xs text-slate-400 font-mono">{u.emp_id}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{u.dept}</td>
                  <td className="px-5 py-4">
                    {/* Role change dropdown */}
                    <div className="relative inline-block">
                      <select
                        value={u.role}
                        disabled={updatingRole === u.emp_id}
                        onChange={e => handleRoleChange(u.emp_id, e.target.value)}
                        className={`appearance-none border rounded-lg px-3 py-1.5 pr-7 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-canara-blue/40 ${roleBadge[u.role] ?? 'bg-slate-100'} ${updatingRole === u.emp_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {updatingRole === u.emp_id && (
                      <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-canara-blue" />
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.baseline_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {u.baseline_status}
                    </span>
                    {u.accessibility_flag && (
                      <span className="ml-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">A11y</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-canara-blue">{u.assigned_maps ?? 0}</span>
                    <span className="text-slate-400 text-xs ml-1">assigned</span>
                  </td>
                  <td className="px-5 py-4 space-x-3">
                    <button
                      onClick={() => handleReset(u.emp_id)}
                      className="text-orange-500 font-medium hover:underline text-xs"
                    >
                      Reset Enrollment
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Demo hint */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Role access summary:</strong> Admin & Compliance Officer → full portal &nbsp;|&nbsp;
          Dept Head → MAPs &nbsp;|&nbsp; Auditor → Audit logs &nbsp;|&nbsp;
          <strong>Employee → My Tasks (evidence upload & completion only)</strong>
        </div>
      </div>
    </div>
  );
}