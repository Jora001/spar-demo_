import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { PageHeader, SeverityBadge, StatusBadge, ago, clock } from "@/components/rs/badges";
import { Pipeline } from "@/components/rs/pipeline";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/threats")({
  head: () => ({
    meta: [
      { title: "Threats & Incidents — RoboShield" },
      { name: "description", content: "Investigate robot security incidents with risk assessment and human-approved response." },
      { property: "og:title", content: "Threats & Incidents — RoboShield" },
      { property: "og:description", content: "Investigate robot security incidents." },
    ],
  }),
  component: Threats,
});

export function IncidentDetail({ inc }: { inc: Incident }) {
  const decide = useStore((s) => s.decide);
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const target = inc.decision === "approved" || inc.status === "Resolved" || inc.status === "Contained" ? 5 : 4;
    const t = setInterval(() => setStep((s) => (s >= target ? s : s + 1)), 450);
    return () => clearInterval(t);
  }, [inc.id, inc.decision, inc.status]);
  const impactCls = inc.impact === "High" ? "text-critical" : inc.impact === "Medium" ? "text-warning" : "text-success";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-surface p-4"><Pipeline active={step} /></div>
      <div className="rounded-xl border p-4">
        <p className="mb-3 text-sm font-semibold">Risk Assessment</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xs text-muted-foreground">Severity</p><SeverityBadge s={inc.severity} className="mt-1" /></div>
          <div><p className="text-xs text-muted-foreground">Confidence</p><p className="font-display text-xl font-semibold">{inc.confidence}%</p></div>
          <div><p className="text-xs text-muted-foreground">Robot Safety Impact</p><p className={cn("font-display text-xl font-semibold", impactCls)}>{inc.impact}</p></div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{inc.explanation}</p>
      </div>
      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Recommended action</p>
        <p className="mt-1 font-medium">{inc.recommendedAction}</p>
        {inc.decision ? (
          <p className={cn("mt-3 text-sm font-medium", inc.decision === "approved" ? "text-success" : "text-warning")}>
            {inc.decision === "approved" ? "Approved and executed" : "Rejected — analyst investigating"}
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => { decide(inc.id, "approved"); toast.success("Response executed", { description: `${inc.id} contained` }); }}><Check />Approve</Button>
            <Button size="sm" variant="outline" onClick={() => decide(inc.id, "rejected")}><X />Reject</Button>
          </div>
        )}
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">Audit trail <span className="text-xs font-normal text-muted-foreground">· immutable, hash-chained</span></p>
        <ol className="relative space-y-3 border-l pl-4">
          {inc.audit.map((a, i) => (
            <li key={i} className="animate-in-up text-sm">
              <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />
              <p>{a.text}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{clock(a.time)} · {a.actor} · #{(a.time % 0xffffff).toString(16)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Threats() {
  const incidents = useStore((s) => s.incidents);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const inc = incidents.find((i) => i.id === sel);
  const rows = incidents.filter((i) => tab === "all" || i.status === tab);

  return (
    <div>
      <PageHeader title="Threats & Incidents" sub="Correlated incidents awaiting triage and response" />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {["all", "New", "Investigating", "Contained", "Resolved"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t} {t !== "all" && <span className="ml-1 text-muted-foreground">{incidents.filter((i) => i.status === t).length}</span>}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Incident</TableHead><TableHead>Severity</TableHead><TableHead>Confidence</TableHead><TableHead>Robot</TableHead><TableHead>Status</TableHead><TableHead>Opened</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((i) => (
              <TableRow key={i.id} className="cursor-pointer" onClick={() => setSel(i.id)}>
                <TableCell><p className="font-medium">{i.title}</p><p className="font-mono text-xs text-muted-foreground">{i.id} · {i.category}</p></TableCell>
                <TableCell><SeverityBadge s={i.severity} /></TableCell>
                <TableCell className="tabular-nums">{i.confidence}%</TableCell>
                <TableCell><Link to="/robots/$robotId" params={{ robotId: i.robotId }} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">{i.robotName}</Link></TableCell>
                <TableCell><StatusBadge s={i.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{ago(i.createdAt)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No incidents in this state. 🎉</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
      <Sheet open={!!inc} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {inc && (
            <>
              <SheetHeader className="mb-4 p-0">
                <SheetTitle>{inc.title}</SheetTitle>
                <SheetDescription>{inc.id} · {inc.robotName} · <StatusBadge s={inc.status} /></SheetDescription>
              </SheetHeader>
              <IncidentDetail inc={inc} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
