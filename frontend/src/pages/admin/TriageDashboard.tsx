import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Loader2, CheckSquare, Square, ChevronDown, ChevronUp,
  History, Sparkles, Eye, ExternalLink,
} from 'lucide-react';
import { mapsApi } from '../../lib/api';
import type { TriageMapCard, TriageAction } from '../../types/map';
import { TriageReviewModal } from '../../components/maps/TriageReviewModal';
import { MapDetailModal } from '../../components/maps/MapDetailModal';
import { ProvenanceTimeline } from '../../components/maps/ProvenanceTimeline';

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
    className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4 mb-3"
  >
    <div className="flex items-start gap-3">
      <button type="button" onClick={onToggle} className="mt-1 text-emerald-600">
        {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
      </button>
      <motion.div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm line-clamp-1">{card.title}</p>
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
            {card.historical_match_count} historical matches
          </span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
            {(card.confidence_score * 100).toFixed(0)}% confidence
          </span>
          <span className="text-slate-400">P{card.priority_score}</span>
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="flex items-center gap-1 text-xs text-canara-primary mt-2 font-medium"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Collapse' : 'Expand details'}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 space-y-3 border-t border-slate-100 pt-3"
            >
              <ProvenanceTimeline nodes={card.provenance_path} />
              <p className="text-xs text-slate-600">{card.description}</p>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Similar past MAPs</p>
                {card.similar_past_maps?.length ? (
                  <ul className="space-y-1">
                    {card.similar_past_maps.slice(0, 3).map((m) => (
                      <li key={m.map_id}>
                        <button
                          type="button"
                          onClick={onViewMap}
                          className="text-xs text-canara-primary hover:underline flex items-center gap-1"
                        >
                          {m.map_id} — {m.title}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No similar MAPs indexed yet</p>
                )}
              </div>
              <p className="text-xs text-slate-500">
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
    { label: 'Auto-Routed', value: stats.auto_routed ?? autoRouted.length, color: 'text-emerald-600' },
    { label: 'Pending Review', value: stats.pending_review ?? pendingReview.length, color: 'text-amber-600' },
    { label: 'Total MAPs', value: stats.total_maps ?? 0, color: 'text-canara-primary' },
    { label: 'Avg Confidence', value: `${((stats.avg_confidence ?? 0) * 100).toFixed(0)}%`, color: 'text-slate-600' },
  ];

  return (
    <motion.div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6">
      <motion.div className="max-w-[1600px] mx-auto">
        <motion.div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <motion.div>
            <h1 className="text-3xl font-bold text-slate-900">Compliance Triage Center</h1>
            <motion.div className="flex flex-wrap gap-4 mt-3">
              {ticker.map((t) => (
                <motion.span key={t.label} className={`text-sm font-semibold ${t.color}`}>
                  {t.label}: <span className="font-mono">{t.value}</span>
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
          <motion.div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJudgeMode(!judgeMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
                judgeMode
                  ? 'bg-canara-primary text-white border-canara-primary'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Judge Walkthrough
            </button>
            <Link
              to="/admin/maps"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              MAP Management
            </Link>
            <button
              type="button"
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </motion.div>
        </motion.div>

        {judgeMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-canara-primary/5 border border-canara-primary/20 rounded-xl text-sm text-slate-700"
          >
            <strong>Judge Walkthrough:</strong> Auto-routed MAPs (green) use historical precedent — bulk approve when
            confidence ≥ 80%. Pending review (yellow) requires clause-vs-MAP comparison and department assignment.
            Provenance flows Circular → Clause → Gap → Policy → Department.
          </motion.div>
        )}

        {loading ? (
          <motion.div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-canara-primary" />
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Auto-Routed */}
            <motion.div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
              <motion.div className="flex items-center justify-between mb-4">
                <motion.div className="flex items-center gap-2">
                  <motion.div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h2 className="font-semibold text-slate-800">Auto-Routed</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {autoRouted.length}
                  </span>
                </motion.div>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmBulk(true)}
                    className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-200"
                  >
                    Approve All Selected ({selected.size})
                  </button>
                )}
              </motion.div>
              <motion.div className="max-h-[680px] overflow-y-auto pr-1">
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
                  <p className="text-sm text-slate-400 text-center py-12">No auto-routed items</p>
                )}
              </motion.div>
            </motion.div>

            {/* Pending Review */}
            <motion.div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
              <motion.div className="flex items-center gap-2 mb-4">
                <motion.div className="w-3 h-3 rounded-full bg-amber-500" />
                <h2 className="font-semibold text-slate-800">Pending Review</h2>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  {pendingReview.length}
                </span>
              </motion.div>
              <motion.div className="max-h-[680px] overflow-y-auto space-y-3">
                {pendingReview.map((card) => (
                  <motion.div
                    key={card.gap_id}
                    className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm"
                  >
                    <p className="font-semibold text-sm text-slate-900 line-clamp-1">{card.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.clause_text}</p>
                    <motion.div className="flex gap-2 mt-2 text-xs">
                      <span className="text-amber-700 font-medium">
                        {(card.confidence_score * 100).toFixed(0)}% AI confidence
                      </span>
                      <span className="text-slate-400">{card.similar_policies_count || 0} policies</span>
                    </motion.div>
                    <button
                      type="button"
                      onClick={() => setReviewCard(card)}
                      className="mt-3 w-full py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Review
                    </button>
                  </motion.div>
                ))}
                {!pendingReview.length && (
                  <p className="text-sm text-slate-400 text-center py-12">No items pending review</p>
                )}
              </motion.div>
            </motion.div>

            {/* Recently Processed */}
            <motion.div className="rounded-2xl border border-slate-200 bg-slate-100/50 p-4">
              <motion.div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-800">Recently Processed</h2>
              </motion.div>
              <motion.div className="flex gap-1 mb-3 flex-wrap">
                {(['all', 'approved', 'rejected', 'escalated'] as ProcessedFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setProcessedFilter(f)}
                    className={`text-[10px] px-2 py-1 rounded capitalize ${
                      processedFilter === f ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </motion.div>
              <motion.div className="max-h-[620px] overflow-y-auto space-y-2">
                {filteredProcessed.map((a) => (
                  <motion.div
                    key={a.action_id}
                    className="bg-white rounded-lg border border-slate-200 p-3 text-xs"
                  >
                    <motion.div className="flex justify-between">
                      <span className="font-semibold text-slate-800 capitalize">{a.decision}</span>
                      <span className="text-slate-400">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                    </motion.div>
                    <p className="text-slate-600 mt-1">{a.officer_name}</p>
                    {a.title && <p className="text-slate-500 mt-0.5 line-clamp-1">{a.title}</p>}
                    {a.map_id && (
                      <button
                        type="button"
                        onClick={() => setViewMapId(a.map_id!)}
                        className="text-canara-primary mt-1 hover:underline"
                      >
                        {a.map_id}
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {confirmBulk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div className="bg-white rounded-xl p-6 max-w-md shadow-xl">
              <h3 className="font-bold text-lg mb-2">Confirm Bulk Approval</h3>
              <p className="text-sm text-slate-600 mb-4">
                Approve {selected.size} auto-routed MAP(s)? This triggers the routing module for each.
              </p>
              <motion.div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setConfirmBulk(false)} className="px-4 py-2 border rounded-lg text-sm">
                  Cancel
                </button>
                <button type="button" onClick={bulkApprove} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">
                  Approve All
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
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
    </motion.div>
  );
};
