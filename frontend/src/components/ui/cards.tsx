import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  accentColor?: 'cyan' | 'blue' | 'green' | 'red' | 'magenta';
}

const accentMap = {
  cyan: 'from-cyber-cyan/20 to-cyber-cyan/5 border-cyber-cyan/50 shadow-glow-cyan',
  blue: 'from-cyber-blue/20 to-cyber-blue/5 border-cyber-blue/50 shadow-glow-blue',
  green: 'from-green-500/20 to-green-500/5 border-green-500/50',
  red: 'from-red-500/20 to-red-500/5 border-red-500/50',
  magenta: 'from-cyber-magenta/20 to-cyber-magenta/5 border-cyber-magenta/50',
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  accentColor = 'cyan',
}: StatCardProps) {
  const accentClass = accentMap[accentColor];

  return (
    <div className={`glass rounded-xl p-6 border ${accentClass} group hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
        {icon && <div className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {trend && (
          <div className={`text-xs font-semibold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
}

export function MetricGrid({ children, cols = 4 }: MetricGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[cols];

  return <div className={`grid ${colsClass} gap-4 mb-6`}>{children}</div>;
}

interface PanelProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, children, action, className = '' }: PanelProps) {
  return (
    <div className={`card-cyber rounded-xl overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 border-b border-cyber-cyan/20">
          <div>
            {title && <h2 className="text-lg font-semibold text-cyber-cyan">{title}</h2>}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: React.ReactNode;
}

const alertStyles = {
  info: 'from-cyber-blue/20 border-cyber-blue/50 text-cyber-blue',
  success: 'from-green-500/20 border-green-500/50 text-green-400',
  warning: 'from-yellow-500/20 border-yellow-500/50 text-yellow-400',
  error: 'from-red-500/20 border-red-500/50 text-red-400',
};

export function Alert({ type, title, message, action }: AlertProps) {
  const style = alertStyles[type];

  return (
    <div className={`glass rounded-lg p-4 border bg-gradient-to-r ${style}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <div className="p-6 max-w-7xl mx-auto space-y-6">{children}</div>;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, action }: HeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-4xl font-bold text-cyber-cyan">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
