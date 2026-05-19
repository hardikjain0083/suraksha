import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

export function ValidationBadge({ status, confidence, reason }: { status: string, confidence?: number, reason?: string }) {
  if (status === 'pass') {
    return (
      <div className="flex flex-col gap-1 w-fit font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green rounded-md text-[10px] font-bold shadow-glow-green/10">
          <Check className="w-3 h-3 text-cyber-green" />
          <span>PASS</span>
          {confidence && <span className="opacity-75">({confidence})</span>}
        </div>
      </div>
    );
  }

  if (status === 'fail') {
    return (
      <div className="flex flex-col gap-1.5 w-fit font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md text-[10px] font-bold shadow-glow-red/10">
          <X className="w-3 h-3 text-red-400" />
          <span>FAIL</span>
          {confidence && <span className="opacity-75">({confidence})</span>}
        </div>
        {reason && (
          <span className="text-[9px] text-red-400 bg-red-500/5 p-1 rounded border border-red-500/20 max-w-[200px] truncate block" title={reason}>
            {reason}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-fit font-mono">
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-cyber-magenta/10 border border-cyber-magenta/30 text-cyber-magenta rounded-md text-[10px] font-bold shadow-glow-magenta/10">
        <AlertTriangle className="w-3 h-3 text-cyber-magenta animate-pulse" />
        <span>REVIEW</span>
        {confidence && <span className="opacity-75">({confidence})</span>}
      </div>
      {reason && (
        <span className="text-[9px] text-cyber-magenta bg-cyber-magenta/5 p-1 rounded border border-cyber-magenta/20 max-w-[200px] truncate block" title={reason}>
          {reason}
        </span>
      )}
    </div>
  );
}