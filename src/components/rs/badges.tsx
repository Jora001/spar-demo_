import { cn } from "@/lib/utils";
import type { Connection, IncidentStatus, ProtectionMode, Severity } from "@/lib/types";
import { Cpu, Network, Plug } from "lucide-react";

const sevCls: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical border-critical/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-info/15 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
  info: "bg-success/10 text-success border-success/25",
};

export function SeverityBadge({ s, className }: { s: Severity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", sevCls[s], className)}>
      {s}
    </span>
  );
}

export function ConnBadge({ c }: { c: Connection }) {
  const cls = c === "Online" ? "text-success" : c === "Offline-Protected" ? "text-warning" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cls)}>
      <span className={cn("size-2 rounded-full bg-current", c === "Online" && "pulse-dot")} />
      {c}
    </span>
  );
}

export function ModeBadge({ m }: { m: ProtectionMode }) {
  const Icon = m === "Agent" ? Cpu : m === "Gateway" ? Network : Plug;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-surface px-2 py-0.5 text-xs">
      <Icon className="size-3 text-primary" />
      {m}
    </span>
  );
}

export function RiskPill({ v }: { v: number }) {
  const cls = v >= 70 ? "bg-critical" : v >= 40 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", cls)} style={{ width: `${v}%` }} />
      </div>
      <span className="w-6 text-xs tabular-nums">{v}</span>
    </div>
  );
}

const stCls: Record<IncidentStatus, string> = {
  New: "bg-critical/15 text-critical",
  Investigating: "bg-warning/15 text-warning",
  Contained: "bg-info/15 text-info",
  Resolved: "bg-success/15 text-success",
};
export function StatusBadge({ s }: { s: IncidentStatus }) {
  return <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", stCls[s])}>{s}</span>;
}

export function ago(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function EventRow({ e }: { e: { id: string; time: number; severity: Severity; message: string; robotName: string; category: string } }) {
  return (
    <div className="animate-in-up flex items-start gap-3 border-b border-border/60 py-2.5 last:border-0">
      <SeverityBadge s={e.severity} className="mt-0.5 w-[68px] justify-center" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{e.message}</p>
        <p className="text-xs text-muted-foreground">
          {e.robotName} · {e.category}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{clock(e.time)}</span>
    </div>
  );
}
