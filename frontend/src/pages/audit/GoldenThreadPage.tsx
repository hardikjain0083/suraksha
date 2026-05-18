import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const nodes = [
  { id: 'c1', type: 'CIRCULAR', label: 'RBI/2026-ABC', badge: 'Ingested', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'cl1', type: 'CLAUSE', label: 'Clause 1.1', badge: 'Extracted', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'g1', type: 'GAP', label: 'AES-256 missing', badge: 'Detected', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'm1', type: 'MAP', label: 'MAP-2026-013', badge: 'Active', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'd1', type: 'ROUTING', label: 'IT Dept (Emp 01)', badge: 'Assigned', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { id: 'e1', type: 'EVIDENCE', label: 'fw-config.json', badge: 'Uploaded', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'v1', type: 'VALIDATION', label: 'System Check', badge: 'Passed', color: 'bg-green-100 text-green-800 border-green-300' },
];

export function GoldenThreadPage() {
  const { map_id } = useParams();
  const [visibleNodes, setVisibleNodes] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleNodes(v => (v < nodes.length ? v + 1 : v));
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 font-mono">
      <div className="flex-1 p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Golden Thread: {map_id || 'MAP-2026-013'}</h1>
          <button className="bg-gray-800 text-white px-4 py-2 text-sm rounded shadow hover:bg-gray-700">Export PDF Report</button>
        </div>

        <div className="absolute top-1/2 left-10 right-10 flex items-center pr-10">
          {nodes.map((node, i) => (
            <React.Fragment key={node.id}>
              <div 
                className={`transform transition-all duration-500 flex flex-col items-center gap-2 cursor-pointer
                  ${i < visibleNodes ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
                `}
                onClick={() => setSelectedNode(node)}
                style={{ zIndex: 10 }}
              >
                <span className="text-[10px] font-bold text-gray-400">{node.type}</span>
                <div className={`p-4 rounded-lg border-2 shadow-md hover:shadow-lg transition-shadow w-32 text-center bg-white ${selectedNode?.id === node.id ? 'ring-4 ring-black' : ''}`}>
                  <div className="font-bold text-sm text-gray-800 truncate">{node.label}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${node.color}`}>{node.badge}</span>
              </div>
              
              {i < nodes.length - 1 && (
                <div className={`h-1 flex-1 mx-2 bg-gray-300 transition-all duration-1000 origin-left
                   ${i < visibleNodes - 1 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}
                `}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="w-1/3 bg-white border-l border-gray-200 p-6 shadow-xl overflow-y-auto animate-in slide-in-from-right">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
             <h2 className="text-xl font-bold">{selectedNode.type} Details</h2>
             <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-black">✖</button>
          </div>
          
          <div className="space-y-6 text-sm">
             <div>
               <h3 className="font-bold text-gray-500 mb-1">IDENTIFIER</h3>
               <p className="bg-gray-50 p-2 rounded border border-gray-200 font-bold">{selectedNode.label}</p>
             </div>
             <div>
               <h3 className="font-bold text-gray-500 mb-1">STATUS</h3>
               <span className={`px-2 py-1 rounded text-xs border ${selectedNode.color}`}>{selectedNode.badge}</span>
             </div>
             
             <div>
               <h3 className="font-bold text-gray-500 mb-1">LINKED AUDIT LOGS</h3>
               <div className="space-y-2">
                 <div className="p-2 border rounded bg-gray-50 text-xs">
                   <div className="text-gray-500">2026-05-17 10:00:00 UTC</div>
                   <div className="font-bold text-blue-600">sys_auto</div>
                   <div>Created node {selectedNode.id}</div>
                   <div className="mt-1 text-gray-400 break-all text-[10px]">Hash: e3b0c442...</div>
                 </div>
               </div>
             </div>
             
             <button className="w-full py-2 border-2 border-gray-800 rounded font-bold hover:bg-gray-100 transition-colors">
               Verify Block Integrity
             </button>
          </div>
        </div>
      )}
    </div>
  );
}