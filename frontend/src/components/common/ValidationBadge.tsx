import React from 'react';

export function ValidationBadge({ status, confidence, reason }: { status: string, confidence?: number, reason?: string }) {
  if (status === 'pass') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 border border-green-200 text-green-800 rounded-md text-xs font-semibold w-fit">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        <span>PASS</span>
        {confidence && <span className="opacity-75">({confidence})</span>}
      </div>
    );
  }

  if (status === 'fail') {
    return (
      <div className="flex flex-col gap-1 w-fit">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border border-red-200 text-red-800 rounded-md text-xs font-semibold w-fit">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
          <span>FAIL</span>
          {confidence && <span className="opacity-75">({confidence})</span>}
        </div>
        {reason && <span className="text-[10px] text-red-700 bg-red-50 p-1 rounded border border-red-100 max-w-[200px] truncate" title={reason}>{reason}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-fit">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-md text-xs font-semibold w-fit">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <span>MANUAL REVIEW</span>
        {confidence && <span className="opacity-75">({confidence})</span>}
      </div>
      {reason && <span className="text-[10px] text-yellow-700 bg-yellow-50 p-1 rounded border border-yellow-100 max-w-[200px] truncate" title={reason}>{reason}</span>}
    </div>
  );
}