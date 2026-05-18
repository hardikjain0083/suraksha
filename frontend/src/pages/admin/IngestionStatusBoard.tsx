import { useState } from 'react';
import { apiClient } from '../../lib/api';

export function IngestionStatusBoard() {
  const [circulars] = useState<any[]>([]);
  
  const handleReparse = (id: string) => {
    apiClient.post(`/api/admin/ingestion/reparse/${id}`)
      .then(res => alert(res.data.message))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold font-mono">Ingestion Status Board</h1>
        <p className="text-gray-500 mt-2">Monitor circular parsing, fix OCR errors, and trigger manual re-parsing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="p-4 bg-gray-50 rounded border border-gray-200">
           <h3 className="text-xs font-bold text-gray-500 uppercase">Avg Processing Time</h3>
           <p className="text-3xl font-mono mt-1 text-gray-800">4.2s <span className="text-sm font-normal">/ page</span></p>
         </div>
         <div className="p-4 bg-green-50 rounded border border-green-200">
           <h3 className="text-xs font-bold text-green-800 uppercase">Success Rate</h3>
           <p className="text-3xl font-mono mt-1 text-green-900">92.4%</p>
         </div>
         <div className="p-4 bg-red-50 rounded border border-red-200">
           <h3 className="text-xs font-bold text-red-800 uppercase">Current Queue</h3>
           <p className="text-3xl font-mono mt-1 text-red-900">2 <span className="text-sm font-normal">Failed</span></p>
         </div>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-100 font-mono text-xs text-gray-500 uppercase tracking-wider">
             <tr>
               <th className="px-6 py-3 text-left">Circular ID</th>
               <th className="px-6 py-3 text-left">Title</th>
               <th className="px-6 py-3 text-left">Pages</th>
               <th className="px-6 py-3 text-left">Process Time</th>
               <th className="px-6 py-3 text-left">Status</th>
               <th className="px-6 py-3 text-left">Error Context</th>
               <th className="px-6 py-3 text-left">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200 text-sm">
             {circulars.map(c => (
               <tr key={c.id} className="hover:bg-gray-50">
                 <td className="px-6 py-4 font-mono text-blue-600">{c.id}</td>
                 <td className="px-6 py-4 font-bold">{c.title}</td>
                 <td className="px-6 py-4">{c.pages}</td>
                 <td className="px-6 py-4 font-mono text-gray-500">{c.time}</td>
                 <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     c.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 
                     c.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                   }`}>{c.status}</span>
                 </td>
                 <td className="px-6 py-4 text-xs font-mono text-gray-500">{c.error || '-'}</td>
                 <td className="px-6 py-4">
                   {c.status !== 'SUCCESS' && (
                     <button onClick={() => handleReparse(c.id)} className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-xs font-bold hover:bg-orange-200">
                       Re-parse
                     </button>
                   )}
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}