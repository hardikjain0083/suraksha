import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Loader2, Download, Filter, ChevronRight,
  AlertTriangle, UserPlus, Calendar, ArrowUpRight, UserCheck, X,
} from 'lucide-react';
import { mapsApi, apiClient } from '../../lib/api';
import type { MapListItem } from '../../types/map';
import { MapDetailModal } from '../../components/maps/MapDetailModal';

const STATUS_OPTIONS = ['draft', 'approved', 'open', 'in_progress', 'complete', 'rejected', 'escalated'];
const RISK_OPTIONS = ['critical', 'high', 'medium', 'low'];
const DEPT_OPTIONS = ['DEPT-INFOSEC', 'DEPT-IT', 'DEPT-COMPLIANCE', 'DEPT-LEGAL'];

export const MapsManagementPage = () => {
  const [items, setItems] = useState<MapListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMapId, setViewMapId] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showFilters] = useState(true);

  const [bulkAssignee, setBulkAssignee] = useState('emp_3');
  const [extendDays, setExtendDays] = useState(14);

  // Assign modal
  const [assignMapId, setAssignMapId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<{ emp_id: string; name: string }[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignToast, setAssignToast] = useState('');

  useEffect(() => {
    apiClient.get('/api/admin/users?role=employee')
      .then(r => setEmployees(r.data.map((u: any) => ({ emp_id: u.emp_id, name: u.name }))))
      .catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!assignMapId || !selectedEmpId) return;
    setAssigning(true);
    try {
      const emp = employees.find(e => e.emp_id === selectedEmpId);
      await apiClient.patch(`/api/maps/${assignMapId}/assign`, {
        emp_id: selectedEmpId,
        emp_name: emp?.name ?? selectedEmpId,
      });
      setAssignToast('✅ MAP assigned!');
      setTimeout(() => setAssignToast(''), 3000);
      setAssignMapId(null);
      fetchMaps();
    } catch {
      setAssignToast('❌ Assignment failed');
      setTimeout(() => setAssignToast(''), 3000);
    } finally {
      setAssigning(false);
    }
  };

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (status) params.status = status;
      if (department) params.department = department;
      if (riskLevel) params.risk_level = riskLevel;
      if (overdueOnly) params.overdue = true;
      const res = await mapsApi.list(params);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, department, riskLevel, overdueOnly]);

  useEffect(() => { fetchMaps(); }, [fetchMaps]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportData = async (format: 'json' | 'csv') => {
    const res = await mapsApi.export(format);
    const blob = new Blob(
      [format === 'csv' ? res.data : JSON.stringify(res.data, null, 2)],
      { type: format === 'csv' ? 'text/csv' : 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maps-export.${format}`;
    a.click();
  };

  const bulkReassign = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await mapsApi.bulkReassign(ids, bulkAssignee, department || undefined);
    setSelected(new Set());
    fetchMaps();
  };

  const bulkExtend = async () => {
    for (const mapId of selected) {
      const item = items.find((i) => i.map_id === mapId);
      if (!item) continue;
      const d = new Date(item.deadline);
      d.setDate(d.getDate() + extendDays);
      await mapsApi.extend(mapId, {
        new_deadline: d.toISOString(),
        reason: 'Bulk deadline extension',
        approver_id: 'emp_1',
        approver_name: 'Compliance Officer',
      });
    }
    setSelected(new Set());
    fetchMaps();
  };

  const bulkEscalate = async () => {
    for (const mapId of selected) {
      await mapsApi.escalate(mapId, {
        reason: 'Force escalated from MAP management',
        officer_id: 'emp_1',
        officer_name: 'Compliance Officer',
      });
    }
    setSelected(new Set());
    fetchMaps();
  };

  const statusColor = (s: string) => {
    if (s === 'complete' || s === 'approved') return 'text-canara-success bg-canara-success/10';
    if (s === 'rejected') return 'text-canara-danger bg-red-50';
    if (s === 'escalated') return 'text-orange-700 bg-orange-50';
    if (s === 'in_progress' || s === 'open') return 'text-canara-primary bg-canara-primary/10';
    return 'text-slate-600 bg-slate-100';
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">MAP Management</h1>
            <p className="text-slate-600 mt-1">{total} measurable action points</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/triage" className="px-4 py-2 bg-white border rounded-lg text-sm font-medium text-slate-700">
              Triage Center
            </Link>
            <button type="button" onClick={() => exportData('csv')} className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg text-sm">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button type="button" onClick={() => exportData('json')} className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg text-sm">
              <Download className="w-4 h-4" /> JSON
            </button>
            <button type="button" onClick={fetchMaps} className="flex items-center gap-1 px-4 py-2 bg-canara-primary text-white rounded-lg text-sm font-medium">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {showFilters && (
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 h-fit space-y-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Filter className="w-4 h-4" /> Filters
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                <select className="mt-1 w-full border rounded-lg px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                <select className="mt-1 w-full border rounded-lg px-2 py-2 text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">All</option>
                  {DEPT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Risk Level</label>
                <select className="mt-1 w-full border rounded-lg px-2 py-2 text-sm" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                  <option value="">All</option>
                  {RISK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
                Overdue only
              </label>
            </div>
          )}

          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {selected.size > 0 && (
              <div className="mb-4 p-4 bg-white rounded-xl border flex flex-wrap gap-3 items-end">
                <span className="text-sm font-semibold text-slate-700">{selected.size} selected</span>
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-slate-400" />
                  <input
                    className="border rounded px-2 py-1 text-sm w-24"
                    value={bulkAssignee}
                    onChange={(e) => setBulkAssignee(e.target.value)}
                    placeholder="Assignee"
                  />
                  <button type="button" onClick={bulkReassign} className="text-xs bg-canara-primary text-white px-3 py-1.5 rounded-lg font-semibold">
                    Reassign
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    className="border rounded px-2 py-1 text-sm w-16"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                  />
                  <span className="text-xs text-slate-500">days</span>
                  <button type="button" onClick={bulkExtend} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-semibold">
                    Extend Deadline
                  </button>
                </div>
                <button type="button" onClick={bulkEscalate} className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Force Escalate
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-canara-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="p-3 w-8" />
                        <th className="p-3">MAP ID</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Assignee</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Deadline</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => (
                        <tr key={row.map_id} className={`border-b hover:bg-slate-50 ${row.is_overdue ? 'bg-red-50/30' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selected.has(row.map_id)}
                              onChange={() => toggleSelect(row.map_id)}
                            />
                          </td>
                          <td className="p-3 font-mono text-xs">{row.map_id}</td>
                          <td className="p-3 max-w-[200px]">
                            <span className="line-clamp-1 font-medium text-slate-900">{row.title}</span>
                            <span className="text-[10px] text-slate-400">{row.evidence_completion_pct}% evidence</span>
                          </td>
                          <td className="p-3 text-xs">{row.department_name || row.owner_department_id}</td>
                          <td className="p-3 text-xs">{row.assignee_name || row.assigned_to || '—'}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs">
                            <span className={row.is_overdue ? 'text-canara-danger font-semibold flex items-center gap-1' : ''}>
                              {row.is_overdue && <AlertTriangle className="w-3 h-3" />}
                              {new Date(row.deadline).toLocaleDateString()}
                              <span className="text-slate-400 block">{row.days_until_deadline}d</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs">{row.priority_score}</td>
                          <td className="p-3">
                             <div className="flex items-center gap-1">
                               <button
                                 type="button"
                                 onClick={() => setViewMapId(row.map_id)}
                                 className="text-canara-primary hover:underline flex items-center gap-0.5 text-xs font-semibold"
                               >
                                 View <ChevronRight className="w-3 h-3" />
                               </button>
                               <button
                                 type="button"
                                 onClick={() => { setAssignMapId(row.map_id); setSelectedEmpId(''); }}
                                 className="text-emerald-600 hover:underline flex items-center gap-0.5 text-xs font-semibold ml-2"
                               >
                                 <UserCheck className="w-3 h-3" /> Assign
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!items.length && (
                    <p className="text-center py-16 text-slate-400">No MAPs found. Run seed_maps.py or generate from gaps.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewMapId && <MapDetailModal mapId={viewMapId} onClose={() => setViewMapId(null)} />}

      {/* Assign Modal */}
      <AnimatePresence>
        {assignMapId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setAssignMapId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Assign MAP</h3>
                <button onClick={() => setAssignMapId(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <p className="text-xs text-slate-500 font-mono">{assignMapId}</p>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-canara-blue/40"
                >
                  <option value="">— Choose employee —</option>
                  {employees.map(e => (
                    <option key={e.emp_id} value={e.emp_id}>{e.name || e.emp_id} ({e.emp_id})</option>
                  ))}
                  {employees.length === 0 && (
                    <option disabled>No employees found — set role to "employee" in User Management</option>
                  )}
                </select>
              </div>
              {assignToast && <p className="text-sm font-semibold text-center">{assignToast}</p>}
              <button
                onClick={handleAssign}
                disabled={!selectedEmpId || assigning}
                className="w-full py-2.5 bg-canara-blue text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : <><UserCheck className="w-4 h-4" /> Confirm Assignment</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
