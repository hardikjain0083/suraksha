import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckCircle, AlertTriangle, XCircle, Database,
  ChevronDown, Eye, Plus, 
  Clock, BarChart3, Radar, Loader2, Cpu, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { GapDetailModal } from '../../components/gaps/GapDetailModal';
import { GlassCard } from '@/components/ui/glass-card';

const DETECTION_STAGES = [
  "Fetching circular clauses...",
  "Searching vector database...",
  "Comparing semantic similarity...",
  "Checking keyword compliance...",
  "Analyzing historical patterns...",
  "Classification complete!"
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  covered:    { color: 'text-cyber-green', bg: 'bg-cyber-green/10', border: 'border-cyber-green/20', icon: CheckCircle, label: 'Covered' },
  suspected:  { color: 'text-cyber-magenta', bg: 'bg-cyber-magenta/10', border: 'border-cyber-magenta/20', icon: AlertTriangle, label: 'Suspected Gap' },
  confirmed:  { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Confirmed Gap' },
  data_error: { color: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700/30', icon: Database, label: 'Data Error' },
  pending:    { color: 'text-slate-500', bg: 'bg-slate-800/20', border: 'border-slate-800/30', icon: Clock, label: 'Pending' },
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center shadow-glow-cyan/20">
                <Radar className={`w-6 h-6 text-cyber-cyan ${detecting ? 'animate-spin' : ''}`} />
              </div>
              {detecting && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-cyber-cyan"
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan">COGNITIVE GAP SCANNER</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">Vector similarity parsing and rule-matching compliance matrix analysis.</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/gaps/queue')}
          className="flex items-center gap-2 px-4 py-2 border border-cyber-cyan/30 hover:border-cyber-cyan/60 text-cyber-cyan bg-cyber-cyan/5 hover:bg-cyber-cyan/10 rounded-lg text-xs font-mono font-bold transition-all shadow-glow-cyan/10"
        >
          <BarChart3 className="w-4 h-4" /> TRACE TRIAGE QUEUE
        </button>
      </div>

      {/* Selector and Action Console */}
      <GlassCard className="p-5 border-cyber-cyan/15">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">Select Target Regulatory Circular for Audit</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-obsidian-950 border border-cyber-cyan/20 hover:border-cyber-cyan/40 rounded-lg px-4 py-2.5 pr-10 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyber-cyan focus:shadow-glow-cyan transition-all"
                value={selectedCircular}
                onChange={(e) => setSelectedCircular(e.target.value)}
                disabled={detecting}
              >
                {circulars.length === 0 && <option value="">No parsed circulars available in memory</option>}
                {circulars.map(c => (
                  <option key={c.circular_id} value={c.circular_id} className="bg-obsidian-950 text-slate-200">
                    [{c.issuer}] {c.circular_id} — {c.clauses_extracted} target clauses
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={runDetection}
            disabled={detecting || !selectedCircular}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-mono text-xs font-bold text-obsidian-950 transition-all shadow-glow-cyan ${
              detecting 
                ? 'bg-cyber-cyan/40 cursor-not-allowed text-cyber-cyan shadow-none border border-cyber-cyan/20' 
                : 'bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:shadow-glow-cyan hover:scale-[1.02]'
            }`}
          >
            {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {detecting ? DETECTION_STAGES[detectionStage].toUpperCase() : 'LAUNCH COGNITIVE PARSE'}
          </button>
        </div>

        {/* Diagnostic Progress Bar */}
        <AnimatePresence>
          {detecting && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden border-t border-cyber-cyan/5 pt-4">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span className="text-cyber-cyan font-bold">{DETECTION_STAGES[detectionStage].toUpperCase()}</span>
                <span>{Math.round((detectionStage / (DETECTION_STAGES.length - 1)) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-obsidian-950 rounded-full overflow-hidden border border-cyber-cyan/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue shadow-glow-cyan"
                  animate={{ width: `${(detectionStage / (DETECTION_STAGES.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex gap-1.5 mt-3">
                {DETECTION_STAGES.slice(0, -1).map((_s, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= detectionStage ? 'bg-cyber-cyan shadow-glow-cyan/50' : 'bg-obsidian-950 border border-white/5'}`} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* KPI Stats Grid */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Clauses Indexed', value: result.total_clauses_analyzed, color: 'text-slate-100', glow: 'none' },
              { label: 'Coverage Rate', value: `${coveragePercent}%`, color: 'text-cyber-green', glow: 'green' },
              { label: 'Confirmed Gaps', value: result.confirmed, color: 'text-red-400', glow: 'red' },
              { label: 'Suspected Gaps', value: result.suspected, color: 'text-cyber-magenta', glow: 'magenta' },
              { label: 'Ingest Errors', value: result.data_errors, color: 'text-slate-400', glow: 'none' },
            ].map((stat, i) => (
              <GlassCard key={stat.label} glowColor={stat.glow as any} className="p-4 border-cyber-cyan/10">
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </GlassCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Results Table */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <GlassCard className="border-cyber-cyan/10">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-cyber-cyan/10 gap-3">
                <div>
                  <h2 className="font-semibold font-mono text-sm text-cyber-cyan flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-cyber-blue" />
                    EXPLAINABLE COMPLIANCE LEDGER
                    <span className="text-[10px] text-slate-500 font-normal ml-2">({result.detection_time_ms}ms computational cost)</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-obsidian-950 p-1 rounded-lg border border-cyber-cyan/5">
                    {['all', 'covered', 'suspected', 'confirmed', 'data_error'].map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                          filterStatus === s 
                            ? 'bg-cyber-cyan text-obsidian-950 shadow-glow-cyan' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-slate-300">
                  <thead>
                    <tr className="bg-obsidian-950/60 border-b border-cyber-cyan/10 text-slate-400">
                      {['Clause ID', 'Core Mandate', 'Severity', 'Triage Status', 'Semantic Score', 'Triage Action'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left font-bold uppercase tracking-wider text-[10px] text-cyber-cyan/80">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-cyan/5">
                    {filteredGaps.map((gap: any, i: number) => {
                      const cfg = STATUS_CONFIG[gap.gap_status] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      return (
                        <tr
                          key={i}
                          className={`hover:bg-cyber-cyan/5 transition-colors ${
                            gap.gap_status === 'confirmed' 
                              ? 'bg-red-950/10' 
                              : gap.gap_status === 'suspected' 
                                ? 'bg-cyber-magenta/5' 
                                : ''
                          }`}
                        >
                          {/* Clause info */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-cyber-blue font-bold">{gap.clause_number || 'N/A'}</span>
                          </td>
                          {/* Clause detail */}
                          <td className="px-4 py-3.5 max-w-sm truncate" title={gap.clause_text}>
                            <span className="text-slate-200 font-sans text-xs">{gap.clause_text}</span>
                          </td>
                          {/* Obligation type */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              gap.severity === 'critical' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : gap.severity === 'high' 
                                  ? 'bg-cyber-magenta/10 text-cyber-magenta border border-cyber-magenta/20' 
                                  : 'bg-slate-800 text-slate-400'
                            }`}>
                              {(gap.severity || 'LOW').toUpperCase()}
                            </span>
                          </td>
                          {/* Gap Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`flex items-center gap-1.5 w-max px-2.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                              <Icon className="w-3 h-3" /> {cfg.label.toUpperCase()}
                            </span>
                          </td>
                          {/* Vector similarity progress bar */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {gap.similarity_score != null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-obsidian-950 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className={`h-full rounded-full ${
                                      gap.similarity_score >= 0.85 
                                        ? 'bg-cyber-green' 
                                        : gap.similarity_score >= 0.70 
                                          ? 'bg-cyber-blue' 
                                          : 'bg-cyber-magenta'
                                    }`}
                                    style={{ width: `${gap.similarity_score * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{gap.similarity_score.toFixed(2)}</span>
                              </div>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedGap(gap)}
                                className="px-2.5 py-1 bg-obsidian-900 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> VERIFY
                              </button>
                              {(gap.gap_status === 'confirmed' || gap.gap_status === 'suspected') && (
                                <button className="px-2.5 py-1 bg-cyber-blue/15 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/25 rounded-md text-[10px] font-bold transition-all flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> DEFINE MAP
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredGaps.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500 italic font-mono text-[10px]">
                          {result ? 'NO MATCHING LEDGER ENTRIES FOUND IN DATABASE.' : 'RUN DISCOVERY TELEMETRY TO INGEST SIMILARITY DATA.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !detecting && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/10 flex items-center justify-center mb-5 shadow-glow-cyan/5">
            <Radar className="w-10 h-10 text-cyber-cyan/30 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold font-mono text-slate-300 mb-1">NO TELEMETRY RECORDED</h3>
          <p className="text-xs font-mono text-slate-500 max-w-sm">Select circular database from the console and click "Launch Cognitive Parse" to begin similarity analysis.</p>
        </div>
      )}

      {/* Gap Detail Modal */}
      <AnimatePresence>
        {selectedGap && (
          <GapDetailModal gap={selectedGap} onClose={() => setSelectedGap(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
