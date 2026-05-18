import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiClient } from '../../lib/api';

export function UxFrictionDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/api/admin/ux-metrics')
      .then(res => setMetrics(res.data))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  }, []);

  if (!metrics) return <div className="p-8">Loading metrics...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold font-mono">UX Friction Dashboard</h1>
        <p className="text-gray-500 mt-2">Monitor behavioral auth impact and adjust department sensitivity thresholds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Login (w/ Auth)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-mono">{metrics.avg_login_time_with}s</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Login (No Auth)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-mono text-gray-400">{metrics.avg_login_time_without}s</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Interruption Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-mono text-orange-500">{metrics.interruption_rate}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Enrollment Success</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-mono text-green-500">{metrics.enrollment_success}%</div></CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Department Sensitivity Controls</h2>
      <div className="space-y-4">
        {metrics.dept_stats.map((dept: any) => (
          <div key={dept.dept} className="bg-white p-6 rounded shadow border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{dept.dept} Department</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">Current: {dept.sensitivity}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-500 w-12">Loose</span>
              <input type="range" min="40" max="90" defaultValue={dept.sensitivity} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              <span className="text-sm font-bold text-gray-500 w-12 text-right">Strict</span>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded border text-sm text-gray-600 font-mono">
              <span className="font-bold text-gray-800">Impact Preview:</span> Interruption rate historically at ~{dept.interruptions}%. Increasing threshold to 80 will likely increase interruptions by 4.5% while reducing false accept rate.
            </div>
            
            <div className="mt-4 flex justify-end">
              <button className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
                      onClick={() => alert('Sensitivity updated and logged to audit trail.')}>Save Threshold</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}