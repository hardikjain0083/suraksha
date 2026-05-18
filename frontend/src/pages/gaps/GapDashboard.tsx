import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckCircle, AlertTriangle, XCircle, Database,
  ChevronDown, Eye, Plus, 
  Clock, BarChart3, Radar, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { GapDetailModal } from '../../components/gaps/GapDetailModal';

const DETECTION_STAGES = [
  "Fetching circular clauses...",
  "Searching vector database...",
  "Comparing semantic similarity...",
  "Checking keyword compliance...",
  "Analyzing historical patterns...",
  "Classification complete!"
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  covered:    { color: 'text-canara-success', bg: 'bg-canara-success/10', icon: CheckCircle, label: 'Covered' },
  suspected:  { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle, label: 'Suspected Gap' },
  confirmed:  { color: 'text-canara-danger', bg: 'bg-canara-danger/10', icon: XCircle, label: 'Confirmed Gap' },
  data_error: { color: 'text-slate-500', bg: 'bg-slate-100', icon: Database, label: 'Data Error' },
  pending:    { color: 'text-slate-400', bg: 'bg-slate-50', icon: Clock, label: 'Pending' },
};

export const GapDashboard = () => {
  const navigate = useNavigate();
  const [circulars, setCirculars] = useState<any[]>([]);
  const [selectedCircular, setSelectedCircular] = useState<string>('');
  const [detecting, setDetecting] = useState(false);
  const [detectionStage, setDetectionStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchCirculars();
    return () => { if (stageInterval.current) clearInterval(stageInterval.current); };
  }, []);

  const fetchCirculars = async () => {
    try {
      const res = await apiClient.get('/api/gaps/circulars');
      setCirculars(res.data);
      if (res.data.length > 0) setSelectedCircular(res.data[0].circular_id);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const runDetection = async () => {
    if (!selectedCircular) return;
    setDetecting(true);
    setResult(null);
    setDetectionStage(0);

    // Animate through stages
    let stage = 0;
    stageInterval.current = setInterval(() => {
      stage++;
      if (stage >= DETECTION_STAGES.length - 1) {
        if (stageInterval.current) clearInterval(stageInterval.current);
      }
      setDetectionStage(stage);
    }, 700);

    try {
      const res = await apiClient.post(
        `/api/gaps/detect/${selectedCircular.split('/').map(encodeURIComponent).join('/')}`,
        null,
        { timeout: 120_000 }
      );
      if (stageInterval.current) clearInterval(stageInterval.current);
      setDetectionStage(DETECTION_STAGES.length - 1);
      await new Promise(r => setTimeout(r, 400));
      setResult(res.data);
    } catch (e: any) {
      if (stageInterval.current) clearInterval(stageInterval.current);
      alert(e?.response?.data?.detail || 'Detection failed');
    } finally {
      setDetecting(false);
    }
  };

  const filteredGaps = result?.gaps?.filter((g: any) =>
    filterStatus === 'all' || g.gap_status === filterStatus
  ) ?? [];

  const coveragePercent = result ? Math.round(result.coverage_rate * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-canara-primary/10 flex items-center justify-center">
                  <Radar className="w-6 h-6 text-canara-primary" />
                </div>
                {detecting && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-canara-primary"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">AI-Powered Gap Detection</h1>
            </div>
            <p className="text-slate-600">Semantic vector search + deterministic keyword taxonomy for explainable compliance gap analysis.</p>
          </div>
          <button
            onClick={() => navigate('/admin/gaps/queue')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            <BarChart3 className="w-4 h-4" /> View Triage Queue
          </button>
        </div>

        {/* ── Run Detection Panel ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Circular to Analyze</label>
              <div className="relative">
                <select
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-canara-primary/30"
                  value={selectedCircular}
                  onChange={(e) => setSelectedCircular(e.target.value)}
                  disabled={detecting}
                >
                  {circulars.length === 0 && <option value="">No parsed circulars available</option>}
                  {circulars.map(c => (
                    <option key={c.circular_id} value={c.circular_id}>
                      [{c.issuer}] {c.circular_id} — {c.clauses_extracted} clauses
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <motion.button
              onClick={runDetection}
              disabled={detecting || !selectedCircular}
              whileHover={!detecting ? { scale: 1.02 } : {}}
              whileTap={!detecting ? { scale: 0.98 } : {}}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-colors shadow-md ${
                detecting ? 'bg-canara-primary/60 cursor-not-allowed' : 'bg-canara-primary hover:bg-canara-primary/90'
              }`}
            >
              {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {detecting ? DETECTION_STAGES[detectionStage] : 'Run Gap Detection'}
            </motion.button>
          </div>

          {/* Detection Progress Bar */}
          <AnimatePresence>
            {detecting && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="font-mono text-canara-primary">{DETECTION_STAGES[detectionStage]}</span>
                  <span>{Math.round((detectionStage / (DETECTION_STAGES.length - 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-canara-primary rounded-full"
                    animate={{ width: `${(detectionStage / (DETECTION_STAGES.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {DETECTION_STAGES.slice(0, -1).map((_s, i) => (
                    <div key={i} className={`flex-1 h-0.5 rounded transition-colors ${i <= detectionStage ? 'bg-canara-primary' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Stats Row ───────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Clauses Analyzed', value: result.total_clauses_analyzed, color: 'text-slate-900', bg: 'bg-white' },
                { label: 'Coverage Rate', value: `${coveragePercent}%`, color: 'text-canara-success', bg: 'bg-canara-success/5' },
                { label: 'Confirmed Gaps', value: result.confirmed, color: 'text-canara-danger', bg: 'bg-canara-danger/5' },
                { label: 'Suspected Gaps', value: result.suspected, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Data Errors', value: result.data_errors, color: 'text-slate-500', bg: 'bg-slate-50' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className={`${stat.bg} rounded-xl p-4 border border-slate-200 shadow-sm`}>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Gap Results Table ───────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">
                  Gap Analysis Results
                  <span className="ml-2 text-sm text-slate-500 font-normal">({result.detection_time_ms}ms)</span>
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {['all', 'covered', 'suspected', 'confirmed', 'data_error'].map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${filterStatus === s ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => navigate('/admin/gaps/queue')} className="flex items-center gap-1.5 px-3 py-1.5 bg-canara-primary text-white text-xs font-semibold rounded-lg hover:bg-canara-primary/90">
                    <BarChart3 className="w-3 h-3" /> View Queue
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Clause', 'Obligation', 'Severity', 'Status', 'Similarity', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGaps.map((gap: any, i: number) => {
                      const cfg = STATUS_CONFIG[gap.gap_status] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      return (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${gap.gap_status === 'confirmed' ? 'bg-red-50/30' : gap.gap_status === 'suspected' ? 'bg-amber-50/30' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-slate-500 mb-0.5">{gap.clause_number || 'N/A'}</div>
                            <div className="text-slate-700 max-w-xs truncate" title={gap.clause_text}>{gap.clause_text}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${gap.obligation_type === 'shall' || gap.obligation_type === 'must' ? 'bg-canara-danger/10 text-canara-danger' : 'bg-slate-100 text-slate-600'}`}>
                              {gap.obligation_type || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${gap.severity === 'critical' ? 'text-canara-danger' : gap.severity === 'high' ? 'text-amber-600' : 'text-slate-500'}`}>
                              {gap.severity || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1.5 w-max px-2 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {gap.similarity_score != null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${gap.similarity_score >= 0.85 ? 'bg-canara-success' : gap.similarity_score >= 0.70 ? 'bg-amber-500' : 'bg-canara-danger'}`}
                                    style={{ width: `${gap.similarity_score * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-slate-600">{gap.similarity_score.toFixed(2)}</span>
                              </div>
                            ) : <span className="text-slate-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedGap(gap)}
                                className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Explain
                              </button>
                              {(gap.gap_status === 'confirmed' || gap.gap_status === 'suspected') && (
                                <button className="px-2.5 py-1.5 bg-canara-primary/10 text-canara-primary rounded-md text-xs font-medium hover:bg-canara-primary/20 transition-colors flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> MAP
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                    {filteredGaps.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                          {result ? 'No gaps match this filter.' : 'Run detection to see results.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!result && !detecting && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-canara-primary/5 flex items-center justify-center mb-6">
              <Radar className="w-12 h-12 text-canara-primary/40" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Analysis Yet</h3>
            <p className="text-slate-400 max-w-sm">Select a circular from the dropdown above and click "Run Gap Detection" to begin AI-powered compliance analysis.</p>
          </div>
        )}
      </div>

      {/* Gap Detail Modal */}
      <AnimatePresence>
        {selectedGap && (
          <GapDetailModal gap={selectedGap} onClose={() => setSelectedGap(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
