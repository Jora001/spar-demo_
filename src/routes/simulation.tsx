import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bug, Check, Cpu, Globe, HardDrive, Play, RotateCcw, ShieldCheck, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { EventRow, PageHeader, SeverityBadge, clock } from "@/components/rs/badges";
import { Pipeline } from "@/components/rs/pipeline";
import type { Impact, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Attack Simulation — SPAR" },
      { name: "description", content: "Run live demo attacks and watch SPAR detect, assess and contain them." },
      { property: "og:title", content: "Attack Simulation — SPAR" },
      { property: "og:description", content: "Run live demo attacks against a robot." },
    ],
  }),
  component: Simulation,
});

const SCENARIOS: { key: string; label: string; icon: React.ElementType; category: string; severity: Severity; impact: Impact; confidence: number; message: string; response: string }[] = [
  { key: "cmd", label: "Unauthorized command injection", icon: Terminal, category: "Unauthorized command", severity: "critical", impact: "High", confidence: 96, message: "Injected /cmd_vel 3.2 m/s from unregistered DDS participant", response: "Drop command stream, block participant, enter Restricted Safe mode" },
  { key: "proc", label: "Suspicious process on robot", icon: Cpu, category: "Suspicious process", severity: "high", impact: "Medium", confidence: 89, message: "Reverse shell spawned by nav2 plugin (pid 9921)", response: "Kill process tree and quarantine binary" },
  { key: "fw", label: "Firmware tampering", icon: HardDrive, category: "Firmware change", severity: "critical", impact: "High", confidence: 92, message: "Motor controller firmware hash mismatch on boot partition", response: "Block flashing, roll back to last signed image" },
  { key: "net", label: "Malicious network connection", icon: Globe, category: "Network anomaly", severity: "high", impact: "Low", confidence: 84, message: "Outbound beacon to known C2 185.220.101.4:4444", response: "Isolate network except safety & management channels" },
];

type Phase = "idle" | "running" | "awaiting" | "executing" | "contained" | "rejected";
interface Log { t: number; text: string; tone?: string | undefined }

function Simulation() {
  const robots = useStore((s) => s.robots);
  const events = useStore((s) => s.events);
  const pushEvent = useStore((s) => s.pushEvent);
  const notify = useStore((s) => s.notify);
  const addIncident = useStore((s) => s.addIncident);
  const decide = useStore((s) => s.decide);
  const robotAction = useStore((s) => s.robotAction);
  const [sc, setSc] = useState<(typeof SCENARIOS)[number] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(-1);
  const [logs, setLogs] = useState<Log[]>([]);
  const [incId, setIncId] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const target = robots.find((r) => r.mode === "Agent") ?? robots[0];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  const log = (text: string, tone?: string | undefined) => setLogs((l) => [...l, { t: Date.now(), text, tone }]);

  if (!target) return <p>No robots available for simulation.</p>;

  const start = (s: (typeof SCENARIOS)[number]) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSc(s); setPhase("running"); setStep(0); setLogs([]);
    const id = `INC-${Math.floor(3000 + Math.random() * 999)}`;
    setIncId(id);
    log(`Attack launched against ${target.name}`, "text-critical");
    at(900, () => { pushEvent({ robotId: target.id, robotName: target.name, severity: s.severity, category: s.category, message: s.message }); log(`Event captured: ${s.message}`); setStep(1); });
    at(2200, () => { log("Telemetry normalized to SPAR schema (OCSF)"); setStep(2); });
    at(3600, () => { log(`Detection: ${s.category} rule matched + behavior anomaly correlated`, "text-warning"); setStep(3); });
    at(5000, () => {
      log(`Risk: ${s.severity.toUpperCase()} · confidence ${s.confidence}% · safety impact ${s.impact}`, "text-warning");
      toast.error(`${s.severity === "critical" ? "Critical" : "High"} threat detected`, { description: `${s.label} on ${target.name}` });
      notify(`${s.label} detected on ${target.name}`, s.severity);
      addIncident({
        id, title: s.label, category: s.category, severity: s.severity, confidence: s.confidence, robotId: target.id, robotName: target.name,
        status: "New", createdAt: Date.now(), impact: s.impact, explanation: "Generated by attack simulation.", recommendedAction: s.response,
        audit: [{ time: Date.now(), actor: "Detection Engine", text: "Incident created by live simulation" }],
      });
      setStep(4);
    });
    at(6200, () => { log(`Proposed response: ${s.response}`, "text-info"); log("Awaiting human approval…"); setPhase("awaiting"); });
  };

  const approve = () => {
    if (!sc) return;
    setPhase("executing");
    log("Approved by jora@SPAR.io", "text-success");

    at(1200, () => log("Response executing on robot agent…"));
    at(2400, () => { log("Safety Controller / E-Stop verified untouched ✔", "text-success"); if (sc.key === "cmd") robotAction(target.id, "safe"); if (sc.key === "net") robotAction(target.id, "isolate"); });
    at(3400, () => {
      decide(incId, "approved");
      setStep(5); setPhase("contained");
      log(`Status: CONTAINED`, "text-success");
      pushEvent({ robotId: target.id, robotName: target.name, severity: "info", category: "Response", message: `${sc.label} contained` });
      toast.success("Threat contained", { description: `${incId} · ${target.name}` });
    });
  };

  const reset = () => { timers.current.forEach(clearTimeout); setPhase("idle"); setStep(-1); setLogs([]); setSc(null); };

  return (
    <div>
      <PageHeader title="Attack Simulation" sub={`Live demo target: ${target.name} (${target.mode} mode)`}>
        {phase !== "idle" && <Button variant="outline" onClick={reset}><RotateCcw />Reset</Button>}
      </PageHeader>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
        <ShieldCheck className="size-5 shrink-0 text-success" />
        <p><span className="font-semibold">Safety Policy Engine:</span> cyber-response will never override the robot's physical Safety Controller / E-Stop.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bug className="size-4 text-critical" />Run Demo Attack</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {SCENARIOS.map((s) => (
              <Button variant="outline" key={s.key} disabled={phase === "running" || phase === "executing"} onClick={() => start(s)}
                className={cn("flex h-auto w-full items-center gap-3 whitespace-normal rounded-lg border p-3 text-left text-sm transition hover:border-critical/60 hover:bg-critical/5 disabled:opacity-50", sc?.key === s.key && "border-critical/60 bg-critical/5")}>
                <s.icon className="size-4 text-critical" />
                <span className="flex-1">{s.label}</span>
                <Play className="size-3.5 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              {phase === "idle" ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Bug className="mx-auto size-10" />
                  <p className="mt-3">Pick a scenario to launch a simulated attack.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><SeverityBadge s={sc?.severity ?? "info"} /><span className="font-medium">{sc?.label}</span></div>
                    <span className={cn("rounded-md px-2.5 py-1 text-xs font-bold tracking-wide",
                      phase === "contained" ? "bg-success/15 text-success" : phase === "awaiting" ? "bg-warning/15 text-warning animate-pulse" : "bg-critical/15 text-critical")}>
                      {phase === "rejected" ? "REJECTED · INVESTIGATING" : phase === "contained" ? "CONTAINED" : phase === "awaiting" ? "AWAITING APPROVAL" : phase === "executing" ? "RESPONDING" : "UNDER ATTACK"}
                    </span>
                  </div>
                  <Pipeline active={step} />
                  {phase === "awaiting" && (
                    <div className="animate-in-up rounded-xl border border-primary/50 bg-primary/5 p-4 shadow-glow">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">System proposes</p>
                      <p className="mt-1 font-medium">{sc?.response}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Safety impact {sc?.impact} · Human-in-the-loop required</p>
                      <div className="mt-3 flex gap-2">
                        <Button onClick={approve}><Check />Approve response</Button>
                        <Button variant="outline" onClick={() => { log("Rejected by analyst", "text-warning"); setPhase("rejected"); decide(incId, "rejected"); }}>Reject</Button>
                      </div>
                    </div>
                  )}
                  <div className="h-48 overflow-auto rounded-lg border bg-surface p-3 font-mono text-xs">
                    {logs.map((l, i) => (
                      <p key={i} className={cn("animate-in-up", l.tone)}><span className="text-muted-foreground">{clock(l.t)} </span>{l.text}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Live event feed</CardTitle></CardHeader>
            <CardContent>{events.slice(0, 5).map((e) => <EventRow key={e.id} e={e} />)}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
