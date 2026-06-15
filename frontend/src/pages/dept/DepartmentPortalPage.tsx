import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import { GlassCard } from '../../components/ui/glass-card';
import { Shield, Cpu, Activity, LayoutGrid, Users2, BarChart2, ShieldAlert } from 'lucide-react';

export function DepartmentPortalPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_maps: 0,
    completion_rate: 0,
    on_time_rate: 0,
  });

  useEffect(() => {
    apiClient
      .get('/api/dept/stats')
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const displayName = user?.name || user?.empId || 'Employee';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">
      {/* Upper Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            DEPARTMENT CONTROL PORTAL
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Welcome back, {displayName}. Manage assigned compliance plans and submit evidence.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-obsidian-950 px-3 py-1.5 border border-cyber-cyan/15 rounded text-[10px] font-mono">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-slate-400">ACTIVE REGION:</span>
          <span className="text-cyber-green font-bold uppercase">{user?.department || 'SECURE INSTANCE'}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard glowColor="cyan" className="p-5 border-cyber-cyan/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Assigned MAPs</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-cyan tracking-tight">
                {stats.total_maps}
              </h3>
            </div>
            <div className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg text-cyber-cyan">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard glowColor="green" className="p-5 border-cyber-green/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Completion Rate</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-green tracking-tight">
                {stats.completion_rate}%
              </h3>
            </div>
            <div className="p-2 bg-cyber-green/10 border border-cyber-green/30 rounded-lg text-cyber-green">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard glowColor="blue" className="p-5 border-cyber-blue/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">On-Time Rate</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-blue tracking-tight">
                {stats.on_time_rate}%
              </h3>
            </div>
            <div className="p-2 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg text-cyber-blue">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/dept/maps">
          <GlassCard className="p-6 border-cyber-cyan/10 hover:border-cyber-cyan/40 hover:scale-[1.01] transition-all flex flex-col justify-between h-40">
            <div>
              <div className="flex items-center gap-2 text-cyber-cyan mb-2 font-mono">
                <LayoutGrid className="w-5 h-5" />
                <h2 className="text-sm font-bold tracking-wider uppercase">My MAPs</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Interactive compliance board — trace assignments, submit documents, and manage timelines.
              </p>
            </div>
            <span className="text-[9px] font-mono text-cyber-cyan hover:underline mt-4">LAUNCH CONSOLE &rarr;</span>
          </GlassCard>
        </Link>

        {(user?.role === 'dept_head' || user?.role === 'department_head') && (
          <Link to="/dept/team">
            <GlassCard className="p-6 border-cyber-cyan/10 hover:border-cyber-cyan/40 hover:scale-[1.01] transition-all flex flex-col justify-between h-40">
              <div>
                <div className="flex items-center gap-2 text-cyber-cyan mb-2 font-mono">
                  <Users2 className="w-5 h-5" />
                  <h2 className="text-sm font-bold tracking-wider uppercase">Team Board</h2>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Review team metrics, check dynamic workload scores, and trace assignee backlogs.
                </p>
              </div>
              <span className="text-[9px] font-mono text-cyber-cyan hover:underline mt-4">VIEW TEAM FEED &rarr;</span>
            </GlassCard>
          </Link>
        )}

        <Link to="/dept/stats">
          <GlassCard className="p-6 border-cyber-cyan/10 hover:border-cyber-cyan/40 hover:scale-[1.01] transition-all flex flex-col justify-between h-40">
            <div>
              <div className="flex items-center gap-2 text-cyber-cyan mb-2 font-mono">
                <BarChart2 className="w-5 h-5" />
                <h2 className="text-sm font-bold tracking-wider uppercase">My Stats</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Analyze compliance speed, trace action logs, and inspect audit trails.
              </p>
            </div>
            <span className="text-[9px] font-mono text-cyber-cyan hover:underline mt-4">INSPECT METRICS &rarr;</span>
          </GlassCard>
        </Link>
      </div>

      {/* Critical SLA Warning Alert */}
      <GlassCard className="p-5 border-cyber-magenta/20 bg-obsidian-950/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-cyber-magenta shrink-0" />
          <div className="space-y-1 font-mono">
            <h4 className="text-xs font-bold text-cyber-magenta uppercase tracking-wider">
              SLA INCIDENT TRACKER WARNING
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Verify compliance deadlines to avoid automated SLA inactivity/due notifications and escalations.
            </p>
          </div>
        </div>
        <Link
          to="/dept/maps"
          className="shrink-0 px-4 py-2 border border-cyber-magenta/40 hover:border-cyber-magenta/80 bg-cyber-magenta/10 hover:bg-cyber-magenta/20 text-cyber-magenta hover:text-white font-mono text-xs rounded transition-all"
        >
          INSPECT QUEUE
        </Link>
      </GlassCard>
    </div>
  );
}
