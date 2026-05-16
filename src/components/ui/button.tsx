"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-4",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-slate-900 hover:bg-amber-400 active:bg-amber-600",
        outline:
          "border border-purple-500 text-purple-200 hover:bg-purple-900/40 active:bg-purple-900/60",
        ghost: "text-purple-200 hover:bg-purple-900/40",
        destructive: "bg-red-700 text-white hover:bg-red-600",
        secondary: "bg-purple-800 text-purple-100 hover:bg-purple-700",
      },
      size: {
        default: "text-base",
        sm: "text-sm min-h-[36px] px-3",
        lg: "text-lg min-h-[52px] px-6",
        icon: "min-h-[44px] w-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
