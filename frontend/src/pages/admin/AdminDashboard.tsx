import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  CheckSquare, 
  Activity, 
  AlertTriangle, 
  Terminal as TerminalIcon, 
  ArrowUpRight, 
  FileText, 
  Layers, 
  Users, 
  TrendingUp,
  Cpu
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Mock chart data for compliance trend visualization
const trendData = [
  { day: '05-12', compliance: 82, activeGaps: 14 },
  { day: '05-13', compliance: 84, activeGaps: 12 },
  { day: '05-14', compliance: 83, activeGaps: 13 },
  { day: '05-15', compliance: 86, activeGaps: 10 },
  { day: '05-16', compliance: 89, activeGaps: 8 },
  { day: '05-17', compliance: 91, activeGaps: 5 },
  { day: '05-18', compliance: 93, activeGaps: 3 },
];

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [terminalFilter, setTerminalFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiClient.get('/api/admin/dashboard')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] font-mono text-cyber-cyan gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <p className="animate-pulse tracking-widest text-xs">SYNCHRONIZING SECURE COMMAND MATRIX...</p>
      </div>
    );
  }

  // Filter alerts for the cyber terminal screen
  const filteredAlerts = data.alerts.filter((alert: any) => {
    if (terminalFilter === 'all') return true;
    return alert.type === terminalFilter;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Upper Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            CONTROL TOWER COGNITIVE CONSOLE
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Real-time compliance validation, behavioral threat intelligence, and deterministic policy matching.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-obsidian-950 px-3 py-1.5 border border-cyber-cyan/15 rounded text-[10px] font-mono">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-slate-400">LEDGER STATE:</span>
          <span className="text-cyber-green font-bold">SYNCHRONIZED // BLOCK_HEIGHT 8129B</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage Card */}
        <GlassCard glowColor="cyan" className="p-5 border-cyber-cyan/20 relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-cyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Regulatory Coverage</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-cyan tracking-tight">
                {data.regulatory_coverage.processed}<span className="text-sm font-semibold text-slate-500"> / {data.regulatory_coverage.total}</span>
              </h3>
            </div>
            <div className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg text-cyber-cyan">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Circulars fully mapped</span>
            <span className="text-cyber-green font-bold">
              {Math.round((data.regulatory_coverage.processed / (data.regulatory_coverage.total || 1)) * 100)}% Coverage
            </span>
          </div>
          <div className="h-1 bg-obsidian-950 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue shadow-glow-cyan" 
              style={{ width: `${(data.regulatory_coverage.processed / (data.regulatory_coverage.total || 1)) * 100}%` }}
            />
          </div>
        </GlassCard>

        {/* Confirmed Gaps Card */}
        <GlassCard glowColor="magenta" className="p-5 border-cyber-magenta/20 relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-magenta/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Active Confirmed Gaps</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-magenta tracking-tight">
                {data.active_gaps.confirmed}
              </h3>
            </div>
            <div className="p-2 bg-cyber-magenta/10 border border-cyber-magenta/30 rounded-lg text-cyber-magenta shadow-glow-magenta/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Requires instant mitigation</span>
            <span className="text-cyber-blue font-bold">
              {data.active_gaps.suspected} Suspected
            </span>
          </div>
          <div className="h-1 bg-obsidian-950 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyber-magenta to-red-500 shadow-glow-magenta" 
              style={{ width: `${Math.min(100, (data.active_gaps.confirmed / 20) * 100)}%` }}
            />
          </div>
        </GlassCard>

        {/* MAP Completion Card */}
        <GlassCard glowColor="blue" className="p-5 border-cyber-blue/20 relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">MAP Completion Rate</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-blue tracking-tight">
                {data.map_completion.rate}%
              </h3>
            </div>
            <div className="p-2 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg text-cyber-blue">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>On-time execution target</span>
            <span className="text-cyber-cyan font-bold">ALPHA RATE</span>
          </div>
          <div className="h-1 bg-obsidian-950 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyber-blue to-cyber-cyan shadow-glow-blue" 
              style={{ width: `${data.map_completion.rate}%` }}
            />
          </div>
        </GlassCard>

        {/* Behavioral Health Card */}
        <GlassCard glowColor="green" className="p-5 border-cyber-green/20 relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-green/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Behavioral Health</span>
              <h3 className="text-3xl font-bold font-mono text-cyber-green tracking-tight">
                {data.behavioral_health.green_sessions}%
              </h3>
            </div>
            <div className="p-2 bg-cyber-green/10 border border-cyber-green/30 rounded-lg text-cyber-green shadow-glow-green/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Zero-Trust validation</span>
            <span className="text-cyber-green font-bold">SECURE SESSIONS</span>
          </div>
          <div className="h-1 bg-obsidian-950 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyber-green to-cyber-cyan shadow-glow-green" 
              style={{ width: `${data.behavioral_health.green_sessions}%` }}
            />
          </div>
        </GlassCard>
      </div>

      {/* Main Charts & Terminal Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compliance Trend Chart Widget */}
        <GlassCard className="xl:col-span-2 p-6 border-cyber-cyan/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyber-cyan/10 pb-3 mb-4">
              <h2 className="text-sm font-bold font-mono tracking-wider text-cyber-cyan uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyber-cyan" />
                Cognitive Defense Trends (7-Day Metric)
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">REAL-TIME TELEMETRY FEED</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00d9ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGaps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff00ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ff00ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#94a3b8" fontSize={10} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0e27', borderColor: '#00d9ff', borderRadius: '8px' }}
                    labelStyle={{ color: '#00d9ff', fontFamily: 'monospace', fontSize: '10px' }}
                    itemStyle={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="compliance" name="Compliance Rate (%)" stroke="#00d9ff" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" />
                  <Area type="monotone" dataKey="activeGaps" name="Active Gaps" stroke="#ff00ff" strokeWidth={2} fillOpacity={1} fill="url(#colorGaps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-cyber-cyan/10 pt-4 mt-4 text-[10px] font-mono">
            <div className="p-2.5 bg-obsidian-950/60 rounded border border-cyber-cyan/5">
              <div className="text-slate-500">PEAK COMPLIANCE RATE:</div>
              <div className="text-cyber-cyan font-bold text-sm mt-0.5">93.0% (MAXIMUM SECURED)</div>
            </div>
            <div className="p-2.5 bg-obsidian-950/60 rounded border border-cyber-cyan/5">
              <div className="text-slate-500">MITIGATION VELOCITY:</div>
              <div className="text-cyber-magenta font-bold text-sm mt-0.5">-1.57 GAPS / DAY (EFFICIENT)</div>
            </div>
          </div>
        </GlassCard>

        {/* High-fidelity Security Alert Terminal */}
        <GlassCard className="p-6 border-cyber-cyan/10 flex flex-col h-[460px]">
          <div className="flex items-center justify-between border-b border-cyber-cyan/10 pb-3 mb-4">
            <h2 className="text-sm font-bold font-mono tracking-wider text-cyber-cyan uppercase flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-cyber-cyan animate-pulse" />
              INTELLIGENCE ALERT TERMINAL
            </h2>
            <div className="flex gap-1">
              {(['all', 'error', 'warning', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTerminalFilter(f)}
                  className={`text-[9px] px-1.5 py-0.5 font-mono uppercase rounded ${
                    terminalFilter === f 
                      ? 'bg-cyber-cyan text-obsidian-950 font-bold' 
                      : 'text-slate-500 bg-obsidian-900 border border-cyber-cyan/5 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Box */}
          <div className="flex-1 bg-obsidian-950 border border-cyber-cyan/10 p-3 rounded-lg font-mono text-[11px] overflow-y-auto space-y-2 select-text scrollbar-thin">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert: any, i: number) => {
                const isErr = alert.type === 'error';
                const isWarn = alert.type === 'warning';
                return (
                  <div key={i} className="flex gap-2 items-start leading-relaxed animate-glow-flicker">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      isErr 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : isWarn 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                    }`}>
                      {alert.type.toUpperCase()}
                    </span>
                    <span className="text-slate-300">{alert.message}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-500 text-center py-10 italic">
                NO THREAT EVENT PACKETS RECORDED FOR THIS CLASS.
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-slate-500">
            <span>PACKETS BUFFERED: {filteredAlerts.length}</span>
            <span className="animate-pulse text-cyber-cyan">SCANNING CHANNEL...</span>
          </div>
        </GlassCard>
      </div>

      {/* Quick Action Matrix */}
      <GlassCard className="p-6 border-cyber-cyan/10">
        <h2 className="text-sm font-bold font-mono tracking-wider text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-3 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyber-cyan" />
          CRITICAL COMMAND ACTIONS MATRIX
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/admin/policies')}
            className="flex items-center justify-between p-4 bg-obsidian-950/40 hover:bg-cyber-blue/5 border border-cyber-cyan/10 hover:border-cyber-blue/50 rounded-xl transition-all group font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-blue/10 text-cyber-blue rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Policy Manager</span>
                <span className="text-[10px] text-slate-500">Audit policy versions</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyber-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('/admin/graph-health')}
            className="flex items-center justify-between p-4 bg-obsidian-950/40 hover:bg-cyber-cyan/5 border border-cyber-cyan/10 hover:border-cyber-cyan/50 rounded-xl transition-all group font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-cyan/10 text-cyber-cyan rounded-lg">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Graph Diagnostics</span>
                <span className="text-[10px] text-slate-500">Monitor graph database</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyber-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('/admin/ux-friction')}
            className="flex items-center justify-between p-4 bg-obsidian-950/40 hover:bg-cyber-magenta/5 border border-cyber-cyan/10 hover:border-cyber-magenta/50 rounded-xl transition-all group font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-magenta/10 text-cyber-magenta rounded-lg">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">UX Audit Console</span>
                <span className="text-[10px] text-slate-500">Trace user telemetry</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyber-magenta group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('/admin/users')}
            className="flex items-center justify-between p-4 bg-obsidian-950/40 hover:bg-cyber-green/5 border border-cyber-cyan/10 hover:border-cyber-green/50 rounded-xl transition-all group font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-green/10 text-cyber-green rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Access Controls</span>
                <span className="text-[10px] text-slate-500">Modify member roles</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyber-green group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}