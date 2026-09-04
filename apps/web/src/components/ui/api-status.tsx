"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

type ConnectionState = "checking" | "online" | "offline";

export function ApiStatus() {
  const [state, setState] = useState<ConnectionState>("checking");

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((health) => {
        if (!cancelled) setState(health.status === "ok" ? "online" : "offline");
      })
      .catch(() => {
        if (!cancelled) setState("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const label: Record<ConnectionState, string> = {
    checking: "verificando API...",
    online: "API online",
    offline: "API offline",
  };

  const dotColor: Record<ConnectionState, string> = {
    checking: "bg-muted-2",
    online: "bg-accent shadow-[0_0_8px_var(--color-accent)]",
    offline: "bg-red-500",
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${dotColor[state]}`} />
      {label[state]}
    </div>
  );
}
