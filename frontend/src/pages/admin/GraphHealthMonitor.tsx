import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiClient } from '../../lib/api';

export function GraphHealthMonitor() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/api/admin/graph-health')
      .then(res => setHealth(res.data))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  }, []);

  const handlePrune = () => {
    apiClient.post('/api/admin/graph-health/prune')
      .then(res => alert(res.data.message))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  };

  if (!health) return <div className="p-8">Loading graph health...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold font-mono">Graph Health Monitor</h1>
        <button onClick={handlePrune} className="bg-orange-600 text-white px-4 py-2 rounded shadow font-medium hover:bg-orange-700">1-Click Prune Stale Edges</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-500 font-bold">Connectivity Score</div>
          <div className="text-3xl font-bold mt-1">{health.connectivity_score}/100</div>
        </div>
        <div className="p-4 bg-white rounded shadow border-l-4 border-red-500">
          <div className="text-sm text-gray-500 font-bold">Stale Edges</div>
          <div className="text-3xl font-bold mt-1 text-red-600">{health.stale_edges}</div>
        </div>
        <div className="p-4 bg-white rounded shadow border-l-4 border-yellow-500">
          <div className="text-sm text-gray-500 font-bold">Orphan Clauses</div>
          <div className="text-3xl font-bold mt-1 text-yellow-600">{health.orphan_clauses}</div>
        </div>
        <div className="p-4 bg-white rounded shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-500 font-bold">Policy Coverage Rate</div>
          <div className="text-3xl font-bold mt-1 text-green-600">{health.policy_coverage_rate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Detected Issues</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {health.issues.map((i: any, idx: number) => (
                <li key={idx} className="p-3 bg-red-50 text-red-800 text-sm font-mono rounded border border-red-200">
                  {i.type.toUpperCase()}: {i.description}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>AI Suggestions</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {health.suggestions.map((s: string, idx: number) => (
                <li key={idx} className="p-3 bg-blue-50 text-blue-800 text-sm font-mono rounded border border-blue-200">
                  SUGGESTION: {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 font-mono text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <p>Interactive Graph Visualization Canvas</p>
          <p className="text-sm opacity-50 mt-2">D3.js / React Flow integration coming soon</p>
        </div>
      </div>
    </div>
  );
}