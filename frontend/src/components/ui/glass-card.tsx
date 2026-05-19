import React from 'react';
import { cn } from '../../lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'cyan' | 'blue' | 'green' | 'magenta' | 'red' | 'none';
  glowIntensity?: 'subtle' | 'medium' | 'intense';
  hoverGlow?: boolean;
  borderColor?: 'cyan' | 'blue' | 'none';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glowColor = 'none', glowIntensity = 'subtle', hoverGlow = true, borderColor = 'cyan', ...props }, ref) => {
    const glowStyles = {
      cyan: {
        subtle: 'shadow-glow-cyan',
        medium: 'shadow-glow-cyan-intense',
        intense: 'shadow-glow-cyan-intense',
      },
      blue: {
        subtle: 'shadow-glow-blue',
        medium: 'shadow-glow-blue-intense',
        intense: 'shadow-glow-blue-intense',
      },
      green: {
        subtle: 'shadow-glow-green',
        medium: 'shadow-glow-green',
        intense: 'shadow-glow-green',
      },
      magenta: {
        subtle: 'shadow-glow-magenta',
        medium: 'shadow-glow-magenta',
        intense: 'shadow-glow-magenta',
      },
      red: {
        subtle: 'shadow-glow-red',
        medium: 'shadow-glow-red-intense',
        intense: 'shadow-glow-red-intense',
      },
      none: {
        subtle: '',
        medium: '',
        intense: '',
      },
    };

    const borderStyles = {
      cyan: 'border-cyber-cyan/30 hover:border-cyber-cyan/60',
      blue: 'border-cyber-blue/30 hover:border-cyber-blue/60',
      none: '',
    };

    const glowClass = glowColor !== 'none' ? glowStyles[glowColor][glowIntensity] : '';
    const borderClass = borderColor !== 'none' ? borderStyles[borderColor] : '';
    const hoverClass = hoverGlow ? 'hover:shadow-glass' : '';

    return (
      <div
        ref={ref}
        className={cn(
          'relative backdrop-blur-lg bg-white/10 border rounded-lg transition-all duration-300',
          'backdrop-saturate-150',
          borderClass || 'border-white/20',
          glowClass,
          hoverClass,
          className,
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = 'GlassCard';

export { GlassCard };
