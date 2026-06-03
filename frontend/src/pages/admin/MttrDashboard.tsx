import { useState, useEffect } from 'react';
import { Shield, Settings, AlertCircle, CheckCircle, TrendingUp, Clock, Hourglass } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';
import { apiClient } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MttrDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/maps/mttr/metrics')
      .then(res => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading MTTR metrics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading remediation metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center text-slate-400">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p>Failed to load MTTR analytics. Please ensure database is seeded.</p>
      </div>
    );
  }

  // SLA gauges helpers
  const getSlaColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 75) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-obsidian-800 pb-4">
        <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-blue to-purple-500">
          Remediation Analytics & MTTR
        </h1>
        <p className="text-slate-400 mt-2">
          Monitor SLA compliance rates and Mean Time To Remediation (MTTR) comparisons between cyber-security patches and operational guidelines.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-obsidian-950/20 border-obsidian-850">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 flex items-center gap-1.5"><Shield size={14} className="text-cyber-cyan" /> Security MTTR</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-cyber-cyan">{metrics.security_mttr_hours} Hrs</div>
            <span className="text-[10px] text-slate-500 block mt-1">Target: {metrics.targets.security_target_hours} Hrs (3 Days)</span>
          </CardContent>
        </Card>
        
        <Card className="bg-obsidian-950/20 border-obsidian-850">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 flex items-center gap-1.5"><Settings size={14} className="text-purple-400" /> Operational MTTR</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-purple-400">{metrics.operational_mttr_hours} Hrs</div>
            <span className="text-[10px] text-slate-500 block mt-1">Target: {metrics.targets.operational_target_hours} Hrs (15 Days)</span>
          </CardContent>
        </Card>

        <Card className="bg-obsidian-950/20 border-obsidian-850">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 flex items-center gap-1.5"><Clock size={14} className="text-green-400" /> Security SLA Adherence</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono ${getSlaColor(metrics.security_sla_rate)}`}>
              {metrics.security_sla_rate}%
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">{metrics.security_sla_met}/{metrics.completed_security} MAP tasks met SLA</span>
          </CardContent>
        </Card>

        <Card className="bg-obsidian-950/20 border-obsidian-850">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 flex items-center gap-1.5"><Hourglass size={14} className="text-orange-400" /> Operational SLA Adherence</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono ${getSlaColor(metrics.operational_sla_rate)}`}>
              {metrics.operational_sla_rate}%
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">{metrics.operational_sla_met}/{metrics.completed_operational} MAP tasks met SLA</span>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-obsidian-950/10 border border-obsidian-850 rounded-xl p-5 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Compliance Load</span>
          <div className="text-4xl font-bold font-mono text-foreground">{metrics.total_active_maps}</div>
          <p className="text-xs text-slate-400 mt-2">Active Multi-Agent Remediation Plans registered in the ledger.</p>
        </div>
        <div className="bg-obsidian-950/10 border border-obsidian-850 rounded-xl p-5 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Active Gaps / Remediation</span>
          <div className="text-4xl font-bold font-mono text-orange-500">{metrics.open_maps}</div>
          <p className="text-xs text-slate-400 mt-2">Tasks currently in "open" or "in_progress" status.</p>
        </div>
        <div className="bg-obsidian-950/10 border border-obsidian-850 rounded-xl p-5 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">SLA Breaches</span>
          <div className="text-4xl font-bold font-mono text-red-500">{metrics.overdue_maps}</div>
          <p className="text-xs text-slate-400 mt-2">Active tasks currently exceeding their regulatory deadlines.</p>
        </div>
      </div>

      {/* Monthly MTTR Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="md:col-span-2 glass-dark rounded-xl p-6 border border-obsidian-850 bg-obsidian-950/20">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-cyber-cyan" />
            <div>
              <h3 className="font-bold text-sm">Monthly MTTR Trend Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">Remediation time improvements (in Hours) over previous months</p>
            </div>
          </div>

          <div className="w-full h-[300px] text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Legend />
                <Line type="monotone" dataKey="security_mttr" name="Security MTTR" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="operational_mttr" name="Operational MTTR" stroke="#a855f7" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Compliance Targets Meter */}
        <div className="glass-dark rounded-xl p-6 border border-obsidian-850 bg-obsidian-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-green-400" />
              <h3 className="font-bold text-sm">Remediation Targets & SLAs</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              To comply with the bank's strict internal risk directives, security alerts must be patched and closed within 72 hours, while operational revisions must settle within 15 days.
            </p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400">Security SLA Met (72h)</span>
                  <span className="text-cyber-cyan">{metrics.security_sla_rate}%</span>
                </div>
                <div className="w-full h-2.5 bg-obsidian-900 border border-obsidian-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyber-cyan rounded-full transition-all duration-500" 
                    style={{ width: `${metrics.security_sla_rate}%` }} 
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400">Operational SLA Met (15d)</span>
                  <span className="text-purple-400">{metrics.operational_sla_rate}%</span>
                </div>
                <div className="w-full h-2.5 bg-obsidian-900 border border-obsidian-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${metrics.operational_sla_rate}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-obsidian-850 pt-4 mt-6">
            <span className="text-[10px] text-slate-500 leading-normal block">
              💡 Automated routing and dynamic priority scoring prioritize high-risk gaps first, significantly lowering overall MTTR exposure.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
