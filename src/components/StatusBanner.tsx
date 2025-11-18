'use client';

type StatusVariant = "idle" | "success" | "error" | "info";

type StatusBannerProps = {
  message: string | null;
  variant?: StatusVariant;
};

const variantIcon: Record<Exclude<StatusVariant, "idle">, string> = {
  success: "✅",
  error: "⚠️",
  info: "ℹ️"
};

export function StatusBanner({ message, variant = "info" }: StatusBannerProps) {
  if (!message) return null;
  const className = `status-bar ${variant}`;
  const icon = variant === "idle" ? "ℹ️" : variantIcon[variant] ?? "ℹ️";

  return (
    <div className={className}>
      <span className="status-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{message}</span>
    </div>
  );
}
