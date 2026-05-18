import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Loader2, Clock, CheckCircle2, Upload, History,
  AlertTriangle, ChevronRight,
} from 'lucide-react';
import { mapsApi } from '../../lib/api';
import type { MapDetail } from '../../types/map';
import { ProvenanceTimeline } from './ProvenanceTimeline';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  approved: 'bg-blue-100 text-blue-800',
  open: 'bg-canara-primary/10 text-canara-primary',
  in_progress: 'bg-amber-50 text-amber-800',
  complete: 'bg-canara-success/10 text-canara-success',
  rejected: 'bg-red-50 text-red-700',
  escalated: 'bg-orange-50 text-orange-800',
};

interface Props {
  mapId: string;
  onClose: () => void;
}

export const MapDetailModal: React.FC<Props> = ({ mapId, onClose }) => {
  const [map, setMap] = useState<MapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  useEffect(() => {
    mapsApi.get(mapId).then((r) => setMap(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [mapId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <motion.div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-canara-primary" />
          </motion.div>
        ) : map ? (
          <>
            <motion.div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start">
              <motion.div>
                <motion.div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm text-slate-500">{map.map_id}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[map.status] || STATUS_STYLES.draft}`}>
                    {map.status}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-canara-primary/10 text-canara-primary">
                    Priority {map.priority_score}
                  </span>
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900">{map.title}</h2>
              </motion.div>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            <motion.div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
              <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Provenance Path</h3>
                <motion.div className="bg-slate-50 rounded-xl border border-slate-100 p-2">
                  <ProvenanceTimeline
                    nodes={map.provenance_path}
                    onNodeClick={(_, i) => setSelectedNode(i)}
                    highlightIndex={selectedNode}
                  />
                </motion.div>
                {selectedNode != null && map.provenance_path[selectedNode] && (
                  <p className="text-xs text-slate-600 mt-2 p-2 bg-white border rounded-lg">
                    {JSON.stringify(map.provenance_path[selectedNode], null, 2)}
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Description & Requirements</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{map.description}</p>
                <ul className="mt-2 space-y-1">
                  {map.requirements?.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight className="w-4 h-4 text-canara-primary shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Lifecycle Timeline</h3>
                <motion.div className="flex gap-2 flex-wrap">
                  {map.timeline?.map((t) => (
                    <motion.div
                      key={t.stage}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        t.completed
                          ? 'bg-canara-success/10 border-canara-success/30 text-canara-success'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {t.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {t.label}
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Evidence Checklist</h3>
                <motion.div className="space-y-2">
                  {map.evidence_items?.map((e) => (
                    <motion.div
                      key={e.evidence_type}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <motion.div className="flex items-center gap-2">
                        {e.uploaded ? (
                          <CheckCircle2 className="w-4 h-4 text-canara-success" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-slate-800">{e.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{e.evidence_type}</span>
                      </motion.div>
                      <span className={`text-xs ${e.uploaded ? 'text-canara-success' : 'text-amber-600'}`}>
                        {e.uploaded ? 'Uploaded' : 'Pending'}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Audit Trail
                </h3>
                <motion.div className="space-y-2 max-h-40 overflow-y-auto">
                  {map.audit_trail?.map((a, i) => (
                    <motion.div key={i} className="text-xs border-l-2 border-canara-primary/30 pl-3 py-1">
                      <span className="font-semibold text-slate-800">{a.user_name || 'System'}</span>
                      <span className="text-slate-400"> · {a.action}</span>
                      {a.details && <p className="text-slate-500 mt-0.5">{a.details}</p>}
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <motion.div className="flex items-center gap-2 text-slate-600 text-sm pb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Deadline: {new Date(map.deadline).toLocaleDateString()}
              </motion.div>
            </motion.div>
          </>
        ) : (
          <p className="p-8 text-center text-slate-500">MAP not found</p>
        )}
      </motion.div>
    </motion.div>
  );
};
