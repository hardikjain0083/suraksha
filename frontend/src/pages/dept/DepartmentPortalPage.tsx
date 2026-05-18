import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Department Portal</h1>
          <p className="text-muted-foreground mt-1">
            Good morning, {displayName}. Review assigned MAPs and submit evidence.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-3 h-3 rounded-full bg-green-500" title="Session active" />
          <span>{user?.department || 'Department'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-blue-800 font-semibold text-sm">Assigned MAPs</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total_maps}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <h3 className="text-green-800 font-semibold text-sm">Completion Rate</h3>
          <p className="text-2xl font-bold text-green-900">{stats.completion_rate}%</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <h3 className="text-amber-800 font-semibold text-sm">On-Time Rate</h3>
          <p className="text-2xl font-bold text-amber-900">{stats.on_time_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/dept/maps"
          className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-canara-primary">My MAPs</h2>
          <p className="text-sm text-gray-500 mt-2">Kanban board — open, in progress, validation, complete</p>
        </Link>
        {user?.role === 'department_head' && (
          <Link
            to="/dept/team"
            className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-canara-primary">Team Board</h2>
            <p className="text-sm text-gray-500 mt-2">Department-wide MAP workload</p>
          </Link>
        )}
        <Link
          to="/dept/stats"
          className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-canara-primary">My Stats</h2>
          <p className="text-sm text-gray-500 mt-2">Completion and performance metrics</p>
        </Link>
      </div>

      <div className="p-4 border rounded-lg border-red-200 bg-red-50">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="font-semibold text-red-900">MAP-2026-013: Update Firewall Config</span>
          <span className="text-red-700 text-sm">Check deadline in My MAPs</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Link
            to="/dept/maps/MAP-2026-013"
            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            View MAP
          </Link>
          <Link
            to="/dept/maps"
            className="px-3 py-1.5 bg-white text-red-700 border border-red-300 rounded text-sm hover:bg-red-50"
          >
            All MAPs
          </Link>
        </div>
      </div>
    </div>
  );
}
