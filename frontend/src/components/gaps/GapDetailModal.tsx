import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, FileText, Calendar, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
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

  const getSeverityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const similarityScores = gap.similarity_scores || {};
  const finalScore = (gap.similarity_score || 0) * 100;

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Row (Mimics research top bar) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getSeverityColor(gap.severity)}`}>
              {gap.severity || 'Unknown'}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              {(gap.gap_status || gap.gap_type || 'Unknown Gap').replace(/_/g, ' ')}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
              {gap.department_id?.replace('DEPT-', '') || 'Compliance'}
            </span>
            {gap.page_number && (
              <span className="px-3 py-1 rounded-full bg-indigo-900 text-white text-xs font-semibold">
                Page {gap.page_number}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 font-mono">Gap ID: {gap.gap_id}</div>
            <div className="text-md font-bold text-slate-800 mt-1">Score: {finalScore.toFixed(1)}%</div>
          </div>
          <button onClick={onClose} className="p-2 ml-4 hover:bg-slate-100 rounded-lg transition-colors self-start">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Side-by-side RBI vs Policy */}
          <div className="grid grid-cols-2 gap-6">
            {/* RBI Guideline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-blue-600 font-bold flex items-center gap-2">
                  <span className="text-xl">⚖️</span> RBI Guideline
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-sm text-slate-700 leading-relaxed shadow-sm">
                <p className="mb-4">{gap.clause_text}</p>
                {gap.circular_number && (
                  <div className="text-xs text-slate-500">
                    Circular: {gap.circular_number}
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-500 font-semibold">
                Action: <span className="font-normal">{gap.rbi_action || 'N/A'}</span> | 
                Modality: <span className="font-normal">{gap.rbi_modality || 'N/A'}</span>
              </div>
            </div>

            {/* Best Matching Policy Clause */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-green-600 font-bold flex items-center gap-2">
                  <span className="text-xl">📄</span> Best Matching Policy Clause
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-sm text-slate-700 leading-relaxed shadow-sm">
                <p className="mb-4">{gap.fixed_policy_content || gap.top_policy_title || 'No matching clause found'}</p>
                <div className="text-xs text-slate-500">
                  Section: {gap.matched_policy_line_num || 'N/A'}
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 font-semibold">
                Action: <span className="font-normal">{gap.policy_action || 'N/A'}</span> | 
                Modality: <span className="font-normal">{gap.policy_modality || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Gap Description Box */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-slate-800" /> Gap Description
            </h3>
            <p className="text-sm text-slate-700">
              {gap.mismatch_description || gap.classification_reason || 'Gap detected - manual review required.'}
            </p>
          </div>

          {/* Similarity Signal Breakdown */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-slate-800" /> Similarity Signal Breakdown
            </h3>
            <div className="space-y-3">
              {Object.keys(similarityScores).length > 0 ? (
                Object.entries(similarityScores).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                    <span className="font-mono text-slate-600 uppercase">{key}</span>
                    <span className="font-bold text-slate-800">{((val as number) * 100).toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No similarity breakdown available for this gap.</div>
              )}
            </div>
            {/* Progress Bar */}
            <div className="mt-5">
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${finalScore}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Final Ensemble Score: {finalScore.toFixed(1)}%
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        {(gap.gap_status === 'confirmed' || gap.gap_status === 'suspected') && (
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => handleAction('approve')}
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
