import React from 'react';
import { cn } from '../../lib/utils';

export interface GlowBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'pass' | 'fail' | 'pending' | 'critical' | 'warning' | 'info';
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const statusConfig = {
  pass: {
    bg: 'bg-cyber-green/20',
    text: 'text-cyber-green',
    border: 'border-cyber-green/50',
    glow: 'shadow-glow-green',
    label: 'Pass',
  },
  fail: {
    bg: 'bg-canara-danger/20',
    text: 'text-canara-danger',
    border: 'border-canara-danger/50',
    glow: 'shadow-glow-red',
    label: 'Fail',
  },
  pending: {
    bg: 'bg-cyber-magenta/20',
    text: 'text-cyber-magenta',
    border: 'border-cyber-magenta/50',
    glow: 'shadow-glow-magenta',
    label: 'Pending',
  },
  critical: {
    bg: 'bg-red-950/40',
    text: 'text-red-400',
    border: 'border-red-500/60',
    glow: 'shadow-glow-red-intense',
    label: 'Critical',
  },
  warning: {
    bg: 'bg-cyber-magenta/15',
    text: 'text-cyber-magenta',
    border: 'border-cyber-magenta/40',
    glow: 'shadow-glow-magenta',
    label: 'Warning',
  },
  info: {
    bg: 'bg-cyber-blue/20',
    text: 'text-cyber-blue',
    border: 'border-cyber-blue/50',
    glow: 'shadow-glow-blue',
    label: 'Info',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const GlowBadge = React.forwardRef<HTMLSpanElement, GlowBadgeProps>(
  ({ className, status, animated = false, size = 'md', icon, children, ...props }, ref) => {
    const config = statusConfig[status];
    const sizeClass = sizeConfig[size];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 font-medium rounded-full border transition-all duration-300',
          'backdrop-blur-sm',
          config.bg,
          config.text,
          config.border,
          animated && config.glow,
          sizeClass,
          className,
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children || config.label}</span>
        {animated && status === 'critical' && (
          <span className="ml-1 inline-block w-2 h-2 rounded-full bg-canara-danger animate-pulse-glow" />
        )}
      </span>
    );
  }
);
GlowBadge.displayName = 'GlowBadge';

export { GlowBadge };
