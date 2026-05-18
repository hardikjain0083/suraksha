import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';

export function MyStatsPage() {
  const [stats, setStats] = useState({
    completion_rate: 0,
    on_time_rate: 0,
    avg_evidence_quality: 0,
    total_maps: 0,
    completed_maps: 0,
  });

  useEffect(() => {
    apiClient.get('/api/dept/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dept" className="text-sm text-blue-600 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-3xl font-bold">My Stats</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Completion Rate', value: `${stats.completion_rate}%` },
          { label: 'On-Time Performance', value: `${stats.on_time_rate}%` },
          { label: 'Evidence Quality', value: `${stats.avg_evidence_quality}%` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-canara-primary mt-2">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        {stats.completed_maps} of {stats.total_maps} assigned MAPs completed.
      </p>
    </div>
  );
}
