import React from 'react';

export function DepartmentDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Good morning, Emp. You have 3 MAPs requiring attention.</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-4 h-4 rounded-full bg-green-500" title="Session Health"></div>
          <span className="text-sm">IT Department</span>
          <span className="text-sm font-semibold">Security Admin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg shadow border border-blue-100">
          <h3 className="text-blue-800 font-semibold">Active MAPs</h3>
          <p className="text-2xl font-bold text-blue-900">5</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg shadow border border-red-100">
          <h3 className="text-red-800 font-semibold">Overdue</h3>
          <p className="text-2xl font-bold text-red-900">1</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg shadow border border-yellow-100">
          <h3 className="text-yellow-800 font-semibold">Pending Validation</h3>
          <p className="text-2xl font-bold text-yellow-900">2</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg shadow border border-green-100">
          <h3 className="text-green-800 font-semibold">Completed This Month</h3>
          <p className="text-2xl font-bold text-green-900">12</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Urgent Items</h2>
        <div className="p-4 border rounded-lg border-red-300 bg-red-50 space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold text-red-900">MAP-2026-013: Update Firewall Config</span>
            <span className="text-red-700">Overdue by 2 days</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">View MAP</button>
            <button className="px-3 py-1 bg-white text-red-700 border border-red-300 rounded text-sm hover:bg-red-50">Upload Evidence</button>
            <button className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded text-sm hover:bg-gray-50">Request Extension</button>
          </div>
        </div>
      </div>
    </div>
  );
}