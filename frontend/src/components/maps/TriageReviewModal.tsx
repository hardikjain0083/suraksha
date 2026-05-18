import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, CheckCircle, Edit3, XCircle, ArrowUpRight } from 'lucide-react';
import { mapsApi } from '../../lib/api';
import type { TriageMapCard } from '../../types/map';
import { ProvenanceTimeline } from './ProvenanceTimeline';

const DEPARTMENTS = [
  { id: 'DEPT-INFOSEC', name: 'Information Security' },
  { id: 'DEPT-IT', name: 'IT Operations' },
  { id: 'DEPT-COMPLIANCE', name: 'Compliance' },
  { id: 'DEPT-LEGAL', name: 'Legal & Regulatory' },
];

const EVIDENCE_OPTIONS = [
  'config_file', 'screenshot', 'pdf_document', 'ticket_id', 'scan_report',
];

interface Props {
  card: TriageMapCard;
  onClose: () => void;
  onComplete: () => void;
}

export const TriageReviewModal: React.FC<Props> = ({ card, onClose, onComplete }) => {
  const [department, setDepartment] = useState(card.suggested_department_id || card.department_id || 'DEPT-COMPLIANCE');
  const [evidence, setEvidence] = useState<string[]>(card.suggested_evidence || []);
  const [deadline, setDeadline] = useState(() => new Date(card.deadline).toISOString().slice(0, 10));
  const [risk, setRisk] = useState(card.risk_level || 'medium');
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const ensureMap = async (): Promise<string> => {
    if (card.map_id) return card.map_id;
    const res = await mapsApi.generate(card.gap_id);
    return res.data.map_id;
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const mapId = await ensureMap();
      await mapsApi.approve(mapId, {
        officer_id: 'emp_1',
        officer_name: 'Compliance Officer',
        department_id: department,
        evidence_types: evidence,
        deadline: new Date(deadline).toISOString(),
        risk_level: risk,
        title: editMode ? title : undefined,
        description: editMode ? description : undefined,
      });
      onComplete();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const mapId = await ensureMap();
      await mapsApi.reject(mapId, {
        officer_id: 'emp_1',
        officer_name: 'Compliance Officer',
        reason: 'Rejected during triage review',
      });
      onComplete();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      const mapId = await ensureMap();
      await mapsApi.escalate(mapId, {
        reason: 'Escalated from triage — requires senior review',
        officer_id: 'emp_1',
        officer_name: 'Compliance Officer',
      });
      onComplete();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvidence = (t: string) => {
    setEvidence((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Review MAP — Human-in-the-Loop</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        <motion.div className="flex-1 overflow-y-auto p-6 space-y-6">
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div>
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Original Clause</h3>
              <motion.div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-slate-800 leading-relaxed">
                {card.clause_text}
              </motion.div>
              <p className="text-xs text-slate-400 mt-2 font-mono">{card.circular_id}</p>
            </motion.div>

            <motion.div>
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Suggested MAP</h3>
              {editMode ? (
                <motion.div className="space-y-2">
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-semibold"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm h-24"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </motion.div>
              ) : (
                <motion.div className="bg-canara-success/5 border border-canara-success/20 rounded-xl p-4">
                  <p className="font-semibold text-slate-900 mb-2">{title}</p>
                  <p className="text-sm text-slate-600">{description}</p>
                </motion.div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                AI confidence: {(card.confidence_score * 100).toFixed(0)}%
              </p>
            </motion.div>
          </motion.div>

          <ProvenanceTimeline nodes={card.provenance_path} animated />

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div>
              <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
              <select
                className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </motion.div>
            <motion.div>
              <label className="text-xs font-bold text-slate-500 uppercase">Deadline</label>
              <input
                type="date"
                className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </motion.div>
            <motion.div>
              <label className="text-xs font-bold text-slate-500 uppercase">Risk Level</label>
              <select
                className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
              >
                {['critical', 'high', 'medium', 'low'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </motion.div>
            <motion.div>
              <label className="text-xs font-bold text-slate-500 uppercase">Evidence Types</label>
              <motion.div className="mt-1 flex flex-wrap gap-1">
                {EVIDENCE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleEvidence(t)}
                    className={`text-[10px] px-2 py-1 rounded border ${
                      evidence.includes(t)
                        ? 'bg-canara-primary text-white border-canara-primary'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div className="px-6 py-4 border-t flex flex-wrap gap-2 justify-end bg-slate-50">
          <button
            type="button"
            disabled={loading}
            onClick={handleApprove}
            className="flex items-center gap-1.5 px-4 py-2 bg-canara-success text-white rounded-lg text-sm font-semibold hover:bg-canara-success/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve MAP
          </button>
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-canara-primary text-white rounded-lg text-sm font-semibold"
          >
            <Edit3 className="w-4 h-4" /> Edit & Approve
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleReject}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleEscalate}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold"
          >
            <ArrowUpRight className="w-4 h-4" /> Escalate
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
