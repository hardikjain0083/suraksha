import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EvidenceUploadModal } from '../../components/dept/EvidenceUploadModal';

export function DepartmentMapDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-sm text-gray-500 mb-4 cursor-pointer hover:underline" onClick={() => navigate('/dept/maps')}>
        Dashboard &gt; My MAPs &gt; {id || 'MAP-2026-013'}
      </div>

      <div className="flex justify-between items-center bg-white p-4 border rounded shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">{id || 'MAP-2026-013'}: Update Firewall Config</h1>
          <p className="text-gray-600 mt-1">Implement AES-256 encryption across all network boundaries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsUploadOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded font-medium shadow hover:bg-blue-700">Upload Evidence</button>
          <button className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50">Request Extension</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-4 border rounded shadow-sm">
            <h2 className="font-bold text-lg mb-3 border-b pb-2">MAP Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Priority</span>: <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-sm">High</span></p>
              <p><span className="font-medium">Deadline</span>: <span className="text-red-600 font-bold">2026-05-20 (3 days left)</span></p>
              <p><span className="font-medium">Status</span>: <span className="font-bold">IN PROGRESS</span></p>
              <p><span className="font-medium">Assignee</span>: Emp 001</p>
            </div>
            
            <h3 className="font-semibold text-md mt-4 mb-2">Provenance Path</h3>
            <div className="bg-gray-50 p-3 rounded border text-sm space-y-2">
               <p>📄 RBI/2026-ABC</p>
               <p className="pl-4">↪ Clause 1.1: All financial institutions shall implement AES-256.</p>
               <p className="pl-8">↪ Policy: Network Security v2.1</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 border rounded shadow-sm">
            <h2 className="font-bold text-lg mb-3 border-b pb-2">Evidence Checklist</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border border-green-200 bg-green-50 rounded">
                <div>
                  <div className="font-medium">1. Approved Change Request (ServiceNow)</div>
                  <div className="text-xs text-gray-500">Ticket ID starting with CHG</div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded border border-green-200 font-bold">✓ VALIDATED</div>
              </div>
              <div className="flex justify-between items-center p-3 border border-yellow-200 bg-yellow-50 rounded">
                <div>
                  <div className="font-medium">2. Router Config Screenshot</div>
                  <div className="text-xs text-gray-500">Showing AES-256 enabled</div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200 font-bold">◷ PENDING REVIEW</div>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded">
                <div>
                  <div className="font-medium">3. Security Lead Sign-off</div>
                  <div className="text-xs text-gray-500">PDF Document</div>
                </div>
                <button onClick={() => setIsUploadOpen(true)} className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Upload</button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 border rounded shadow-sm">
            <h2 className="font-bold text-lg mb-3 border-b pb-2">Completion Action</h2>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              <span className="font-bold">🔒 Critical Action:</span> Marking this MAP as complete requires behavioral re-authentication.
            </div>
            <button className="w-full mt-3 px-4 py-2 bg-green-600 opacity-50 cursor-not-allowed text-white rounded font-bold">Mark MAP Complete</button>
            <p className="text-xs text-gray-500 text-center mt-2">All evidence must be validated before completion.</p>
          </div>
        </div>
      </div>
      <EvidenceUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}