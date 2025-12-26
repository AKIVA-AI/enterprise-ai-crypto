import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        success: "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        outline: "text-foreground",
        online: "border-success/30 bg-success/10 text-success",
        offline: "border-destructive/30 bg-destructive/10 text-destructive",
        degraded: "border-warning/30 bg-warning/10 text-warning",
        live: "border-success/30 bg-success/10 text-success",
        paper: "border-primary/30 bg-primary/10 text-primary",
        draft: "border-muted-foreground/30 bg-muted text-muted-foreground",
        backtesting: "border-warning/30 bg-warning/10 text-warning",
        paused: "border-muted-foreground/30 bg-muted text-muted-foreground",
        pending: "border-muted-foreground/30 bg-muted text-muted-foreground",
        "in-progress": "border-primary/30 bg-primary/10 text-primary",
        completed: "border-success/30 bg-success/10 text-success",
        blocked: "border-destructive/30 bg-destructive/10 text-destructive",
        low: "border-muted-foreground/30 bg-muted text-muted-foreground",
        medium: "border-primary/30 bg-primary/10 text-primary",
        high: "border-warning/30 bg-warning/10 text-warning",
        critical: "border-destructive/30 bg-destructive/10 text-destructive",
        info: "border-primary/30 bg-primary/10 text-primary",
        error: "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
