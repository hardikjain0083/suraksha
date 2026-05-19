import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-900 shadow-glow-cyan hover:shadow-glow-cyan-intense hover:scale-105 active:scale-95",
        destructive:
          "bg-gradient-to-r from-canara-danger to-red-600 text-white shadow-glow-red hover:shadow-glow-red-intense hover:scale-105 active:scale-95",
        outline:
          "border border-cyber-cyan/50 bg-obsidian-700/40 text-cyber-cyan hover:border-cyber-cyan hover:bg-obsidian-700/60 hover:shadow-glow-cyan transition-all",
        secondary:
          "bg-obsidian-700 text-cyber-cyan border border-cyber-cyan/30 shadow-sm hover:shadow-glow-blue hover:border-cyber-blue/60",
        ghost: "text-cyber-cyan hover:bg-obsidian-700/40 hover:text-cyber-cyan/90",
        link: "text-cyber-cyan underline-offset-4 hover:underline hover:text-cyber-cyan/80",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
