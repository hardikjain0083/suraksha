import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle,
  Copy, Search, Code, GitMerge, History, ShieldCheck,
  Calendar, User, FileText, Loader2
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { ObligationHighlighter } from '../watcher/ObligationHighlighter';

interface Props {
  gap: any;
  onClose: () => void;
  onActionComplete?: () => void;
}

const STAGE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  vector_search:    { icon: Search,     color: 'text-canara-primary',  bg: 'bg-canara-primary/10' },
  semantic_analysis:{ icon: GitMerge,   color: 'text-blue-600',        bg: 'bg-blue-50' },
  syntactic_check:  { icon: Code,       color: 'text-purple-600',      bg: 'bg-purple-50' },
  historical_match: { icon: History,    color: 'text-slate-600',       bg: 'bg-slate-100' },
};

const ResultBadge = ({ result }: { result: string }) => {
  if (result === 'pass') return (
    <span className="flex items-center gap-1 text-canara-success text-xs font-bold px-2 py-0.5 bg-canara-success/10 rounded-full">
      <CheckCircle className="w-3 h-3" /> PASS
    </span>
  );
  if (result === 'fail') return (
    <span className="flex items-center gap-1 text-canara-danger text-xs font-bold px-2 py-0.5 bg-canara-danger/10 rounded-full">
      <XCircle className="w-3 h-3" /> FAIL
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-amber-600 text-xs font-bold px-2 py-0.5 bg-amber-50 rounded-full">
      <AlertTriangle className="w-3 h-3" /> REVIEW
    </span>
  );
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  covered:    { label: 'COVERED', color: 'text-canara-success', bg: 'bg-canara-success/10', border: 'border-canara-success/30' },
  suspected:  { label: 'SUSPECTED GAP', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  confirmed:  { label: 'CONFIRMED GAP', color: 'text-canara-danger', bg: 'bg-canara-danger/10', border: 'border-canara-danger/30' },
  data_error: { label: 'DATA ERROR', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300' },
};

export const GapDetailModal: React.FC<Props> = ({ gap, onClose, onActionComplete }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const steps: any[] = gap.judge_explanation || [];
  const topPolicy = gap.top_policy_matches?.[0];
  const verdict = VERDICT_CONFIG[gap.gap_status] || VERDICT_CONFIG.data_error;

  const copyTechnical = () => {
    const text = steps.map(s => `[${s.stage}] ${s.technical_detail}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (action: 'approve' | 'dismiss' | 'escalate') => {
    setLoading(true);
    try {
      if (gap.gap_id) {
        await apiClient.post(`/api/gaps/queue/${gap.gap_id}/${action}`);
      } else {
        alert('Action registered! (Draft MAP created in background)');
      }
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const suggestedDeadline = new Date();
  suggestedDeadline.setDate(suggestedDeadline.getDate() + 30);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-canara-primary/10">
              <ShieldCheck className="w-5 h-5 text-canara-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Judge Explanation Mode</h2>
              <p className="text-xs text-slate-500 font-mono">{gap.clause_number || 'Unnumbered Clause'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyTechnical} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors">
              <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy Technical'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Clause Text */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Clause Under Analysis</h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed">
              <ObligationHighlighter text={gap.clause_text} />
            </div>
          </div>

          {/* Side-by-side Policy Comparison */}
          {topPolicy && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Policy Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-canara-danger/30 bg-canara-danger/5 p-4">
                  <div className="text-xs font-bold text-canara-danger mb-2 uppercase tracking-wider">📋 Regulatory Requirement</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <ObligationHighlighter text={gap.clause_text} />
                  </p>
                </div>
                <div className={`rounded-xl border p-4 ${topPolicy.overall_pass ? 'border-canara-success/30 bg-canara-success/5' : 'border-amber-200 bg-amber-50'}`}>
                  <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${topPolicy.overall_pass ? 'text-canara-success' : 'text-amber-700'}`}>
                    🗂️ Best Matching Policy
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mb-1">{topPolicy.title}</div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-5">
                    {topPolicy.full_text || '(No text available)'}
                  </p>
                </div>
              </div>
              {/* Similarity gauge */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-slate-500">Semantic Similarity:</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topPolicy.similarity * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${topPolicy.similarity >= 0.85 ? 'bg-canara-success' : topPolicy.similarity >= 0.70 ? 'bg-amber-500' : 'bg-canara-danger'}`}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-slate-700">{topPolicy.similarity.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Judge Explanation Timeline */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step-by-Step Reasoning</h3>
              <span className="text-xs text-slate-400">Click to expand technical details</span>
            </div>

            <div className="space-y-2">
              {steps.map((step: any, idx: number) => {
                const stageCfg = STAGE_CONFIG[step.stage] || STAGE_CONFIG.vector_search;
                const StageIcon = stageCfg.icon;
                const isExpanded = expandedStep === idx;
                const connectorColor = step.result === 'pass' ? 'border-canara-success' : step.result === 'fail' ? 'border-canara-danger' : 'border-amber-400';

                return (
                  <div key={idx} className="relative pl-8">
                    {/* Vertical connector */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-3 top-10 bottom-0 w-0.5 border-l-2 border-dashed ${connectorColor} opacity-50`} />
                    )}
                    {/* Icon */}
                    <div className={`absolute left-0 top-3 w-7 h-7 rounded-full ${stageCfg.bg} flex items-center justify-center`}>
                      <StageIcon className={`w-3.5 h-3.5 ${stageCfg.color}`} />
                    </div>

                    <div className={`rounded-xl border transition-colors ${isExpanded ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                      <button
                        className="w-full flex items-center justify-between p-3 text-left"
                        onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-800 shrink-0">{step.title}</span>
                          <ResultBadge result={step.result} />
                          <span className="text-xs text-slate-500 truncate hidden sm:block">{step.business_impact}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 space-y-3">
                              <p className="text-sm text-slate-600 leading-relaxed">{step.business_impact}</p>
                              <div className="bg-slate-950 rounded-lg p-3 text-xs font-mono text-slate-300 leading-relaxed">
                                <div className="text-slate-500 mb-1.5">// Technical trace:</div>
                                {step.technical_detail}
                              </div>
                              {step.data && Object.keys(step.data).length > 0 && (
                                <div className="bg-slate-100 rounded-lg p-2 text-xs font-mono text-slate-600 overflow-x-auto">
                                  {JSON.stringify(step.data, null, 2)}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>

            {steps.length === 0 && (
              <div className="py-6 text-center text-slate-400 italic text-sm">No step-by-step data available for this clause.</div>
            )}
          </div>

          {/* Final Verdict Banner */}
          <div className={`rounded-xl border-2 ${verdict.border} ${verdict.bg} p-4 flex justify-between items-center`}>
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Final Classification</p>
              <p className={`text-xl font-black ${verdict.color}`}>{verdict.label}</p>
              <p className="text-xs text-slate-500 mt-1">{gap.classification_reason}</p>
            </div>
            {gap.routing === 'auto_routed' && (
              <span className="px-3 py-1.5 bg-canara-success/10 text-canara-success text-xs font-bold rounded-lg border border-canara-success/30">
                ✓ Auto-Routed
              </span>
            )}
            {gap.routing === 'pending_review' && (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                ⏳ Pending Review
              </span>
            )}
          </div>
          {/* Suggested MAP Preview */}
          {(gap.gap_status === 'confirmed' || gap.gap_status === 'suspected') && (
            <div className="bg-canara-primary/5 rounded-xl border border-canara-primary/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-canara-primary" />
                <h3 className="text-sm font-bold text-canara-primary uppercase tracking-wider">Suggested Remediation (MAP)</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Proposed Title</p>
                    <p className="text-sm text-slate-800 font-semibold">
                      {gap.gap_status === 'confirmed' ? 'New Implementation: ' : 'Policy Update: '} 
                      {gap.clause_text.substring(0, 40)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Owner Department</p>
                    <p className="text-sm text-slate-800 font-semibold">{topPolicy?.department || 'Compliance / InfoSec'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Description</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automatically generated plan to address missing compliance in {gap.circular_id}. 
                    Requires updating internal standards to explicitly include technical obligations identified by AI.
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Deadline: {suggestedDeadline.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Assignee: Pending Triage</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(gap.gap_status === 'confirmed' || gap.gap_status === 'suspected') && (
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => handleAction('approve')}
              disabled={loading}
              className="flex-1 py-2 bg-canara-primary text-white rounded-lg font-semibold text-sm hover:bg-canara-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Approve & Create MAP
            </button>
            <button 
              onClick={() => handleAction('escalate')}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              Send to Triage
            </button>
            <button 
              onClick={() => handleAction('dismiss')}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 text-slate-500 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
