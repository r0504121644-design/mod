"use client";

import { useState } from "react";
import { containsIdNumber, sanitizeGuardMessage } from "@/lib/sanitize";
import { cn } from "@/lib/cn";

interface SanitizedFieldProps {
  value: string;
  onChange: (value: string, valid: boolean) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
}

export function SanitizedInput({
  value,
  onChange,
  placeholder,
  className,
  label,
  multiline,
  rows = 3,
}: SanitizedFieldProps) {
  const [error, setError] = useState(false);

  function handleChange(v: string) {
    const blocked = containsIdNumber(v);
    setError(blocked);
    onChange(v, !blocked);
  }

  const baseClass = cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:ring-2 transition-colors bg-white",
    error ? "border-red-300 focus:ring-red-200" : "border-navy/10 focus:ring-royal/20 focus:border-royal/40",
    className
  );

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-navy/80">{label}</label>}
      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          className={baseClass}
        />
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{sanitizeGuardMessage()}</p>}
    </div>
  );
}
