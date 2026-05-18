import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuditPortalPage() {
  const navigate = useNavigate();
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const handleVerify = () => {
    setVerifyStatus('verifying');
    setTimeout(() => setVerifyStatus('verified'), 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-mono">Audit Logger Home</h1>
        <div className="flex gap-2">
           <button onClick={handleVerify} className="px-4 py-2 bg-purple-600 text-white rounded font-medium shadow hover:bg-purple-700">Verify Chain Integrity</button>
           <button className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
             Export
           </button>
        </div>
      </div>

      {verifyStatus === 'verifying' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800"></div>
          <span className="font-mono">Computing hash chain... Comparing stored hashes...</span>
        </div>
      )}
      {verifyStatus === 'verified' && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-mono font-bold">Chain integrity: VERIFIED ✅</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Audit Events (24h)</h3>
          <p className="text-3xl font-bold font-mono mt-2 cursor-pointer text-blue-600 hover:underline" onClick={() => navigate('/audit/logs')}>1,048</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">MAP Completions</h3>
          <p className="text-3xl font-bold font-mono mt-2">42</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Validation Overrides</h3>
          <p className="text-3xl font-bold font-mono text-orange-600 mt-2">3</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg Behavioral Score</h3>
          <p className="text-3xl font-bold font-mono text-green-600 mt-2">91.4</p>
        </div>
      </div>

      <div className="bg-white border rounded shadow-sm p-4">
        <h2 className="font-bold text-lg mb-4 border-b pb-2">Recent Critical Actions</h2>
        <div className="space-y-3">
          <div className="flex gap-4 items-center p-3 bg-orange-50 border border-orange-100 rounded text-sm font-mono">
            <span className="text-gray-500">2026-05-17 14:02:11</span>
            <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded text-xs font-bold">OVERRIDE</span>
            <span className="text-gray-800">Compliance Officer manually approved ev_105 with confidence 0.20</span>
          </div>
          <div className="flex gap-4 items-center p-3 bg-green-50 border border-green-100 rounded text-sm font-mono">
            <span className="text-gray-500">2026-05-17 13:45:00</span>
            <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded text-xs font-bold">MAP_COMPLETE</span>
            <span className="text-gray-800">IT Head completed MAP-2026-011. Re-auth score: 95</span>
          </div>
          <div className="flex gap-4 items-center p-3 bg-red-50 border border-red-100 rounded text-sm font-mono">
            <span className="text-gray-500">2026-05-17 11:20:44</span>
            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs font-bold">ESCALATION</span>
            <span className="text-gray-800">MAP-2026-015 escalated to CISO due to missed critical deadline</span>
          </div>
        </div>
      </div>
    </div>
  );
}