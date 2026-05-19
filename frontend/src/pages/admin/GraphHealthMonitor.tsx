import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  DashboardLayout,
  DashboardHeader,
  MetricGrid,
  StatCard,
  Panel,
  Alert,
} from '../../components/ui/cards';

export function GraphHealthMonitor() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/admin/graph-health')
      .then(res => {
        setHealth(res.data);
        setLoading(false);
      })
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePrune = async () => {
    try {
      const res = await apiClient.post('/api/admin/graph-health/prune');
      alert(res.data.message);
      // Refresh data
      const updated = await apiClient.get('/api/admin/graph-health');
      setHealth(updated.data);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading graph health data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!health) {
    return (
      <DashboardLayout>
        <Alert
          type="error"
          title="Failed to Load"
          message="Unable to fetch graph health metrics. Please refresh or contact support."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Graph Health Monitor"
        subtitle="Real-time monitoring and optimization of policy mapping architecture"
        action={
          <button
            onClick={handlePrune}
            className="btn-cyber-primary flex items-center gap-2 px-6 py-3"
          >
            <Zap size={18} />
            1-Click Prune Stale Edges
          </button>
        }
      />

      {/* Key Metrics */}
      <MetricGrid cols={4}>
        <StatCard
          label="Connectivity Score"
          value={`${health.connectivity_score}/100`}
          accentColor="blue"
          trend={{
            value: 12,
            isPositive: health.connectivity_score > 80,
          }}
        />
        <StatCard
          label="Stale Edges"
          value={health.stale_edges}
          accentColor="red"
          trend={{
            value: 5,
            isPositive: health.stale_edges < 10,
          }}
        />
        <StatCard
          label="Orphan Clauses"
          value={health.orphan_clauses}
          accentColor="cyan"
          trend={{
            value: 3,
            isPositive: health.orphan_clauses < 5,
          }}
        />
        <StatCard
          label="Policy Coverage"
          value={`${health.policy_coverage_rate}%`}
          accentColor="green"
          trend={{
            value: 8,
            isPositive: true,
          }}
        />
      </MetricGrid>

      {/* Detected Issues & Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Detected Issues" subtitle={`${health.issues.length} issue(s) found`}>
          {health.issues.length > 0 ? (
            <ul className="space-y-3">
              {health.issues.map((issue: any, idx: number) => (
                <div
                  key={idx}
                  className="glass-dark rounded-lg p-4 border border-red-500/30 bg-red-500/10"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wide">
                        {issue.type}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-8">
              <CheckCircle2 size={32} className="text-green-400 opacity-70" />
              <p className="text-muted-foreground ml-3">All systems operational</p>
            </div>
          )}
        </Panel>

        <Panel title="AI Suggestions" subtitle="Optimization recommendations">
          {health.suggestions.length > 0 ? (
            <ul className="space-y-3">
              {health.suggestions.map((suggestion: string, idx: number) => (
                <div
                  key={idx}
                  className="glass-dark rounded-lg p-4 border border-cyber-blue/30 bg-cyber-blue/10"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp size={18} className="text-cyber-blue shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{suggestion}</p>
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>No suggestions at this time</p>
            </div>
          )}
        </Panel>
      </div>

      {/* Graph Visualization Placeholder */}
      <Panel title="Policy Graph Visualization">
        <div className="flex flex-col items-center justify-center py-16 rounded-lg bg-gradient-to-br from-obsidian-700/50 to-obsidian-800/50 border border-cyber-cyan/10">
          <svg
            className="w-20 h-20 mb-4 text-cyber-cyan/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-lg font-semibold text-cyber-cyan">Interactive Graph Visualization</p>
          <p className="text-muted-foreground text-sm mt-2">
            D3.js / React Flow integration coming soon
          </p>
        </div>
      </Panel>
    </DashboardLayout>
  );
}