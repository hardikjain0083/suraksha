import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, XCircle,
  RefreshCw, ThumbsUp, ThumbsDown, ArrowUpRight, Loader2, MessageSquare,
  Eye, Terminal, Shield, Cpu
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { GapDetailModal } from '../../components/gaps/GapDetailModal';
import { GlassCard } from '@/components/ui/glass-card';

const TRIAGE_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  new:       { color: 'text-cyber-cyan font-bold',  bg: 'bg-cyber-cyan/10',    border: 'border-cyber-cyan/20',        label: 'New Alert' },
  assigned:  { color: 'text-cyber-blue font-bold',  bg: 'bg-cyber-blue/10',    border: 'border-cyber-blue/20',        label: 'Assigned' },
  escalated: { color: 'text-cyber-magenta font-bold', bg: 'bg-cyber-magenta/10', border: 'border-cyber-magenta/20',     label: 'Escalated' },
  resolved:  { color: 'text-cyber-green font-bold', bg: 'bg-cyber-green/10',   border: 'border-cyber-green/20',       label: 'Resolved' },
  dismissed: { color: 'text-slate-500 font-bold',   bg: 'bg-slate-800/30',     border: 'border-slate-800/30',         label: 'Dismissed' },
};

const GapStatusIcon = ({ status }: { status: string }) => {
  if (status === 'confirmed') return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === 'suspected') return <AlertTriangle className="w-4 h-4 text-cyber-magenta" />;
  return <CheckCircle className="w-4 h-4 text-cyber-green" />;
};

const QueueCard = ({ item, onApprove, onDismiss, onEscalate, onViewDetails }: any) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const triageCfg = TRIAGE_STATUS_CONFIG[item.triage_status] || TRIAGE_STATUS_CONFIG.new;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`mb-3`}
    >
      <GlassCard className={`p-4 border border-cyber-cyan/10 bg-obsidian-950/60 relative`}>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <GapStatusIcon status={item.gap_status} />
            <span className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border ${triageCfg.bg} ${triageCfg.color} ${triageCfg.border}`}>
              {triageCfg.label.toUpperCase()}
            </span>
            {item.severity && (
              <span className={`text-[9px] font-mono font-bold uppercase ${item.severity === 'critical' ? 'text-red-400' : 'text-cyber-magenta'}`}>
                {item.severity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {item.similarity_score != null && (
              <span className="text-[10px] font-mono font-bold text-slate-400">V_SIM: {item.similarity_score.toFixed(2)}</span>
            )}
            <div className="w-12 h-1 bg-obsidian-950 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full ${item.similarity_score >= 0.85 ? 'bg-cyber-green' : item.similarity_score >= 0.70 ? 'bg-cyber-blue' : 'bg-cyber-magenta'}`}
                style={{ width: `${(item.similarity_score || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clause text */}
        <p className="text-xs text-slate-200 mb-1.5 line-clamp-2 leading-relaxed font-sans">{item.clause_text}</p>
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-slate-500 mb-3">
          <span className="text-cyber-cyan">{item.circular_id}</span>
          {item.clause_number && <><span>·</span><span>SECTION {item.clause_number}</span></>}
          {item.top_policy_title && <><span>·</span><span className="truncate max-w-[120px] text-cyber-blue font-bold">{item.top_policy_title.toUpperCase()}</span></>}
        </div>

        {/* Classification reasoning */}
        <div className="bg-obsidian-950 border border-cyber-cyan/5 rounded-lg p-2.5 text-[10px] text-slate-400 mb-3 font-mono leading-relaxed">
          <span className="text-cyber-cyan/50 text-[9px] block uppercase font-bold mb-0.5">// CLASSIFICATION LOGIC</span>
          {item.classification_reason}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => onViewDetails(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-obsidian-900 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 text-[10px] font-mono font-bold rounded-lg transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> INVESTIGATE DETAILS
          </button>
        </div>

        {item.triage_status === 'new' && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-cyber-cyan/5">
            <button 
              onClick={() => onApprove(item.gap_id)} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-cyber-green/10 hover:bg-cyber-green/20 text-cyber-green border border-cyber-green/20 text-[10px] font-mono font-bold rounded-lg transition-all"
            >
              <ThumbsUp className="w-3 h-3" /> APPROVE
            </button>
            <button 
              onClick={() => onEscalate(item.gap_id)} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-cyber-magenta/10 hover:bg-cyber-magenta/20 text-cyber-magenta border border-cyber-magenta/20 text-[10px] font-mono font-bold rounded-lg transition-all"
            >
              <ArrowUpRight className="w-3 h-3" /> ESCALATE
            </button>
            <button 
              onClick={() => setFeedbackOpen(!feedbackOpen)} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold rounded-lg transition-all"
            >
              <ThumbsDown className="w-3 h-3" /> REJECT
            </button>
          </div>
        )}

        {/* Dismiss feedback */}
        <AnimatePresence>
          {feedbackOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden mt-2">
              <div className="border-t border-cyber-cyan/5 pt-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyber-cyan/60 mt-1 shrink-0" />
                  <div className="flex-1">
                    <textarea
                      value={dismissReason}
                      onChange={(e) => setDismissReason(e.target.value)}
                      className="w-full text-[10px] bg-obsidian-950 border border-cyber-cyan/20 focus:border-cyber-cyan text-slate-200 rounded-lg p-2 h-16 resize-none focus:outline-none focus:shadow-glow-cyan font-mono"
                      placeholder="Input dismissal rational (updates classification weights)..."
                    />
                    <button 
                      onClick={() => { onDismiss(item.gap_id); setFeedbackOpen(false); }} 
                      className="mt-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-obsidian-950 font-bold text-[10px] rounded-lg transition-colors font-mono"
                    >
                      CONFIRM DISMISSAL
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
};

export const GapQueue = () => {
  const [queue, setQueue] = useState<{ auto_routed: any[]; pending_review: any[] }>({ auto_routed: [], pending_review: [] });
  const [loading, setLoading] = useState(true);
  const [selectedGap, setSelectedGap] = useState<any>(null);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue();
  }, []);

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            HUMAN COGNITIVE TRIAGE CONSOLE
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Verification queue for manually tracing and approving AI-allocated circular discrepancies.</p>
        </div>
        <button 
          onClick={fetchQueue} 
          className="flex items-center gap-2 px-4 py-2 border border-cyber-cyan/30 hover:border-cyber-cyan/60 text-cyber-cyan bg-cyber-cyan/5 hover:bg-cyber-cyan/10 rounded-lg text-xs font-mono font-bold transition-all shadow-glow-cyan/10"
        >
          <RefreshCw className="w-4 h-4" /> COMPUTE CYCLE REFRESH
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 font-mono text-cyber-cyan gap-3">
          <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin" />
          <p className="animate-pulse tracking-widest text-[10px]">READING SECURE COMPLIANCE LEDGERS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auto-Routed Column */}
          <GlassCard className="p-5 border-cyber-green/20 bg-cyber-green/5/10 flex flex-col h-[750px]">
            <div className="flex items-center justify-between border-b border-cyber-green/10 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
                <h2 className="font-semibold font-mono text-xs text-slate-200">AUTO-ROUTED DIRECTIVE INDEX</h2>
                <span className="bg-cyber-green/20 text-cyber-green border border-cyber-green/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">{totalAuto}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">BYPASSING REVIEW</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
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
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono text-xs border border-dashed border-cyber-green/10 rounded-xl bg-obsidian-950/20">
                  <CheckCircle className="w-8 h-8 mb-2 text-cyber-green/30" />
                  <p>NO ACTIVE DIRECTIVES RECORDED</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Pending Review Column */}
          <GlassCard className="p-5 border-cyber-magenta/20 bg-cyber-magenta/5/10 flex flex-col h-[750px]">
            <div className="flex items-center justify-between border-b border-cyber-magenta/10 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyber-magenta animate-pulse" />
                <h2 className="font-semibold font-mono text-xs text-slate-200 font-mono">PENDING HUMAN REVIEW</h2>
                <span className="bg-cyber-magenta/25 text-cyber-magenta border border-cyber-magenta/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">{totalPending}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">ANALYST DECISION REQUIRED</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
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
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono text-xs border border-dashed border-cyber-magenta/10 rounded-xl bg-obsidian-950/20">
                  <AlertTriangle className="w-8 h-8 mb-2 text-cyber-magenta/30" />
                  <p>TRIAGE QUEUE IS CURRENTLY EMPTY</p>
                  <p className="text-[9px] text-slate-600 mt-1">Parse new circulars to verify policies</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

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
