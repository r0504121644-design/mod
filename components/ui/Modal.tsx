"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm animate-fade-up" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} rounded-3xl bg-white p-6 shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-bold text-navy">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-navy/50 hover:bg-navy/5 hover:text-navy transition-colors ms-auto"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
