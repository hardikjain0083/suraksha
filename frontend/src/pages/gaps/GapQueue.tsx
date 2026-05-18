import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, XCircle,
  RefreshCw, ThumbsUp, ThumbsDown, ArrowUpRight, Loader2, MessageSquare,
  Eye
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { GapDetailModal } from '../../components/gaps/GapDetailModal';

const TRIAGE_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  new:       { color: 'text-slate-600',       bg: 'bg-slate-100',           border: 'border-slate-200',        label: 'New' },
  assigned:  { color: 'text-canara-primary',  bg: 'bg-canara-primary/10',   border: 'border-canara-primary/20',label: 'Assigned' },
  escalated: { color: 'text-amber-700',       bg: 'bg-amber-50',            border: 'border-amber-200',        label: 'Escalated' },
  resolved:  { color: 'text-canara-success',  bg: 'bg-canara-success/10',   border: 'border-canara-success/20',label: 'Resolved' },
  dismissed: { color: 'text-slate-400',       bg: 'bg-slate-50',            border: 'border-slate-200',        label: 'Dismissed' },
};

const GapStatusIcon = ({ status }: { status: string }) => {
  if (status === 'confirmed') return <XCircle className="w-4 h-4 text-canara-danger" />;
  if (status === 'suspected') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <CheckCircle className="w-4 h-4 text-canara-success" />;
};

const QueueCard = ({ item, onApprove, onDismiss, onEscalate, onViewDetails }: any) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const triageCfg = TRIAGE_STATUS_CONFIG[item.triage_status] || TRIAGE_STATUS_CONFIG.new;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`bg-white rounded-xl border ${triageCfg.border} shadow-sm p-4 mb-3`}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <GapStatusIcon status={item.gap_status} />
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${triageCfg.bg} ${triageCfg.color}`}>
            {triageCfg.label}
          </span>
          {item.severity && (
            <span className={`text-[10px] font-bold uppercase ${item.severity === 'critical' ? 'text-canara-danger' : 'text-amber-600'}`}>
              {item.severity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {item.similarity_score != null && (
            <span className="text-xs font-mono text-slate-500">{item.similarity_score.toFixed(2)}</span>
          )}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.similarity_score >= 0.85 ? 'bg-canara-success' : item.similarity_score >= 0.70 ? 'bg-amber-500' : 'bg-canara-danger'}`}
              style={{ width: `${(item.similarity_score || 0) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clause text */}
      <p className="text-sm text-slate-700 mb-1 line-clamp-2 leading-relaxed">{item.clause_text}</p>
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
        <span className="font-mono">{item.circular_id}</span>
        {item.clause_number && <><span>·</span><span>{item.clause_number}</span></>}
        {item.top_policy_title && <><span>·</span><span className="truncate max-w-[120px]">{item.top_policy_title}</span></>}
      </div>

      {/* Classification reasoning */}
      <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-500 mb-3 font-mono border border-slate-100">
        {item.classification_reason}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button 
          onClick={() => onViewDetails(item)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Eye className="w-3 h-3" /> View Details
        </button>
      </div>

      {item.triage_status === 'new' && (
        <div className="flex gap-2">
          <button onClick={() => onApprove(item.gap_id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-canara-success/10 text-canara-success text-xs font-semibold rounded-lg hover:bg-canara-success/20 transition-colors">
            <ThumbsUp className="w-3 h-3" /> Approve
          </button>
          <button onClick={() => onEscalate(item.gap_id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors">
            <ArrowUpRight className="w-3 h-3" /> Escalate
          </button>
          <button onClick={() => setFeedbackOpen(!feedbackOpen)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
            <ThumbsDown className="w-3 h-3" /> Dismiss
          </button>
        </div>
      )}

      {/* Dismiss feedback */}
      <AnimatePresence>
        {feedbackOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden mt-2">
            <div className="border-t border-slate-100 pt-2">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 text-slate-400 mt-1 shrink-0" />
                <div className="flex-1">
                  <textarea
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-canara-primary/30"
                    placeholder="Why was this wrong? (model learning)"
                  />
                  <button onClick={() => { onDismiss(item.gap_id); setFeedbackOpen(false); }} className="mt-1 px-3 py-1 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-800">
                    Confirm Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const GapQueue = () => {
  const [queue, setQueue] = useState<{ auto_routed: any[]; pending_review: any[] }>({ auto_routed: [], pending_review: [] });
  const [loading, setLoading] = useState(true);
  const [selectedGap, setSelectedGap] = useState<any>(null);

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/gaps/queue');
      setQueue({ auto_routed: res.data.auto_routed, pending_review: res.data.pending_review });
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (gap_id: string) => {
    await apiClient.post(`/api/gaps/queue/${gap_id}/approve`);
    fetchQueue();
  };

  const handleDismiss = async (gap_id: string) => {
    await apiClient.post(`/api/gaps/queue/${gap_id}/dismiss`);
    fetchQueue();
  };

  const handleEscalate = async (gap_id: string) => {
    await apiClient.post(`/api/gaps/queue/${gap_id}/escalate`);
    fetchQueue();
  };

  const totalPending = queue.pending_review.filter(i => i.triage_status === 'new').length;
  const totalAuto = queue.auto_routed.length;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gap Verification Queue</h1>
            <p className="text-slate-600">Human triage center for AI-detected compliance gaps.</p>
          </div>
          <button onClick={fetchQueue} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm font-medium">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-canara-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Auto-Routed Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-canara-success" />
                <h2 className="font-semibold text-slate-800">Auto-Routed</h2>
                <span className="bg-canara-success/10 text-canara-success text-xs font-bold px-2 py-0.5 rounded-full">{totalAuto}</span>
                <span className="text-xs text-slate-400 ml-1">— Minimal human review</span>
              </div>
              <div className="max-h-[700px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {queue.auto_routed.map(item => (
                    <QueueCard 
                      key={item.gap_id} 
                      item={item} 
                      onApprove={handleApprove} 
                      onDismiss={handleDismiss} 
                      onEscalate={handleEscalate}
                      onViewDetails={setSelectedGap}
                    />
                  ))}
                </AnimatePresence>
                {queue.auto_routed.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <CheckCircle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No auto-routed gaps</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Review Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h2 className="font-semibold text-slate-800">Pending Review</h2>
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{totalPending}</span>
                <span className="text-xs text-slate-400 ml-1">— Requires human decision</span>
              </div>
              <div className="max-h-[700px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {queue.pending_review.map(item => (
                    <QueueCard 
                      key={item.gap_id} 
                      item={item} 
                      onApprove={handleApprove} 
                      onDismiss={handleDismiss} 
                      onEscalate={handleEscalate}
                      onViewDetails={setSelectedGap}
                    />
                  ))}
                </AnimatePresence>
                {queue.pending_review.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <AlertTriangle className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No items pending review</p>
                    <p className="text-xs mt-1">Run gap detection on a circular first</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gap Detail Modal */}
      <AnimatePresence>
        {selectedGap && (
          <GapDetailModal 
            gap={selectedGap} 
            onClose={() => setSelectedGap(null)} 
            onActionComplete={fetchQueue}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
