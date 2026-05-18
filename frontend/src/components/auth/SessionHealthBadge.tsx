import React from 'react';

interface Props {
  status: 'healthy' | 'warning' | 'critical' | 'disconnected';
}

export const SessionHealthBadge: React.FC<Props> = ({ status }) => {
  let mappedStatus = status;
  if (status === 'green' as any) mappedStatus = 'healthy';
  if (status === 'yellow' as any || status === 'orange' as any) mappedStatus = 'warning';
  if (status === 'red' as any) mappedStatus = 'critical';

  const statusConfig = {
    healthy: { color: 'bg-canara-green', text: 'Secure Session', glow: 'shadow-[0_0_8px_rgba(0,168,107,0.8)]' },
    warning: { color: 'bg-canara-orange', text: 'Elevated Risk', glow: 'shadow-[0_0_8px_rgba(255,107,53,0.8)]' },
    critical: { color: 'bg-canara-red', text: 'High Risk', glow: 'shadow-[0_0_8px_rgba(220,38,38,0.8)]' },
    disconnected: { color: 'bg-gray-400', text: 'Disconnected', glow: '' }
  };

  const config = statusConfig[mappedStatus as keyof typeof statusConfig] || statusConfig.disconnected;

  return (
    <div className="group relative flex items-center gap-2 cursor-help">
      <div className={`w-3 h-3 rounded-full ${config.color} ${config.glow} animate-pulse`} />
      <span className="text-sm font-medium text-foreground">{config.text}</span>
      
      {/* Tooltip */}
      <div className="absolute top-full mt-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        Continuous behavioral authentication is monitoring this session.
      </div>
    </div>
  );
};
