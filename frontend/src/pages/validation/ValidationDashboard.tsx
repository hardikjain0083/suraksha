import React, { useState } from 'react';
import { ValidationBadge } from '../../components/common/ValidationBadge';

const mockQueue = [
  { id: 'ev_101', mapId: 'MAP-2026-042', type: 'PDF Document', fileName: 'vuln-scan-q2-2026.pdf', uploader: 'Emp 045', uploadedAt: '10 mins ago', status: 'pass', confidence: 0.89, details: [{name: 'File Type Check', status: 'pass'}, {name: 'Date Check', status: 'pass'}, {name: 'Keyword Presence', status: 'pass'}] },
  { id: 'ev_102', mapId: 'MAP-2026-015', type: 'Config File (JSON)', fileName: 'invalid-config.json', uploader: 'Emp 012', uploadedAt: '15 mins ago', status: 'fail', confidence: 0.30, reason: 'Invalid JSON format (line 4)', details: [{name: 'JSON Format', status: 'fail', reason: 'Syntax error line 4'}, {name: 'Schema Check', status: 'fail', reason: 'Not evaluated due to format error'}] },
  { id: 'ev_103', mapId: 'MAP-2026-033', type: 'Screenshot', fileName: 'router-setting.png', uploader: 'Emp 008', uploadedAt: '1 hour ago', status: 'manual_review', confidence: 0.65, reason: 'EXIF timestamp missing', details: [{name: 'Resolution Check', status: 'pass'}, {name: 'Timestamp Auth', status: 'fail', reason: 'Missing EXIF'}] },
  { id: 'ev_104', mapId: 'MAP-2026-091', type: 'PDF Document', fileName: 'pentest-report-q2-2026.pdf', uploader: 'Emp 022', uploadedAt: '2 hours ago', status: 'pass', confidence: 0.91, details: [{name: 'File Type Check', status: 'pass'}, {name: 'Keyword Check', status: 'pass'}] },
  { id: 'ev_105', mapId: 'MAP-2026-024', type: 'PDF Document', fileName: 'old-scan.pdf', uploader: 'Emp 018', uploadedAt: '3 hours ago', status: 'fail', confidence: 0.20, reason: 'Date before MAP creation', details: [{name: 'File Type Check', status: 'pass'}, {name: 'Date Check', status: 'fail', reason: 'Created in 2024'}] },
];

export function ValidationDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const filterQueue = () => {
    if (activeTab === 'all') return mockQueue;
    if (activeTab === 'manual') return mockQueue.filter(q => q.status === 'manual_review');
    if (activeTab === 'failed') return mockQueue.filter(q => q.status === 'fail');
    return mockQueue.filter(q => q.status === 'pass');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex gap-6 h-[calc(100vh-60px)]">
      {/* LEFT: Queue List */}
      <div className="w-1/2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold">Validation Queue</h1>
          <select className="border border-gray-300 rounded text-sm px-2 py-1">
            <option>All Types</option>
            <option>JSON Config</option>
            <option>PDF Documents</option>
          </select>
        </div>
        
        <div className="flex border-b border-gray-200 text-sm">
          <button className={`flex-1 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('all')}>All</button>
          <button className={`flex-1 py-2 font-medium ${activeTab === 'failed' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('failed')}>Failed</button>
          <button className={`flex-1 py-2 font-medium ${activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab('manual')}>Manual Review</button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
          {filterQueue().map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`p-3 border rounded shadow-sm cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                   <span className="text-xs font-bold text-gray-500">{item.mapId}</span>
                   <h3 className="font-medium text-sm text-gray-900 truncate pr-2">{item.fileName}</h3>
                </div>
                <ValidationBadge status={item.status} confidence={item.confidence} reason={item.reason} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{item.type}</span>
                <span>{item.uploader} • {item.uploadedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Detail View */}
      <div className="w-1/2 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
        {selectedItem ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedItem.fileName}</h2>
                  <p className="text-gray-500 text-sm">{selectedItem.id} • Attached to {selectedItem.mapId}</p>
                </div>
                <ValidationBadge status={selectedItem.status} confidence={selectedItem.confidence} />
              </div>

               <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                  <div>
                    <span className="block text-gray-500 text-xs uppercase font-semibold">Evidence Type</span>
                    <span className="font-medium">{selectedItem.type}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase font-semibold">Uploaded By</span>
                    <span className="font-medium">{selectedItem.uploader}</span>
                  </div>
               </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
               <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Validation Checks Breakdown</h3>
               <div className="space-y-3">
                 {selectedItem.details.map((detail: any, i: number) => (
                    <div key={i} className={`p-3 rounded border flex justify-between items-center bg-white ${detail.status === 'pass' ? 'border-green-200' : 'border-red-200'}`}>
                      <div>
                        <div className="font-medium text-sm">{detail.name}</div>
                        {detail.reason && <div className="text-xs text-red-600 mt-0.5">{detail.reason}</div>}
                      </div>
                      <div>
                        {detail.status === 'pass' ? (
                          <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-100">PASS</span>
                        ) : (
                          <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-100">FAIL</span>
                        )}
                      </div>
                    </div>
                 ))}
               </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
               <div className="flex gap-3">
                 {selectedItem.status !== 'pass' && (
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors flex justify-center items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       Override & Approve
                    </button>
                 )}
                 {selectedItem.status !== 'fail' && (
                    <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors flex justify-center items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                       Override & Reject
                    </button>
                 )}
                 <button className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded transition-colors">
                    Request Info
                 </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
             <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             <p className="text-lg">Select evidence from the queue to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}