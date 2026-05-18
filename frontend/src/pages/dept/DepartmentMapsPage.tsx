import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';

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

  const columns = ['OPEN', 'IN PROGRESS', 'PENDING VALIDATION', 'COMPLETE'];

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading MAPs...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My MAPs</h1>
        <button
          type="button"
          onClick={() => navigate('/dept')}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>

      {maps.length === 0 ? (
        <p className="text-gray-500">No MAPs assigned. Run seed_maps.py or ask admin to route a MAP.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-150px)]">
          {columns.map((column) => (
            <div
              key={column}
              className="bg-gray-50 rounded-lg p-4 flex flex-col border border-gray-200"
            >
              <h2 className="font-bold text-gray-700 mb-4">{column}</h2>
              <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {maps
                  .filter((m) => m.status === column)
                  .map((map) => (
                    <div
                      key={map.id}
                      className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-pointer hover:shadow-md"
                      onClick={() => navigate(`/dept/maps/${map.id}`)}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold">{map.id}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(map.priority)}`}
                        >
                          {map.priority}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium mb-2 truncate">{map.title}</h3>
                      <div className="text-xs text-gray-500 mb-2">Deadline: {map.deadline}</div>
                      <div className="text-xs text-gray-500">
                        Evidence: {map.evidence.uploaded}/{map.evidence.required}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
