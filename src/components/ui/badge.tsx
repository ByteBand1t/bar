import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "new" | "in_progress" | "ready" | "completed" | "cancelled";
}

const variantClasses: Record<string, string> = {
  default: "bg-purple-800 text-purple-100",
  new: "bg-blue-700 text-blue-100",
  in_progress: "bg-amber-700 text-amber-100",
  ready: "bg-emerald-700 text-emerald-100",
  completed: "bg-slate-700 text-slate-300",
  cancelled: "bg-red-900 text-red-200",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
