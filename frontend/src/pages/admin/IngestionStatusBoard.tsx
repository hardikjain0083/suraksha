import { useState } from 'react';
import { RotateCcw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  DashboardLayout,
  DashboardHeader,
  MetricGrid,
  StatCard,
  Panel,
} from '../../components/ui/cards';

export function IngestionStatusBoard() {
  const [circulars] = useState<any[]>([]);

  const handleReparse = (id: string) => {
    apiClient
      .post(`/api/admin/ingestion/reparse/${id}`)
      .then(res => alert(res.data.message))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  };

  const statusConfig: Record<string, { color: 'cyan' | 'blue' | 'green' | 'red' | 'magenta'; icon: React.ReactNode }> = {
    SUCCESS: { color: 'green', icon: <CheckCircle2 size={16} /> },
    PARTIAL: { color: 'magenta', icon: <AlertCircle size={16} /> },
    FAILED: { color: 'red', icon: <AlertCircle size={16} /> },
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Ingestion Status Board"
        subtitle="Monitor circular parsing, fix OCR errors, and trigger manual re-parsing"
      />

      {/* Key Metrics */}
      <MetricGrid cols={3}>
        <StatCard
          label="Avg Processing Time"
          value="4.2s/page"
          icon={<Clock size={24} />}
          accentColor="cyan"
        />
        <StatCard
          label="Success Rate"
          value="92.4%"
          icon={<CheckCircle2 size={24} />}
          accentColor="green"
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          label="Current Queue"
          value="2 Failed"
          icon={<AlertCircle size={24} />}
          accentColor="red"
          trend={{ value: 1, isPositive: false }}
        />
      </MetricGrid>

      {/* Circulars Table */}
      <Panel title="Ingestion Queue" subtitle="Real-time processing status">
        {circulars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 size={48} className="text-green-400/50 mb-4" />
            <p className="text-muted-foreground">No items in queue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-cyber-cyan/20 text-xs font-semibold text-cyber-cyan uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Circular ID</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-center">Pages</th>
                  <th className="px-4 py-3 text-center">Process Time</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Error Context</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-cyan/10">
                {circulars.map(c => {
                  const cfg = statusConfig[c.status] || statusConfig.FAILED;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-white/5 transition-colors text-sm"
                    >
                      <td className="px-4 py-3 font-mono text-cyber-blue">{c.id}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{c.title}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{c.pages}</td>
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                        {c.time}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {cfg.icon}
                          <span className="text-xs font-semibold">{c.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-xs truncate">
                        {c.error || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.status !== 'SUCCESS' && (
                          <button
                            onClick={() => handleReparse(c.id)}
                            className="btn-cyber-secondary inline-flex items-center gap-1 px-3 py-1 text-xs"
                          >
                            <RotateCcw size={14} />
                            Re-parse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}