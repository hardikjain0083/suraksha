import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, AlertTriangle, Upload, FileCheck,
  ChevronDown, ChevronUp, Loader2, XCircle, RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EvidenceItem {
  evidence_type: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  file_url?: string;
}

interface MapTask {
  map_id: string;
  title: string;
  status: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  deadline: string;
  days_until_deadline: number;
  is_overdue: boolean;
  evidence_completion_pct: number;
  department_name?: string;
  owner_department_id: string;
  description?: string;
  evidence_items?: EvidenceItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const riskColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-amber-100 text-amber-700 border-amber-200',
  low:      'bg-green-100 text-green-700 border-green-200',
};

const statusColor: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  complete:    'bg-emerald-100 text-emerald-700',
  escalated:   'bg-red-100 text-red-700',
  approved:    'bg-indigo-100 text-indigo-700',
};

function DeadlinePill({ days, overdue }: { days: number; overdue: boolean }) {
  if (overdue) return (
    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertTriangle className="w-3 h-3" /> OVERDUE {Math.abs(days)}d
    </span>
  );
  if (days <= 3) return (
    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
}

// ─── Evidence Upload Panel ────────────────────────────────────────────────────
function EvidencePanel({ task, onRefresh }: { task: MapTask; onRefresh: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<EvidenceItem[]>(task.evidence_items ?? []);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState('');
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reload evidence when task changes
  useEffect(() => {
    apiClient.get(`/api/maps/${task.map_id}`)
      .then(r => setItems(r.data.evidence_items ?? []))
      .catch(() => {});
  }, [task.map_id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpload = async (idx: number, file: File) => {
    setUploading(prev => ({ ...prev, [idx]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      await apiClient.post(`/api/maps/${task.map_id}/evidence/${idx}`, form);
      // optimistic update
      setItems(prev => prev.map((e, i) => i === idx ? { ...e, uploaded: true } : e));
      showToast('✅ Proof uploaded successfully!');
      onRefresh();
    } catch {
      showToast('❌ Upload failed. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await apiClient.patch(`/api/maps/${task.map_id}/complete`, { emp_id: user?.empId });
      showToast('🎉 Task marked as complete!');
      onRefresh();
    } catch {
      showToast('❌ Could not mark complete. Upload all required proofs first.');
    } finally {
      setCompleting(false);
    }
  };

  const allRequired = items.filter(e => e.required);
  const allUploaded = allRequired.every(e => e.uploaded);

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm font-medium text-center py-2 rounded-lg bg-slate-800 text-white"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && (
        <p className="text-sm text-slate-400 italic">No evidence items required for this task.</p>
      )}

      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            {item.uploaded
              ? <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              : <Upload className="w-4 h-4 text-slate-400 shrink-0" />
            }
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{item.label}</p>
              {item.uploaded && item.file_url && (
                <a href={item.file_url} target="_blank" rel="noreferrer"
                   className="text-xs text-canara-blue hover:underline">
                  View uploaded proof
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.required && (
              <span className="text-xs text-red-500 font-semibold">Required</span>
            )}
            {item.uploaded ? (
              <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                Uploaded ✓
              </span>
            ) : (
              <>
                <input
                  type="file"
                  ref={el => { fileRefs.current[idx] = el; }}
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(idx, f);
                  }}
                />
                <button
                  onClick={() => fileRefs.current[idx]?.click()}
                  disabled={uploading[idx]}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-canara-blue text-white rounded-lg hover:bg-canara-blue/90 disabled:opacity-50 transition-colors"
                >
                  {uploading[idx] ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-3 h-3" /> Upload</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Mark complete */}
      {task.status !== 'complete' && (
        <button
          onClick={handleComplete}
          disabled={completing || (!allUploaded && allRequired.length > 0)}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            allUploaded || allRequired.length === 0
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {completing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> Mark Task as Complete</>
          )}
        </button>
      )}
      {!allUploaded && allRequired.length > 0 && task.status !== 'complete' && (
        <p className="text-xs text-center text-slate-400">
          Upload all required proofs to enable completion.
        </p>
      )}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onRefresh }: { task: MapTask; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const pct = task.evidence_completion_pct;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-sm border-2 transition-colors ${
        task.is_overdue ? 'border-red-200' : task.status === 'complete' ? 'border-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-slate-800 text-base leading-tight line-clamp-2">
            {task.title}
          </h3>
          <DeadlinePill days={task.days_until_deadline} overdue={task.is_overdue} />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${riskColor[task.risk_level]}`}>
            {task.risk_level.charAt(0).toUpperCase() + task.risk_level.slice(1)} Risk
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[task.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {task.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          {task.department_name && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
              {task.department_name}
            </span>
          )}
        </div>

        {/* Evidence progress */}
        {(task.evidence_items?.length ?? 0) > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Evidence uploaded</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Expand toggle */}
        {task.status !== 'complete' && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-canara-blue hover:bg-blue-50 rounded-lg transition-colors"
          >
            {expanded ? <><ChevronUp className="w-4 h-4" /> Hide Details</> : <><ChevronDown className="w-4 h-4" /> Upload Proof & Complete</>}
          </button>
        )}

        {task.status === 'complete' && (
          <div className="flex items-center gap-2 justify-center py-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle className="w-4 h-4" /> Completed
          </div>
        )}
      </div>

      {/* Evidence panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <EvidencePanel task={task} onRefresh={onRefresh} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function EmployeeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'complete'>('all');

  const fetchTasks = async () => {
    if (!user?.empId) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/api/maps?assignee=${user.empId}&page_size=100`);
      // For each task fetch evidence detail
      const items: MapTask[] = await Promise.all(
        (res.data.items as MapTask[]).map(async (t) => {
          try {
            const detail = await apiClient.get(`/api/maps/${t.map_id}`);
            return { ...t, evidence_items: detail.data.evidence_items ?? [] };
          } catch {
            return t;
          }
        })
      );
      setTasks(items);
    } catch {
      setError('Could not load your tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [user?.empId]);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.is_overdue).length,
    complete: tasks.filter(t => t.status === 'complete').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-6">

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              👋 My Compliance Tasks
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name ?? user?.empId}</span>
              {user?.department && ` · ${user.department}`}
            </p>
          </div>
          <button
            onClick={fetchTasks}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'from-blue-500 to-canara-blue', icon: '📋' },
          { label: 'Overdue', value: stats.overdue, color: 'from-red-500 to-rose-600', icon: '⏰' },
          { label: 'In Progress', value: stats.inProgress, color: 'from-purple-500 to-purple-700', icon: '🔄' },
          { label: 'Completed', value: stats.complete, color: 'from-emerald-500 to-green-600', icon: '✅' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 shadow-sm`}>
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="max-w-5xl mx-auto mb-6 flex gap-2">
        {(['all', 'open', 'in_progress', 'complete'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-canara-blue text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading your tasks...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-600 font-medium">{error}</p>
            <button onClick={fetchTasks} className="px-4 py-2 bg-canara-blue text-white rounded-lg text-sm hover:bg-canara-blue/90">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24 text-slate-400">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-medium text-slate-600">
              {filter === 'all' ? 'No tasks assigned to you yet.' : `No ${filter.replace('_', ' ')} tasks.`}
            </p>
            <p className="text-sm mt-1">Check back later or contact your Compliance Officer.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {!loading && filtered.map(task => (
            <TaskCard key={task.map_id} task={task} onRefresh={fetchTasks} />
          ))}
        </div>
      </div>
    </div>
  );
}
