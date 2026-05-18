import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiClient } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/api/admin/dashboard')
      .then(res => setData(res.data))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  }, []);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-mono border-b pb-4">Control Tower (Admin Dashboard)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Regulatory Coverage</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.regulatory_coverage.processed}/{data.regulatory_coverage.total}</div>
            <div className="text-xs text-gray-400 mt-1">Circulars mapped</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Gaps (Confirmed)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{data.active_gaps.confirmed}</div>
            <div className="text-xs text-gray-400 mt-1">{data.active_gaps.suspected} suspected</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">MAP Completion</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data.map_completion.rate}%</div>
            <div className="text-xs text-gray-400 mt-1">On-time rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Behavioral Health</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.behavioral_health.green_sessions}%</div>
            <div className="text-xs text-gray-400 mt-1">Green sessions today</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Alert Feed</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.alerts.map((alert: any, i: number) => (
                <li key={i} className="flex gap-2 items-center text-sm font-mono p-2 bg-gray-50 rounded">
                  <span className={`px-2 py-0.5 rounded text-white text-xs ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                    {alert.type.toUpperCase()}
                  </span>
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <button className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium rounded text-left" onClick={() => navigate('/admin/policies')}>Manage Policies</button>
            <button className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium rounded text-left" onClick={() => navigate('/admin/graph-health')}>View Graph Health</button>
            <button className="p-3 bg-orange-50 hover:bg-orange-100 text-orange-800 font-medium rounded text-left" onClick={() => navigate('/admin/ux-friction')}>UX Friction Dashboard</button>
            <button className="p-3 bg-green-50 hover:bg-green-100 text-green-800 font-medium rounded text-left" onClick={() => navigate('/admin/users')}>User Management</button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}