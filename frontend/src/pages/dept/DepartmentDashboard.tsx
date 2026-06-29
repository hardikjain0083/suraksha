import { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Edit, 
  Check, 
  Trash, 
  UserPlus, 
  Calendar,
  Loader2,
  Activity
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '@/components/ui/glass-card';

export function DepartmentDashboard() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit & Triage states
  const [editingGap, setEditingGap] = useState<any | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editSeverity, setEditSeverity] = useState('medium');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [reassigningGapId, setReassigningGapId] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Notification states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const deptId = user?.department || 'DEPT-COMPLIANCE';
  const cleanDeptName = deptId.replace('DEPT-', '').replace('_', ' ');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch department gaps
      const gapsRes = await apiClient.get(`/api/gaps/department/${deptId}`);
      setGaps(gapsRes.data);

      // Fetch user notifications
      const notifRes = await apiClient.get('/api/gaps/notifications');
      setNotifications(notifRes.data);

      // Fetch real users belonging to this department
      const usersRes = await apiClient.get('/api/admin/users', { params: { department: deptId } });
      const empList = usersRes.data.filter((u: any) => u.role === 'employee');
      
      // Calculate staff workload dynamically
      const staffed = empList.map((emp: any) => {
        const count = gapsRes.data.filter((g: any) => g.assigned_employee === emp.emp_id && g.triage_status === 'assigned').length;
        return {
          ...emp,
          active_workload: count
        };
      });
      setEmployees(staffed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (empId: string, currentStatus: string) => {
    const statuses = ['available', 'on_leave', 'busy'];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];
    
    try {
      const formData = new FormData();
      formData.append('availability_status', nextStatus);
      formData.append('employee_id', empId);
      await apiClient.put('/api/gaps/employee/availability', formData);
      triggerToast(`Updated availability for ${empId} to ${nextStatus}.`);
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Failed to update availability', true);
    }
  };


  useEffect(() => {
    if (user?.empId) {
      fetchData();
    }
  }, [user?.empId]);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleCancelGap = async (gapId: string) => {
    if (!confirm('Are you sure you want to cancel this gap?')) return;
    setActionLoading(gapId);
    try {
      await apiClient.patch(`/api/gaps/${gapId}/cancel`);
      triggerToast('Compliance gap successfully cancelled.');
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Cancellation failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReassign = async (gapId: string) => {
    if (!selectedEmpId) return;
    setActionLoading(gapId);
    try {
      const formData = new FormData();
      formData.append('new_employee_id', selectedEmpId);
      await apiClient.patch(`/api/gaps/${gapId}/reassign`, formData);
      triggerToast(`Task successfully reassigned to ${selectedEmpId}.`);
      setReassigningGapId(null);
      setSelectedEmpId('');
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Reassignment failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditGapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGap) return;
    setActionLoading(editingGap.gap_id);
    try {
      const formData = new FormData();
      formData.append('mismatch_description', editDesc);
      formData.append('due_date', editDue);
      formData.append('severity', editSeverity);

      await apiClient.patch(`/api/gaps/${editingGap.gap_id}/edit`, formData);
      triggerToast('Gap details successfully updated.');
      setEditingGap(null);
      fetchData();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Edit failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (gap: any) => {
    setEditingGap(gap);
    setEditDesc(gap.mismatch_description || gap.classification_reason || '');
    setEditDue(gap.due_date ? gap.due_date.substring(0, 10) : '');
    setEditSeverity(gap.severity || 'medium');
  };

  const openGaps = gaps.filter(g => g.triage_status === 'assigned');
  const resolvedGaps = gaps.filter(g => g.triage_status === 'resolved');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            DEPARTMENT HOD CONSOLE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage compliance gaps for the <span className="text-cyber-green font-bold uppercase">{cleanDeptName}</span> department.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-cyber-cyan/35 hover:border-cyber-cyan bg-obsidian-950 hover:bg-cyber-cyan/5 rounded text-xs font-mono text-cyber-cyan"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
          </button>
        </div>
      </div>

      {/* Notifications Banners */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 text-xs font-mono rounded">
          {successMsg.toUpperCase()}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-400 text-xs font-mono rounded">
          {errorMsg.toUpperCase()}
        </div>
      )}

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 border-cyber-cyan/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Department Active Gaps</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-cyan mt-1">{openGaps.length}</h3>
        </GlassCard>
        <GlassCard className="p-5 border-cyber-green/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Resolved Compliance Items</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-green mt-1">{resolvedGaps.length}</h3>
        </GlassCard>
        <GlassCard className="p-5 border-cyber-magenta/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Actions Taken</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-magenta mt-1">{gaps.length}</h3>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Workloads and Alerts */}
        <div className="xl:col-span-1 space-y-6">
          {/* Workload list */}
          <GlassCard className="p-5 border-cyber-cyan/10">
            <h3 className="text-xs font-bold font-mono text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Staff Workloads
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {employees.map(emp => (
                <div key={emp.emp_id} className="p-3 bg-obsidian-950/80 border border-cyber-cyan/10 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-200 font-bold">{emp.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{emp.emp_id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.active_workload >= 3 
                          ? 'bg-red-500/10 text-red-400' 
                          : emp.active_workload >= 1 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {emp.active_workload} Active
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      emp.availability_status === 'available'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : emp.availability_status === 'on_leave'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {emp.availability_status ? emp.availability_status.toUpperCase() : 'AVAILABLE'}
                    </span>
                    <button
                      onClick={() => handleToggleAvailability(emp.emp_id, emp.availability_status || 'available')}
                      className="px-2 py-0.5 bg-cyber-cyan/15 hover:bg-cyber-cyan text-cyber-cyan hover:text-obsidian-950 border border-cyber-cyan/30 rounded text-[9px] font-mono font-bold transition-all"
                    >
                      Cycle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Notifications feed */}
          <GlassCard className="p-5 border-cyber-cyan/10">
            <h3 className="text-xs font-bold font-mono text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Department Alerts
            </h3>
            <div className="space-y-3 font-mono text-[10px] max-h-[220px] overflow-y-auto scrollbar-none">
              {notifications.length === 0 ? (
                <p className="text-slate-500 italic">No alerts recorded.</p>
              ) : (
                notifications.slice(0, 10).map((notif, idx) => (
                  <div key={idx} className="p-2.5 bg-obsidian-950/40 rounded border border-cyber-cyan/5">
                    <p className="text-cyber-cyan font-bold uppercase">{notif.title}</p>
                    <p className="text-slate-400 mt-0.5">{notif.message}</p>
                    <span className="text-slate-600 block mt-1">{new Date(notif.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Gaps List and Editors */}
        <div className="xl:col-span-3 space-y-6">
          {editingGap && (
            <GlassCard className="p-5 border-cyber-magenta/20 bg-obsidian-950/60 animate-glow-flicker">
              <h3 className="text-xs font-bold font-mono text-cyber-magenta uppercase mb-3 flex items-center gap-1.5">
                <Edit className="w-4 h-4" />
                Edit Gap Details ({editingGap.gap_id})
              </h3>
              <form onSubmit={handleEditGapSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Mismatch Details</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-obsidian-950 border border-cyber-magenta/20 focus:border-cyber-magenta rounded text-slate-200 outline-none font-sans"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Target Deadline</label>
                    <input
                      type="date"
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                      className="w-full p-2 bg-obsidian-950 border border-cyber-magenta/20 focus:border-cyber-magenta rounded text-slate-200 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Priority Severity</label>
                    <select
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value)}
                      className="w-full p-2 bg-obsidian-950 border border-cyber-magenta/20 rounded text-slate-200 outline-none"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingGap(null)}
                    className="px-3 py-1.5 bg-obsidian-900 border border-slate-700 text-slate-300 rounded font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === editingGap.gap_id}
                    className="px-4 py-1.5 bg-cyber-magenta text-white rounded font-bold hover:shadow-glow-magenta transition-all flex items-center gap-1"
                  >
                    {actionLoading === editingGap.gap_id ? (
                      <Loader2 className="w-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Save Updates
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          <GlassCard className="p-6 border-cyber-cyan/10">
            <h3 className="text-xs font-bold font-mono text-cyber-cyan uppercase mb-4">Department Gap Ledger</h3>
            {loading ? (
              <div className="text-center py-12 text-slate-400 font-mono animate-pulse">Synchronizing department ledger...</div>
            ) : gaps.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-mono text-xs">No active compliance gaps in your department registry.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-cyber-cyan/25 text-slate-400 text-[10px] uppercase">
                      <th className="pb-3">Gap ID</th>
                      <th className="pb-3">Circular Clause Details</th>
                      <th className="pb-3">Page</th>
                      <th className="pb-3">Core Policy Target</th>
                      <th className="pb-3">Assignee Workload</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-cyan/5">
                    {gaps.map(gap => (
                      <tr key={gap.gap_id} className={`hover:bg-white/5 transition-colors ${gap.triage_status === 'superseded' ? 'opacity-40 select-none bg-black/10' : ''}`}>
                        <td className="py-4 text-cyber-magenta font-bold">
                          {gap.gap_id}
                          {gap.source === 'fix_regression' && (
                            <span className="block text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.5 rounded font-mono font-bold mt-1 uppercase w-max">
                              Regression
                            </span>
                          )}
                          {gap.triage_status === 'superseded' && (
                            <span className="block text-[8px] bg-slate-700/20 text-slate-400 border border-slate-700/30 px-1 py-0.5 rounded font-mono font-bold mt-1 uppercase w-max">
                              Superseded
                            </span>
                          )}
                        </td>
                        <td className="py-4 max-w-[300px]">
                          <p className="text-slate-200 font-semibold">{gap.circular_title || 'RBI Circular'}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 font-sans leading-normal">{gap.mismatch_description || gap.clause_text}</p>
                        </td>
                        <td className="py-4 text-center font-bold text-cyber-cyan">{gap.page_number}</td>
                        <td className="py-4 text-slate-300 font-medium">{gap.top_policy_title}</td>
                        <td className="py-4">
                          <div className="text-slate-200 font-bold">{gap.assigned_employee}</div>
                          <div className="text-[9px] text-slate-500">Due: {new Date(gap.due_date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            gap.triage_status === 'resolved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : gap.triage_status === 'cancelled' || gap.triage_status === 'superseded'
                                ? 'bg-slate-700/20 text-slate-500 border border-slate-700/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {gap.triage_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {gap.triage_status === 'assigned' && (
                              <>
                                <button
                                  onClick={() => startEdit(gap)}
                                  className="px-2 py-1 bg-cyber-cyan/10 hover:bg-cyber-cyan text-cyber-cyan hover:text-obsidian-950 border border-cyber-cyan/35 rounded text-[10px] font-bold transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReassigningGapId(gap.gap_id); }}
                                  className="px-2 py-1 bg-cyber-blue/10 hover:bg-cyber-blue text-cyber-blue hover:text-white border border-cyber-blue/35 rounded text-[10px] font-bold transition-all"
                                >
                                  Reassign
                                </button>
                                <button
                                  onClick={() => handleCancelGap(gap.gap_id)}
                                  disabled={actionLoading === gap.gap_id}
                                  className="px-2 py-1 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/25 rounded text-[10px] font-bold transition-all"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                          {reassigningGapId === gap.gap_id && (
                            <div
                              className="mt-2 flex gap-1 justify-end items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={selectedEmpId}
                                onChange={(e) => setSelectedEmpId(e.target.value)}
                                className="bg-obsidian-950 border border-cyber-cyan/30 text-slate-300 text-[10px] px-1 py-0.5 rounded outline-none"
                              >
                                <option value="">Select Staff</option>
                                {employees.map(emp => (
                                  <option key={emp.emp_id} value={emp.emp_id}>{emp.name} ({emp.emp_id})</option>
                                ))}
                              </select>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleReassign(gap.gap_id); }}
                                className="p-1 bg-cyber-cyan text-obsidian-950 rounded hover:scale-105 transition-transform"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}