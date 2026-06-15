import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { GlassCard } from '../../components/ui/glass-card';
import { Cpu, Shield, ArrowLeft } from 'lucide-react';

interface DeptMap {
  id: string;
  map_id: string;
  title: string;
  priority: string;
  status: string;
  deadline: string;
  evidence: { uploaded: number; required: number };
}

export function DepartmentMapsPage() {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<DeptMap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/dept/maps')
      .then((res) => setMaps(res.data.items || []))
      .catch(() => setMaps([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    'pending_head_review',
    'approved',
    'assigned',
    'in_progress',
    'under_validation',
    'resolved',
    'rejected',
    'escalated',
    'pending_admin_assignment'
  ];

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

  const formatColumnLabel = (col: string) => {
    return col.replace(/_/g, ' ').toUpperCase();
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
        <p className="animate-pulse tracking-widest text-xs">SYNCHRONIZING DEPARTMENT MAPS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            DEPARTMENT COMPLIANCE MAPS
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Track and manage mitigation action plans assigned to your department.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dept')}
          className="flex items-center gap-2 font-mono text-xs text-cyber-cyan hover:text-white border border-cyber-cyan/30 hover:border-cyber-cyan/60 px-3 py-1.5 rounded-lg bg-obsidian-950 transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="w-4 h-4" />
          DASHBOARD
        </button>
      </div>

      {maps.length === 0 ? (
        <div className="text-center py-20 font-mono border border-cyber-cyan/10 rounded-xl bg-obsidian-950/40">
          <p className="text-slate-400 text-sm">No MAPs assigned to this queue.</p>
          <p className="text-slate-600 text-xs mt-2">Active compliance plans will be dispatched by the Super Admin.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-cyber-cyan/30 scrollbar-track-obsidian-950/40 h-[calc(100vh-220px)] items-stretch">
          {columns.map((column) => {
            const columnMaps = maps.filter((m) => m.status === column);
            return (
              <div
                key={column}
                className="w-80 shrink-0 bg-obsidian-950/60 rounded-xl p-4 flex flex-col border border-cyber-cyan/15 backdrop-blur-md"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 border-b border-cyber-cyan/10 pb-2">
                  <h2 className="font-bold font-mono text-xs text-cyber-cyan tracking-wider truncate mr-2">
                    {formatColumnLabel(column)}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/10 text-cyber-cyan font-bold border border-cyber-cyan/20">
                    {columnMaps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-cyber-cyan/10">
                  {columnMaps.length === 0 ? (
                    <div className="text-center py-10 text-[10px] font-mono text-slate-600 border border-dashed border-cyber-cyan/5 rounded-lg">
                      EMPTY
                    </div>
                  ) : (
                    columnMaps.map((map) => (
                      <GlassCard
                        key={map.id}
                        glowColor="none"
                        borderColor="cyan"
                        className="p-3 border-cyber-cyan/10 bg-obsidian-900/60 cursor-pointer hover:border-cyber-cyan/40 hover:scale-[1.02] transition-all flex flex-col gap-2.5"
                        onClick={() => navigate(`/dept/maps/${map.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold text-cyber-cyan">{map.id}</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${getPriorityColor(map.priority)}`}
                          >
                            {map.priority.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-relaxed tracking-wide">
                          {map.title}
                        </h3>
                        <div className="flex flex-col gap-1 border-t border-cyber-cyan/5 pt-2 mt-1 text-[9px] font-mono text-slate-400">
                          <div>DEADLINE: <span className="text-slate-300 font-bold">{map.deadline}</span></div>
                          <div className="flex justify-between items-center mt-0.5">
                            <span>EVIDENCE SUBMITTED:</span>
                            <span className="text-cyber-cyan font-bold">
                              {map.evidence.uploaded} / {map.evidence.required}
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
