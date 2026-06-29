import React from 'react';

interface Props {
  isCapturing: boolean;
}

export const BehavioralCaptureIndicator: React.FC<Props> = ({ isCapturing }) => {
  if (!isCapturing) return null;

  return (
    <div 
      className="absolute right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#00E5FF]/25 bg-[#06152d]/90 text-[10px] font-bold text-[#00E5FF] tracking-widest select-none pointer-events-none"
      style={{
        whiteSpace: 'nowrap',
        boxShadow: '0 0 10px rgba(0, 229, 255, 0.12)',
        fontFamily: "'Space Grotesk', 'JetBrains Mono', monospace",
        zIndex: 10,
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E5FF]"></span>
      </span>
      ACTIVE
    </div>
  );
};

