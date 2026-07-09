"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { subscribeToast } from "@/lib/toast";

export default function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToast((message) => {
      setMsg(message);
    });
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div
      className="toast-host animate-fade-up"
      role="status"
      aria-live="polite"
    >
      <Check size={16} className="text-mint" strokeWidth={3} />
      <span>{msg}</span>
    </div>
  );
}
