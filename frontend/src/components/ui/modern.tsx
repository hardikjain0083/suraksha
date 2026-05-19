import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-900 hover:shadow-glow-cyan',
        secondary: 'glass text-cyber-cyan border-cyber-cyan/50 hover:bg-white/20',
        danger: 'btn-cyber-danger hover:shadow-glow-red',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent hover:border-cyber-cyan/30',
        outline: 'border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
        xl: 'px-8 py-4 text-lg gap-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = 'Button';

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={`input-cyber w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={`input-cyber w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all resize-none ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      className={`input-cyber w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all appearance-none cursor-pointer bg-obsidian-800/50 ${className || ''}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = 'Select';

// Form Group Component
interface FormGroupProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormGroup({ label, error, hint, required, children }: FormGroupProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const badgeVariants = {
  primary: 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50',
  success: 'bg-green-500/20 text-green-400 border border-green-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  error: 'bg-red-500/20 text-red-400 border border-red-500/50',
  info: 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeVariants[variant]} ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';

// Separator Component
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      className={`${
        orientation === 'horizontal'
          ? 'h-px w-full'
          : 'w-px h-full'
      } bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';

export { Button, Input, Textarea, Select, Badge, Separator };
