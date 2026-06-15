import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { GlassCard } from '../../components/ui/glass-card';
import { EvidenceUploadModal } from '../../components/dept/EvidenceUploadModal';
import { Cpu, ArrowLeft, Shield, AlertTriangle, Calendar, Check, Send, Clock, FileText } from 'lucide-react';

interface EvidenceItem {
  evidence_id: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  uploaded_by: string;
  description: string;
  validation_status: 'pending' | 'validated' | 'rejected';
  validation_notes: string;
  uploaded?: boolean; // compatibility with old fields
}

interface ProvenanceNode {
  type: string;
  id: string;
  title?: string;
  text?: string;
  classification?: string;
  name?: string;
}

interface MapDetail {
  map_id: string;
  title: string;
  description: string;
  requirements: string[];
  status: string;
  priority_score: number;
  risk_level: string;
  circular_id: string;
  policy_id?: string;
  owner_department_id: string;
  department_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  deadline: string;
  provenance_path: ProvenanceNode[];
  evidence_items: EvidenceItem[];
  evidence_diff?: string;
  original_policy_version?: string;
  new_policy_version?: string;
}

export function DepartmentMapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [map, setMap] = useState<MapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<any[]>([]);

  const fetchMapDetails = () => {
    setError(null);
    setBlockers([]);
    apiClient
      .get(`/api/dept/maps/${id}`)
      .then((res) => {
        setMap(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch MAP details. Verify authorization.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMapDetails();
  }, [id]);

  const handleComplete = async () => {
    if (!map) return;
    setError(null);
    setBlockers([]);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post(`/api/dept/maps/${map.map_id}/complete`);
      if (res.data.success) {
        setSuccessMsg('MAP marked as complete successfully!');
        fetchMapDetails();
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        setBlockers(err.response.data.detail?.blockers || []);
        setError(err.response.data.detail?.message || 'Evidence validation failed checks.');
      } else {
        setError(err.response?.data?.detail || 'Failed to complete MAP.');
      }
    }
  };

  const handleExtend = async () => {
    if (!map) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post(`/api/dept/maps/${map.map_id}/extend`);
      if (res.data.success) {
        setSuccessMsg(`Deadline extension approved! New deadline: ${res.data.new_deadline.split('T')[0]}`);
        fetchMapDetails();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to request extension.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'resolved':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'escalated':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      case 'in_progress':
      case 'under_validation':
        return 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] font-mono text-cyber-cyan gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <p className="animate-pulse tracking-widest text-xs">RETRIEVING MAP SECURE RECORD...</p>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center font-mono text-xs text-red-400 border border-red-500/20 rounded-xl bg-red-500/5">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        {error || 'MAP NOT FOUND'}
        <button onClick={() => navigate('/dept/maps')} className="block mx-auto mt-4 text-cyber-cyan hover:underline">
          Return to Maps Queue
        </button>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(map.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4 font-mono text-xs text-slate-300">
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="cursor-pointer hover:text-cyber-cyan" onClick={() => navigate('/dept')}>DASHBOARD</span>
        <span>&gt;</span>
        <span className="cursor-pointer hover:text-cyber-cyan" onClick={() => navigate('/dept/maps')}>MY MAPS</span>
        <span>&gt;</span>
        <span className="text-cyber-cyan font-bold">{map.map_id}</span>
      </div>

      {/* Title block */}
      <GlassCard className="p-6 border-cyber-cyan/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-cyber-cyan">{map.map_id}</span>
            <span className={`text-[9px] px-2 py-0.5 border rounded font-bold uppercase ${getStatusColor(map.status)}`}>
              {map.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-100">{map.title}</h1>
          <p className="text-slate-400 text-[10px] leading-relaxed max-w-4xl">{map.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3 py-2 bg-cyber-cyan text-obsidian-950 font-bold hover:bg-cyber-cyan/80 transition-all rounded"
          >
            UPLOAD EVIDENCE
          </button>
          {map.status !== 'complete' && (
            <button
              onClick={handleExtend}
              className="px-3 py-2 border border-cyber-cyan/30 text-cyber-cyan font-bold hover:bg-cyber-cyan/5 transition-all rounded"
            >
              REQUEST EXTENSION
            </button>
          )}
        </div>
      </GlassCard>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[10px]">EXECUTION BLOCKED</p>
            <p className="leading-relaxed">{error}</p>
            {blockers.length > 0 && (
              <ul className="list-disc pl-4 mt-2 space-y-1 text-[9px] text-red-300">
                {blockers.map((blk, i) => (
                  <li key={i}>
                    {blk.label || 'Evidence'}: {blk.reason === 'not_uploaded' ? 'Not uploaded' : blk.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
          <div>{successMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: metadata & provenance */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-5 border-cyber-cyan/10 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2">
              MAP METADATA
            </h2>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">RISK LEVEL:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getPriorityColor(map.risk_level)}`}>
                  {map.risk_level.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">DEADLINE:</span>
                <span className={`font-bold flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {map.deadline.split('T')[0]} 
                  {daysLeft >= 0 ? ` (${daysLeft}d left)` : ' (OVERDUE)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ASSIGNEE:</span>
                <span className="text-slate-300 font-bold">{map.assignee_name || map.assigned_to || 'UNASSIGNED'}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 border-cyber-cyan/10 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2">
              PROVENANCE CHAIN (ZERO-TRUST)
            </h2>
            <div className="space-y-3 pl-2 relative border-l border-cyber-cyan/10 ml-1">
              {map.provenance_path.map((node, i) => (
                <div key={i} className="relative pl-4">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyber-cyan/30 border border-cyber-cyan" />
                  <div className="font-bold text-[10px] text-cyber-cyan uppercase">{node.type}</div>
                  <div className="text-[10px] text-slate-300 font-bold mt-0.5">{node.title || node.name || node.id}</div>
                  {node.text && (
                    <p className="text-[9px] text-slate-500 mt-1 bg-obsidian-950/40 p-2 border border-cyber-cyan/5 rounded line-clamp-3">
                      {node.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right column: checklist, policies & diff */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-5 border-cyber-cyan/10 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2">
              REQUIRED COMPLIANCE EVIDENCE CHECKLIST
            </h2>
            <div className="space-y-3">
              {map.evidence_items.map((item, idx) => {
                const isUploaded = item.uploaded || !!item.file_url;
                const statusColor = item.validation_status === 'validated' 
                  ? 'text-green-400 bg-green-500/10 border-green-500/20' 
                  : item.validation_status === 'rejected' 
                    ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

                return (
                  <div 
                    key={item.evidence_id || idx} 
                    className="p-3 bg-obsidian-950/40 border border-cyber-cyan/10 rounded flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-200">{item.description}</div>
                      <div className="text-[9px] text-slate-500 uppercase flex flex-wrap gap-x-4 gap-y-1">
                        <span>FORMAT: {item.file_type || 'PDF'}</span>
                        {isUploaded && (
                          <>
                            <span>UPLOADER: {item.uploaded_by}</span>
                            <span>DATE: {new Date(item.uploaded_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      {item.validation_notes && (
                        <p className="text-[9px] text-slate-500 bg-obsidian-950/60 p-2 border border-cyber-cyan/5 rounded mt-2">
                          {item.validation_notes}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                      {isUploaded && (
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] border uppercase ${statusColor}`}>
                          {item.validation_status}
                        </span>
                      )}
                      <button 
                        onClick={() => setIsUploadOpen(true)} 
                        className="px-2.5 py-1 bg-obsidian-950 border border-cyber-cyan/30 hover:border-cyber-cyan/60 hover:bg-cyber-cyan/10 transition-all rounded font-bold uppercase text-[9px]"
                      >
                        {isUploaded ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Policy diff html container */}
          {map.evidence_diff && (
            <GlassCard className="p-5 border-cyber-cyan/10 space-y-4">
              <div className="flex justify-between items-center border-b border-cyber-cyan/10 pb-2">
                <h2 className="text-xs font-bold font-mono tracking-wider text-cyber-cyan uppercase">
                  POLICY REVISION DIFF VIEWER
                </h2>
                <div className="flex gap-2 text-[9px] text-slate-400 font-mono">
                  <span>ORIGINAL: <strong className="text-slate-200">{map.original_policy_version || 'N/A'}</strong></span>
                  <span>&bull;</span>
                  <span>REVISED: <strong className="text-slate-200">{map.new_policy_version || 'N/A'}</strong></span>
                </div>
              </div>
              <div 
                className="overflow-x-auto max-h-96 text-xs" 
                dangerouslySetInnerHTML={{ __html: map.evidence_diff }} 
              />
            </GlassCard>
          )}

          {/* MAP action handler */}
          {map.status !== 'complete' && map.status !== 'resolved' && (
            <GlassCard className="p-5 border-cyber-cyan/15 bg-obsidian-950/40 space-y-3">
              <h2 className="text-xs font-bold font-mono tracking-wider text-cyber-cyan uppercase">
                COMPLETION BLOCK ACTION
              </h2>
              <div className="p-3 bg-cyber-magenta/10 border border-cyber-magenta/20 text-cyber-magenta rounded leading-relaxed text-[10px]">
                <span className="font-bold">SECURITY ENFORCEMENT:</span> Marking this MAP as complete compiles all checklist statuses. All required items must have status <code className="text-white">VALIDATED</code> to successfully close.
              </div>
              <button 
                onClick={handleComplete}
                className="w-full py-2.5 bg-cyber-green text-obsidian-950 font-bold hover:bg-cyber-green/80 transition-all rounded uppercase"
              >
                Submit & Close MAP
              </button>
            </GlassCard>
          )}
        </div>
      </div>

      <EvidenceUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        mapId={map.map_id} 
        onUploadSuccess={fetchMapDetails} 
      />
    </div>
  );
}