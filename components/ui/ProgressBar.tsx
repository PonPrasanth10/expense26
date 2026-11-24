import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({
  value,
  className,
  color,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const isOverBudget = value >= 100;
  const isWarning = value >= 75 && value < 100;

  const fillColor = color
    ? color
    : isOverBudget
    ? "var(--color-danger)"
    : isWarning
    ? "var(--color-warning)"
    : "var(--color-primary)";

  return (
    <div
      className={cn("progress-track", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Budget used: ${value.toFixed(1)}%`}
    >
      <div
        className="progress-fill"
        style={{
          "--progress-width": `${clamped}%`,
          backgroundColor: fillColor,
        } as React.CSSProperties}
      />
    </div>
  );
}
