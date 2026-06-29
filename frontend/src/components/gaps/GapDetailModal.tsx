import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, FileText, Calendar, User, Loader2, CheckCircle, XCircle, Shield } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Props {
  gap: any;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const GapDetailModal: React.FC<Props> = ({ gap, onClose, onActionComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'dismiss' | 'escalate') => {
    setLoading(true);
    try {
      if (gap.gap_id) {
        await apiClient.post(`/api/gaps/queue/${gap.gap_id}/${action}`);
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

  const getSeverityBadge = (sev: string) => {
    const s = (sev || 'unknown').toLowerCase();
    switch (s) {
      case 'critical':
        return 'border-[#FF5B5B]/30 text-[#FF5B5B] bg-[#FF5B5B]/10';
      case 'high':
        return 'border-[#FFB020]/30 text-[#FFB020] bg-[#FFB020]/10';
      case 'medium':
        return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
      case 'low':
        return 'border-[#A8FF00]/30 text-[#A8FF00] bg-[#A8FF00]/10';
      default:
        return 'border-white/10 text-[#97A18D] bg-white/5';
    }
  };

  const similarityScores = gap.similarity_scores || {};
  const finalScore = (gap.similarity_score || 0) * 100;

  // For the circular gauge svg
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="bg-[#0C100D] border border-[#A8FF00]/25 rounded-xl shadow-[0_0_50px_rgba(168,255,0,0.15)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col font-mono text-[#F5F7F3]"
        onClick={e => e.stopPropagation()}
      >
        {/* Custom scrollbar css injections */}
        <style dangerouslySetInnerHTML={{__html: `
          .custom-modal-scroll::-webkit-scrollbar { width: 6px; }
          .custom-modal-scroll::-webkit-scrollbar-track { background: #0C100D; }
          .custom-modal-scroll::-webkit-scrollbar-thumb { background: rgba(168, 255, 0, 0.2); border-radius: 3px; }
          .custom-modal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168, 255, 0, 0.4); }
        `}} />

        {/* Top Header Row (Command center style) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#A8FF00]/12 bg-[#111712]/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getSeverityBadge(gap.severity)}`}>
              {gap.severity || 'Unknown'}
            </span>
            <span className="px-2.5 py-0.5 rounded border border-[#45D8FF]/30 text-[#45D8FF] bg-[#45D8FF]/10 text-[9px] font-bold uppercase tracking-wider">
              {(gap.gap_status || gap.gap_type || 'Unknown Gap').replace(/_/g, ' ')}
            </span>
            <span className="px-2.5 py-0.5 rounded border border-[#A8FF00]/30 text-[#A8FF00] bg-[#A8FF00]/5 text-[9px] font-bold uppercase tracking-wider">
              {gap.department_id?.replace('DEPT-', '') || 'Compliance'}
            </span>
            {gap.page_number && (
              <span className="px-2.5 py-0.5 rounded border border-white/10 text-[#97A18D] bg-white/5 text-[9px] font-bold uppercase tracking-wider">
                Page {gap.page_number}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-[#97A18D] font-mono">// GAP ID: {gap.gap_id}</div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#A8FF00]/10 text-[#97A18D] hover:text-[#A8FF00] rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-modal-scroll bg-[#0C100D]">
          {/* Side-by-side RBI vs Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RBI Guideline */}
            <div className="bg-[#111712] border border-[#A8FF00]/12 rounded-lg p-5 flex flex-col justify-between hover:border-[#A8FF00]/25 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#45D8FF]" />
                  <span className="text-xs font-bold text-[#45D8FF] uppercase tracking-wider">RBI Guideline Directive</span>
                </div>
                <div className="text-xs text-[#F5F7F3] leading-relaxed font-sans mb-4 whitespace-pre-wrap">
                  {gap.clause_text}
                </div>
              </div>
              <div className="border-t border-[#A8FF00]/10 pt-3 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-[#97A18D]">
                {gap.circular_number && (
                  <div>
                    CIRCULAR: <span className="text-[#F5F7F3]">{gap.circular_number}</span>
                  </div>
                )}
                <div>
                  ACTION: <span className="text-[#F5F7F3]">{gap.rbi_action || 'N/A'}</span>
                </div>
                <div>
                  MODALITY: <span className="text-[#F5F7F3]">{gap.rbi_modality || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Best Matching Policy Clause */}
            <div className="bg-[#111712] border border-[#A8FF00]/12 rounded-lg p-5 flex flex-col justify-between hover:border-[#A8FF00]/25 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#A8FF00]" />
                  <span className="text-xs font-bold text-[#A8FF00] uppercase tracking-wider">Best Matching Policy Clause</span>
                </div>
                <div className="text-xs text-[#F5F7F3] leading-relaxed font-sans mb-4 whitespace-pre-wrap">
                  {gap.fixed_policy_content || gap.top_policy_title || 'No matching clause found'}
                </div>
              </div>
              <div className="border-t border-[#A8FF00]/10 pt-3 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-[#97A18D]">
                <div>
                  SECTION/LINE: <span className="text-[#F5F7F3]">{gap.matched_policy_line_num || 'N/A'}</span>
                </div>
                <div>
                  ACTION: <span className="text-[#F5F7F3]">{gap.policy_action || 'N/A'}</span>
                </div>
                <div>
                  MODALITY: <span className="text-[#F5F7F3]">{gap.policy_modality || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gap Description Box - Dark with Orange Accent */}
          <div className="bg-[#111712] border border-[#FFB020]/25 rounded-lg p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#FFB020]" />
            <h3 className="font-bold text-[#FFB020] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB020]" /> Mismatch Diagnostics &amp; Classifications
            </h3>
            <p className="text-xs text-[#97A18D] font-sans leading-relaxed pl-1">
              {gap.mismatch_description || gap.classification_reason || 'Gap detected - manual review required.'}
            </p>
          </div>

          {/* Similarity & Circular Gauge visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progress gauge chart */}
            <div className="bg-[#111712] border border-[#A8FF00]/12 rounded-lg p-5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-[#97A18D] font-bold uppercase tracking-wider mb-3">Ensemble Match Conf.</span>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="stroke-[#0C100D]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="stroke-[#A8FF00]"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-[#F5F7F3]">{finalScore.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Similarity Signal Breakdown details */}
            <div className="bg-[#111712] border border-[#A8FF00]/12 rounded-lg p-5 md:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#97A18D] flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#A8FF00]" /> Semantic Similarity Signal Analysis
                </h3>
                <div className="space-y-2.5">
                  {Object.keys(similarityScores).length > 0 ? (
                    Object.entries(similarityScores).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-[10px] border-b border-white/[0.04] pb-1.5 font-mono">
                        <span className="text-[#97A18D] uppercase tracking-wider">{key}</span>
                        <span className="font-bold text-[#45D8FF]">{((val as number) * 100).toFixed(1)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#97A18D] font-sans">No similarity breakdown available for this model inference run.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {(gap.gap_status === 'confirmed' || gap.gap_status === 'suspected') && (
          <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-[#A8FF00]/12 bg-[#111712]/50">
            <button
              onClick={() => handleAction('approve')}
              disabled={loading}
              className="flex-1 min-w-[200px] py-2 bg-[#A8FF00] text-[#0C100D] hover:bg-[#CCFF00] hover:shadow-[0_0_15px_rgba(168,255,0,0.4)] rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Approve &amp; Instructure MAP
            </button>
            <button
              onClick={() => handleAction('escalate')}
              disabled={loading}
              className="px-5 py-2 border border-[#FFB020]/45 bg-[#FFB020]/5 text-[#FFB020] hover:bg-[#FFB020]/15 hover:shadow-[0_0_12px_rgba(255,176,32,0.15)] rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
            >
              Triage Escalation
            </button>
            <button
              onClick={() => handleAction('dismiss')}
              disabled={loading}
              className="px-5 py-2 border border-white/10 bg-white/5 text-[#97A18D] hover:bg-white/10 hover:text-[#F5F7F3] rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
            >
              Dismiss
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
