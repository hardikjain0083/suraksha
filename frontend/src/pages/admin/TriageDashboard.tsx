import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Loader2, CheckSquare, Square, ChevronDown, ChevronUp,
  History, Sparkles, Eye, ExternalLink, Shield, Terminal
} from 'lucide-react';
import { mapsApi } from '../../lib/api';
import type { TriageMapCard, TriageAction } from '../../types/map';
import { TriageReviewModal } from '../../components/maps/TriageReviewModal';
import { MapDetailModal } from '../../components/maps/MapDetailModal';
import { ProvenanceTimeline } from '../../components/maps/ProvenanceTimeline';
import { GlassCard } from '@/components/ui/glass-card';

type ProcessedFilter = 'all' | 'approved' | 'rejected' | 'escalated';

const AutoRoutedCard = ({
  card,
  selected,
  onToggle,
  expanded,
  onExpand,
  onViewMap,
}: {
  card: TriageMapCard;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
  onViewMap: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-obsidian-950/60 rounded-xl border border-cyber-green/20 shadow-sm p-4 mb-3"
  >
    <div className="flex items-start gap-3">
      <button type="button" onClick={onToggle} className="mt-1 text-cyber-green">
        {selected ? <CheckSquare className="w-4 h-4 shadow-glow-green" /> : <Square className="w-4 h-4 text-slate-600" />}
      </button>
      <motion.div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-200 text-sm line-clamp-1 font-sans">{card.title}</p>
        <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono">
          <span className="bg-cyber-green/10 text-cyber-green border border-cyber-green/20 px-2 py-0.5 rounded-full font-bold">
            {card.historical_match_count} historical matches
          </span>
          <span className="bg-cyber-blue/10 text-cyber-cyan border border-cyber-blue/20 px-2 py-0.5 rounded-full">
            {(card.confidence_score * 100).toFixed(0)}% confidence
          </span>
          <span className="text-slate-500 font-bold px-1.5 py-0.5 bg-slate-800/40 rounded border border-slate-700/20">P{card.priority_score}</span>
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="flex items-center gap-1 text-[10px] text-cyber-cyan mt-3 font-mono font-bold hover:underline"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'COLLAPSE SCHEMATIC' : 'EXPAND PROVENANCE FLOW'}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 space-y-3 border-t border-cyber-cyan/10 pt-3"
            >
              <ProvenanceTimeline nodes={card.provenance_path} />
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{card.description}</p>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-500 mb-1 font-mono tracking-wider">// Similar Precedent Maps</p>
                {card.similar_past_maps?.length ? (
                  <ul className="space-y-1">
                    {card.similar_past_maps.slice(0, 3).map((m) => (
                      <li key={m.map_id}>
                        <button
                          type="button"
                          onClick={onViewMap}
                          className="text-xs text-cyber-blue hover:underline flex items-center gap-1 font-mono"
                        >
                          {m.map_id} — {m.title}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-600 italic font-mono">No similar precedent MAPs indexed yet</p>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Evidence: {card.suggested_evidence.join(', ')} · Deadline:{' '}
                {new Date(card.deadline).toLocaleDateString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  </motion.div>
);

export const TriageDashboard = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [autoRouted, setAutoRouted] = useState<TriageMapCard[]>([]);
  const [pendingReview, setPendingReview] = useState<TriageMapCard[]>([]);
  const [recentlyProcessed, setRecentlyProcessed] = useState<TriageAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reviewCard, setReviewCard] = useState<TriageMapCard | null>(null);
  const [viewMapId, setViewMapId] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [judgeMode, setJudgeMode] = useState(false);
  const [processedFilter, setProcessedFilter] = useState<ProcessedFilter>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mapsApi.triageDashboard();
      setStats(res.data.stats || {});
      setAutoRouted(res.data.auto_routed || []);
      setPendingReview(res.data.pending_review || []);
      setRecentlyProcessed(res.data.recently_processed || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkApprove = async () => {
    const mapIds = autoRouted
      .filter((c) => selected.has(c.gap_id) && c.map_id)
      .map((c) => c.map_id as string);
    if (!mapIds.length) {
      alert('Select cards with MAP IDs');
      return;
    }
    await mapsApi.bulkApprove(mapIds);
    setConfirmBulk(false);
    setSelected(new Set());
    fetchData();
  };

  const filteredProcessed = recentlyProcessed.filter((a) => {
    if (processedFilter === 'all') return true;
    return a.decision.includes(processedFilter);
  });

  const ticker = [
    { label: 'Auto-Routed', value: stats.auto_routed ?? autoRouted.length, color: 'text-cyber-green' },
    { label: 'Pending Review', value: stats.pending_review ?? pendingReview.length, color: 'text-cyber-magenta' },
    { label: 'Total MAPs', value: stats.total_maps ?? 0, color: 'text-cyber-cyan' },
    { label: 'Avg Confidence', value: `${((stats.avg_confidence ?? 0) * 100).toFixed(0)}%`, color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title bar */}
      <div className="flex flex-wrap justify-between items-end gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            COMPLIANCE TRIAGE OPERATING BOARD
          </h1>
          <div className="flex flex-wrap gap-4 mt-2">
            {ticker.map((t) => (
              <span key={t.label} className={`text-[10px] font-bold font-mono tracking-widest uppercase ${t.color}`}>
                {t.label}: <span className="font-bold text-slate-100">{t.value}</span>
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setJudgeMode(!judgeMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              judgeMode
                ? 'bg-cyber-cyan text-obsidian-950 border-cyber-cyan shadow-glow-cyan'
                : 'bg-obsidian-900 border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Judge Walkthrough
          </button>
          <Link
            to="/admin/maps"
            className="px-3 py-1.5 bg-obsidian-900 border border-cyber-cyan/30 rounded-lg text-xs font-mono font-bold text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
          >
            MAP Management
          </Link>
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 bg-obsidian-900 border border-cyber-cyan/30 rounded-lg text-xs font-mono font-bold text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {judgeMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl text-xs font-mono text-slate-300 leading-relaxed shadow-glow-blue/10"
        >
          <strong>Judge Walkthrough instructions:</strong> Auto-routed MAPs (green) use historical precedent — bulk approve when
          confidence ≥ 80%. Pending review (magenta) requires clause-vs-MAP comparison and department assignment.
          Provenance flows Circular → Clause → Gap → Policy → Department.
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 font-mono text-cyber-cyan gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="animate-pulse tracking-widest text-[10px]">VERIFYING TRIAGE PARAMS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Auto-Routed Column */}
          <GlassCard className="border-cyber-green/20 bg-cyber-green/5/10 p-5 h-[750px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-cyber-green/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
                <h2 className="font-bold text-xs text-slate-200 font-mono">AUTO-ROUTED PRECEDENTS</h2>
                <span className="text-[9px] bg-cyber-green/20 text-cyber-green border border-cyber-green/30 px-2 py-0.5 rounded-full font-bold">
                  {autoRouted.length}
                </span>
              </div>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmBulk(true)}
                  className="text-[9px] font-mono font-bold text-obsidian-950 bg-cyber-green px-2.5 py-1 rounded shadow-glow-green hover:scale-102 transition-transform"
                >
                  Approve All Selected ({selected.size})
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {autoRouted.map((card) => (
                <AutoRoutedCard
                  key={card.gap_id}
                  card={card}
                  selected={selected.has(card.gap_id)}
                  onToggle={() => toggleSelect(card.gap_id)}
                  expanded={expanded.has(card.gap_id)}
                  onExpand={() => toggleExpand(card.gap_id)}
                  onViewMap={() => card.map_id && setViewMapId(card.map_id)}
                />
              ))}
              {!autoRouted.length && (
                <div className="text-center py-20 text-slate-500 font-mono text-xs italic">
                  NO AUTO-ROUTED ENTRIES LOADED.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Pending Review Column */}
          <GlassCard className="border-cyber-magenta/20 bg-cyber-magenta/5/10 p-5 h-[750px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-cyber-magenta/10 pb-3 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-cyber-magenta animate-pulse" />
              <h2 className="font-bold text-xs text-slate-200 font-mono">PENDING HUMAN REVIEW</h2>
              <span className="text-[9px] bg-cyber-magenta/25 text-cyber-magenta border border-cyber-magenta/30 px-2 py-0.5 rounded-full font-bold">
                {pendingReview.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {pendingReview.map((card) => (
                <div
                  key={card.gap_id}
                  className="bg-obsidian-950/60 rounded-xl border border-cyber-magenta/20 p-4 shadow-sm"
                >
                  <p className="font-semibold text-sm text-slate-200 line-clamp-1 font-sans">{card.title}</p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 font-sans leading-relaxed">{card.clause_text}</p>
                  <div className="flex gap-3 mt-3 text-[10px] font-mono">
                    <span className="text-cyber-magenta font-bold">
                      {(card.confidence_score * 100).toFixed(0)}% AI confidence
                    </span>
                    <span className="text-slate-500">{card.similar_policies_count || 0} policies linked</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewCard(card)}
                    className="mt-4 w-full py-2 bg-cyber-magenta hover:bg-cyber-magenta/90 text-obsidian-950 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-glow-magenta"
                  >
                    <Eye className="w-3.5 h-3.5" /> RUN ANALYSIS PANEL
                  </button>
                </div>
              ))}
              {!pendingReview.length && (
                <div className="text-center py-20 text-slate-500 font-mono text-xs italic">
                  NO PENDING AUDIT CHECKS IN QUEUE.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Recently Processed Column */}
          <GlassCard className="border-cyber-cyan/20 bg-cyber-cyan/5/10 p-5 h-[750px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-cyber-cyan/10 pb-3 shrink-0">
              <History className="w-4 h-4 text-cyber-cyan" />
              <h2 className="font-bold text-xs text-slate-200 font-mono">COMPLETED AUDIT BLOCKS</h2>
            </div>
            
            <div className="flex gap-1 mb-4 flex-wrap shrink-0">
              {(['all', 'approved', 'rejected', 'escalated'] as ProcessedFilter[]).map((f) => (
                <button
                  key={f}
                  type="button; cursor-pointer"
                  onClick={() => setProcessedFilter(f)}
                  className={`text-[9px] px-2 py-1 font-mono rounded capitalize border transition-all ${
                    processedFilter === f 
                      ? 'bg-cyber-cyan text-obsidian-950 font-bold border-cyber-cyan shadow-glow-cyan' 
                      : 'bg-obsidian-950 border-cyber-cyan/15 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
              {filteredProcessed.map((a) => (
                <div
                  key={a.action_id}
                  className="bg-obsidian-950/60 rounded-xl border border-cyber-cyan/10 p-3 text-xs font-mono"
                >
                  <div className="flex justify-between">
                    <span className={`font-bold capitalize ${
                      a.decision.includes('approve') 
                        ? 'text-cyber-green' 
                        : a.decision.includes('reject') 
                          ? 'text-red-400' 
                          : 'text-cyber-magenta'
                    }`}>{a.decision}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 font-bold">Officer: {a.officer_name}</p>
                  {a.title && <p className="text-slate-400 mt-1 line-clamp-1 font-sans text-[11px]">{a.title}</p>}
                  {a.map_id && (
                    <button
                      type="button"
                      onClick={() => setViewMapId(a.map_id!)}
                      className="text-cyber-blue font-bold mt-2 hover:underline text-[10px] flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3" /> {a.map_id}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Confirmation and detail modals */}
      <AnimatePresence>
        {confirmBulk && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-obsidian-950 border border-cyber-green/30 rounded-xl p-6 max-w-md shadow-2xl font-mono text-xs text-slate-300">
              <h3 className="font-bold text-sm text-cyber-green mb-2 uppercase">// CONFIRM BULK ACTION</h3>
              <p className="text-slate-400 leading-relaxed mb-5">
                Bulk approve {selected.size} auto-routed MAP(s)? This will trigger automated secure matching workflows and dispatch email notices to respective departments.
              </p>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setConfirmBulk(false)} className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded text-[11px] font-bold">
                  CANCEL
                </button>
                <button type="button" onClick={bulkApprove} className="px-4 py-2 bg-cyber-green text-obsidian-950 font-bold rounded shadow-glow-green text-[11px]">
                  EXECUTE APPROVAL
                </button>
              </div>
            </div>
          </div>
        )}
        
        {reviewCard && (
          <TriageReviewModal
            card={reviewCard}
            onClose={() => setReviewCard(null)}
            onComplete={fetchData}
          />
        )}
        
        {viewMapId && (
          <MapDetailModal mapId={viewMapId} onClose={() => setViewMapId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
