import { cn } from "@/lib/cn";

export function StatusChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-royal bg-royal text-white"
          : "border-navy/10 bg-white text-navy/70 hover:border-royal/40 hover:text-royal"
      )}
    >
      {label}
    </button>
  );
}
