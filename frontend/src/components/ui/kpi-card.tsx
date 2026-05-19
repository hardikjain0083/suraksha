import React from 'react';
import { cn } from '../../lib/utils';
import { GlassCard } from './glass-card';

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'critical' | 'neutral';
  chart?: React.ReactNode;
}

const statusColors = {
  success: { glow: 'cyan' as const, border: 'cyber-green', text: 'text-cyber-green' },
  warning: { glow: 'magenta' as const, border: 'cyber-magenta', text: 'text-cyber-magenta' },
  critical: { glow: 'red' as const, border: 'canara-danger', text: 'text-canara-danger' },
  neutral: { glow: 'blue' as const, border: 'cyber-blue', text: 'text-cyber-blue' },
};

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, label, value, unit, trend, trendLabel, icon, status = 'neutral', chart, ...props }, ref) => {
    const statusConfig = statusColors[status];

    return (
      <GlassCard
        ref={ref}
        glowColor={statusConfig.glow as any}
        glowIntensity="subtle"
        className={cn('p-6', className)}
        {...props}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-cyber-cyan">
                  {value}
                </span>
                {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
              </div>
            </div>
            {icon && (
              <div className="text-2xl opacity-60 text-cyber-cyan">
                {icon}
              </div>
            )}
          </div>

          {/* Chart */}
          {chart && (
            <div className="h-12">
              {chart}
            </div>
          )}

          {/* Trend Indicator */}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-xs font-semibold">
              <span className={statusConfig.text}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-muted-foreground">
                  {trendLabel}
                </span>
              )}
            </div>
          )}

          {/* Status underline */}
          <div className={cn('h-1 w-full rounded-full opacity-60', {
            'bg-gradient-to-r from-cyber-green to-cyber-cyan': status === 'success',
            'bg-gradient-to-r from-cyber-magenta to-cyber-cyan': status === 'warning',
            'bg-gradient-to-r from-canara-danger to-cyber-magenta': status === 'critical',
            'bg-gradient-to-r from-cyber-blue to-cyber-cyan': status === 'neutral',
          })} />
        </div>
      </GlassCard>
    );
  }
);
KPICard.displayName = 'KPICard';

export { KPICard };
