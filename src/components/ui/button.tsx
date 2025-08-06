import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-button hover:scale-105 active:scale-95",
        destructive: "bg-error text-error-foreground hover:bg-error/90 hover:shadow-lg",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-button",
        secondary: "bg-gradient-secondary text-secondary-foreground hover:shadow-button hover:scale-105 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cocktail: "bg-gradient-surface border-2 border-card-border text-foreground hover:border-primary hover:shadow-glow hover:scale-105 active:scale-95 backdrop-blur-sm data-[theme=hogwarts]:hover:shadow-button data-[theme=hogwarts]:border-warning",
        serving: "bg-warning text-warning-foreground animate-pulse-glow hover:bg-warning/90",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-lg",
        magical: "bg-gradient-primary border-2 border-warning text-primary-foreground hover:shadow-button hover:scale-105 active:scale-95 magical-sparkle animate-float",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-md px-4",
        lg: "h-16 rounded-xl px-10 text-lg",
        xl: "h-20 rounded-2xl px-12 text-xl",
        icon: "h-12 w-12",
        cocktail: "h-32 w-full p-6",
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
