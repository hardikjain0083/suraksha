import React, { useState } from 'react';

const mockLogs = [
  { id: 'al_091', time: '2026-05-17 14:02:11', user: 'c.officer', action: 'VALIDATION_OVERRIDE', target: 'ev_105', dept: 'Compliance', score: 94, risk: 'High', hash: 'e3b0c44298fc1c14...' },
  { id: 'al_090', time: '2026-05-17 13:45:00', user: 'it.head', action: 'MAP_COMPLETE', target: 'MAP-2026-011', dept: 'IT', score: 95, risk: 'Medium', hash: '8f434346648f6b96...' },
  { id: 'al_089', time: '2026-05-17 13:40:22', user: 'sys_auto', action: 'VALIDATION_PASS', target: 'ev_101', dept: 'System', score: '-', risk: 'Low', hash: 'a12ba24439c2f6d...' },
  { id: 'al_088', time: '2026-05-17 11:20:44', user: 'sys_auto', action: 'ESCALATION', target: 'MAP-2026-015', dept: 'System', score: '-', risk: 'Critical', hash: '9b8ce491b40dc8...' },
];

export function AuditLogsPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold font-mono border-b pb-4">Audit Log Ledger</h1>
      
      <div className="flex gap-2 text-sm bg-gray-50 p-2 rounded border">
        <input type="date" className="border rounded px-2" />
        <input type="text" placeholder="User ID" className="border rounded px-2" />
        <select className="border rounded px-2">
          <option>All Actions</option>
          <option>MAP_COMPLETE</option>
          <option>VALIDATION_OVERRIDE</option>
        </select>
        <div className="flex-1"></div>
        <input type="text" placeholder="Search hash or payload..." className="border rounded px-2 w-64" />
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-100 font-mono text-xs text-gray-500">
             <tr>
               <th className="px-4 py-3 text-left">Timestamp (UTC)</th>
               <th className="px-4 py-3 text-left">User</th>
               <th className="px-4 py-3 text-left">Action</th>
               <th className="px-4 py-3 text-left">Target</th>
               <th className="px-4 py-3 text-left">bScore</th>
               <th className="px-4 py-3 text-left">Hash Chain</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200 font-mono text-sm">
             {mockLogs.map(log => (
               <React.Fragment key={log.id}>
                 <tr className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => toggleRow(log.id)}>
                   <td className="px-4 py-3 text-gray-700">{log.time}</td>
                   <td className="px-4 py-3 text-blue-600 font-bold">{log.user}</td>
                   <td className="px-4 py-3"><span className="bg-gray-200 px-2 py-0.5 rounded text-xs truncate max-w-[120px] block">{log.action}</span></td>
                   <td className="px-4 py-3 text-gray-600">{log.target}</td>
                   <td className="px-4 py-3">
                     {log.score !== '-' ? <span className="text-green-600 font-bold">{log.score}</span> : <span className="text-gray-400">-</span>}
                   </td>
                   <td className="px-4 py-3 flex items-center justify-between">
                     <span className="text-gray-400 text-xs">{log.hash}</span>
                     <button className="text-xs border px-2 py-1 rounded bg-white hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); alert('Hash validates to previous block ✔️'); }}>Check</button>
                   </td>
                 </tr>
                 {expandedRow === log.id && (
                   <tr className="bg-gray-50 border-b">
                     <td colSpan={6} className="px-6 py-4">
                       <div className="grid grid-cols-2 gap-4 text-xs">
                         <div>
                           <h4 className="font-bold text-gray-500 mb-1">STATE CHANGE</h4>
                           <pre className="bg-white p-2 border rounded overflow-x-auto">
{`"validation_status": {
  "old": "fail",
  "new": "pass"
},
"reason": "False positive date check"`}
                           </pre>
                         </div>
                         <div>
                           <h4 className="font-bold text-gray-500 mb-1">PROVENANCE CONTEXT</h4>
                           <pre className="bg-white p-2 border rounded text-gray-600 space-y-1">
<div>Network: 192.168.1.45 (VPN)</div>
<div>Dept ID: Compliance</div>
<div>MAP Ref: MAP-2026-024</div>
<div>Full Hash: <span className="break-all">{log.hash}fc1c14...</span></div>
                           </pre>
                         </div>
                       </div>
                     </td>
                   </tr>
                 )}
               </React.Fragment>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}