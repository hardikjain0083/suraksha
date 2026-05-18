import React, { useState } from 'react';

const mockTeamMaps = [
  { id: 'MAP-2026-013', title: 'Update Firewall Config', assignee: 'Emp 001', deadline: '2026-05-20', status: 'IN PROGRESS' },
  { id: 'MAP-2026-016', title: 'Fix DB ACLs', assignee: 'Emp 002', deadline: '2026-05-18', status: 'OPEN' },
  { id: 'MAP-2026-017', title: 'Upload Audit Logs', assignee: 'Emp 003', deadline: '2026-05-19', status: 'PENDING VALIDATION' },
  { id: 'MAP-2026-018', title: 'Review IAM Roles', assignee: 'Emp 001', deadline: '2026-05-25', status: 'OPEN' },
];

export function TeamBoardPage() {
  const [maps, setMaps] = useState(mockTeamMaps);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Board (IT Department)</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium shadow hover:bg-blue-700">Reassign Workload</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 border rounded shadow-sm">
          <h2 className="font-bold text-lg mb-4 border-b pb-2">Workload Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="font-medium">Emp 001</span><span>2 Active MAPs</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="font-medium">Emp 002</span><span>1 Active MAP</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="font-medium">Emp 003</span><span className="text-red-600">1 Urgent MAP</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 border rounded shadow-sm">
          <h2 className="font-bold text-lg mb-4 border-b pb-2">Department Overview</h2>
           <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-center">
              <div className="text-2xl font-bold text-blue-800">14</div>
              <div className="text-xs text-blue-600 font-semibold uppercase">Total Open MAPs</div>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded text-center">
              <div className="text-2xl font-bold text-green-800">42</div>
              <div className="text-xs text-green-600 font-semibold uppercase">Completed This Month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAP ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {maps.map((map) => (
              <tr key={map.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{map.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{map.assignee}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{map.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{map.deadline}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {map.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}