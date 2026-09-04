interface BadgeProps {
  children: React.ReactNode;
}

export function Badge({ children }: BadgeProps) {
  return (
    <span className="rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-xs text-muted">
      {children}
    </span>
  );
}
