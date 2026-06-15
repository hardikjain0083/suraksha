import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/glass-card';
import { apiClient } from '../../lib/api';
import { Users, BarChart3, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

interface WorkloadItem {
  employee_id: string;
  name: string;
  open_maps: number;
  overdue_maps: number;
  resolved_this_week: number;
  workload_score: number;
  color_code: 'green' | 'yellow' | 'red';
}

interface TeamMap {
  id: string;
  map_id: string;
  title: string;
  priority: string;
  status: string;
  deadline: string;
  assigned_to: string;
}

export function TeamBoardPage() {
  const [loading, setLoading] = useState(true);
  const [workloads, setWorkloads] = useState<WorkloadItem[]>([]);
  const [maps, setMaps] = useState<TeamMap[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/dashboard/head-workload-heatmap').catch(() => ({ data: [] })),
      apiClient.get('/api/dept/maps').catch(() => ({ data: { items: [] } }))
    ])
      .then(([workloadRes, mapsRes]) => {
        setWorkloads(workloadRes.data || []);
        setMaps(mapsRes.data.items || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getScoreColorClass = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 shadow-glow-red text-red-400';
      case 'yellow':
        return 'bg-yellow-500 shadow-glow-yellow text-yellow-400';
      case 'green':
      default:
        return 'bg-cyber-green shadow-glow-green text-cyber-green';
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] font-mono text-cyber-cyan gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <p className="animate-pulse tracking-widest text-xs">SYNCHRONIZING TEAM BOARD TELEMETRY...</p>
      </div>
    );
  }

  const totalOpenMaps = maps.filter(m => m.status !== 'complete' && m.status !== 'resolved').length;
  const totalCompletedMaps = maps.filter(m => m.status === 'complete' || m.status === 'resolved').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Users className="w-6 h-6 text-cyber-cyan" />
            DEPARTMENT TEAM & WORKLOAD BOARD
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Real-time workload score heatmaps and department officer queue distribution.
          </p>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workload Heatmap list */}
        <GlassCard className="p-6 border-cyber-cyan/10">
          <div className="flex items-center gap-2 border-b border-cyber-cyan/10 pb-3 mb-4">
            <BarChart3 className="w-4 h-4 text-cyber-cyan" />
            <h2 className="text-sm font-bold font-mono tracking-wider text-cyber-cyan uppercase">
              Officer Workload Heatmap
            </h2>
          </div>
          
          <div className="space-y-5">
            {workloads.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono italic">No active officers registered in department.</p>
            ) : (
              workloads.map((emp) => {
                const percentage = Math.min(100, (emp.workload_score / 20) * 100);
                const scoreColor = emp.color_code === 'red' ? 'text-red-400' : emp.color_code === 'yellow' ? 'text-yellow-400' : 'text-cyber-green';
                return (
                  <div key={emp.employee_id} className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold">{emp.name} ({emp.employee_id})</span>
                      <span className={`${scoreColor} font-bold`}>
                        Score: {emp.workload_score} ({emp.open_maps} Open, {emp.overdue_maps} Overdue)
                      </span>
                    </div>
                    <div className="w-full bg-obsidian-950/60 rounded-full h-2 border border-cyber-cyan/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getScoreColorClass(emp.color_code)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* Stats and Action plan summary */}
        <GlassCard className="p-6 border-cyber-cyan/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-cyber-cyan/10 pb-3 mb-4">
              <Cpu className="w-4 h-4 text-cyber-cyan" />
              <h2 className="text-sm font-bold font-mono tracking-wider text-cyber-cyan uppercase">
                Queue Telemetry Summary
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-obsidian-950/60 border border-cyber-cyan/10 rounded-xl text-center">
                <div className="text-3xl font-bold font-mono text-cyber-cyan">{totalOpenMaps}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1">Active Gaps Assigned</div>
              </div>
              <div className="p-4 bg-obsidian-950/60 border border-cyber-green/10 rounded-xl text-center">
                <div className="text-3xl font-bold font-mono text-cyber-green">{totalCompletedMaps}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1">Resolved Plans</div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-cyber-cyan/5 border border-cyber-cyan/10 rounded-lg text-[10px] font-mono text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-cyber-cyan shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyber-cyan">AUTOMATED DISPATCH WARNING:</span> Workload score is determined dynamically by <code className="text-white">open_maps * 2 + overdue_maps * 5</code>. Expertise tags matching provides subtractive priority.
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Task Queue table */}
      <GlassCard className="border-cyber-cyan/10 overflow-hidden">
        <div className="p-4 bg-obsidian-950/40 border-b border-cyber-cyan/10 flex justify-between items-center">
          <h2 className="text-xs font-bold font-mono tracking-wider text-cyber-cyan uppercase">
            Active Department Action Plans
          </h2>
          <span className="text-[10px] font-mono text-slate-500">LIVE FEED</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cyber-cyan/10 font-mono text-xs text-left">
            <thead className="bg-obsidian-950 text-slate-400 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-3 border-b border-cyber-cyan/10">MAP ID</th>
                <th className="px-6 py-3 border-b border-cyber-cyan/10">Assignee</th>
                <th className="px-6 py-3 border-b border-cyber-cyan/10">Title</th>
                <th className="px-6 py-3 border-b border-cyber-cyan/10">Deadline</th>
                <th className="px-6 py-3 border-b border-cyber-cyan/10">Priority</th>
                <th className="px-6 py-3 border-b border-cyber-cyan/10 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-cyan/5 bg-obsidian-900/20 text-slate-300">
              {maps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">
                    No active MAPs found in queue.
                  </td>
                </tr>
              ) : (
                maps.map((map) => (
                  <tr key={map.id} className="hover:bg-cyber-cyan/5 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap text-cyber-cyan font-bold">{map.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-bold">{map.assigned_to || 'UNASSIGNED'}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-md truncate">{map.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">{map.deadline}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getPriorityColor(map.priority)}`}>
                        {map.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/20 uppercase">
                        {map.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}