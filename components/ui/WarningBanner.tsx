import { ShieldAlert, Info, PhoneCall } from "lucide-react";
import { cn } from "@/lib/cn";

export function WarningBanner({
  text,
  tone = "privacy",
  className,
}: {
  text: string;
  tone?: "privacy" | "info" | "emergency";
  className?: string;
}) {
  const styles = {
    privacy: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-lightblue border-sky-200 text-royal",
    emergency: "bg-red-50 border-red-200 text-red-700",
  }[tone];

  const Icon = tone === "emergency" ? PhoneCall : tone === "info" ? Info : ShieldAlert;

  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed", styles, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p>{text}</p>
    </div>
  );
}
