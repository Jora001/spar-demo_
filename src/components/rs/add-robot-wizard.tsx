import { useEffect, useState } from "react";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { ProtectionMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const OS_OPTS = ["Ubuntu 22.04 + ROS 2 Humble", "Vendor RTOS", "Yocto Linux"];
const STEPS = ["Details", "Capability audit", "Recommendation", "Connect"];

export function AddRobotWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addRobot = useStore((s) => s.addRobot);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("AMR-Nimbus-25");
  const [vendor, setVendor] = useState("Vendor A");
  const [os, setOs] = useState(OS_OPTS[0]);
  const [audit, setAudit] = useState(0);
  const [done, setDone] = useState(false);

  const checks = [
    { label: "OS shell access", ok: os !== "Vendor RTOS" },
    { label: "SDK / API availability", ok: vendor !== "Vendor B" },
    { label: "Security agent support", ok: os.startsWith("Ubuntu") },
    { label: "Network position for gateway", ok: true },
  ];
  const mode: ProtectionMode = checks[2].ok ? "Agent" : checks[1].ok ? "SDK/API" : "Gateway";
  const why = {
    Agent: "Full OS access available. The on-robot agent gives deepest visibility: processes, files, network and EDR — and keeps protecting offline.",
    "SDK/API": "No agent support, but the vendor SDK exposes status and command APIs. We secure the command channel and monitor telemetry.",
    Gateway: "Closed platform. An OT gateway inline on the robot's network enforces IDS/IPS and command filtering without touching the robot.",
  }[mode];

  useEffect(() => {
    if (!open) { setStep(0); setAudit(0); setDone(false); }
  }, [open]);
  useEffect(() => {
    if (step !== 1) return;
    setAudit(0);
    const t = setInterval(() => setAudit((a) => (a >= checks.length ? a : a + 1)), 700);
    return () => clearInterval(t);
  }, [step]);

  const finish = () => {
    setDone(true);
    addRobot({
      id: `r${Date.now()}`, name, uuid: crypto.randomUUID(), vendor, kind: "AMR", os, mode, connection: "Online", risk: 12,
      lastSeen: Date.now(), site: "Factory A", battery: 100, uptimeH: 0, firmware: "v1.0.0", ip: "10.10.4.25", mac: "3c:a1:0f:22:7e:91",
    });
    toast.success(`${name} is now protected`, { description: `${mode} mode active` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Onboard a robot</DialogTitle>
          <DialogDescription>Step {step + 1} of 4 · {STEPS[step]}</DialogDescription>
        </DialogHeader>
        <div className="mb-2 flex gap-1.5">
          {STEPS.map((_, i) => <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />)}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Robot name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Vendor A", "Vendor B", "ROS 2 custom", "Custom API"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>OS / Platform</Label>
              <Select value={os} onValueChange={setOs}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OS_OPTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={c.label} className="flex items-center gap-3 rounded-lg border bg-surface p-3 text-sm">
                {i < audit ? (c.ok ? <Check className="size-4 text-success" /> : <X className="size-4 text-critical" />) : <Loader2 className={cn("size-4", i === audit ? "animate-spin text-primary" : "text-muted-foreground")} />}
                <span className="flex-1">{c.label}</span>
                {i < audit && <span className={cn("text-xs", c.ok ? "text-success" : "text-muted-foreground")}>{c.ok ? "Available" : "Not available"}</span>}
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 shadow-glow">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Recommended protection mode</p>
            <p className="mt-1 font-display text-2xl font-semibold text-primary">{mode}</p>
            <p className="mt-2 text-sm">{why}</p>
          </div>
        )}

        {step === 3 && !done && (
          <div className="space-y-3 text-sm">
            <p>Run on the robot (or gateway host):</p>
            <pre className="overflow-auto rounded-lg border bg-surface p-3 font-mono text-xs">
{mode === "Agent" ? `curl -sSL https://get.roboshield.io | sudo bash -s -- \\\n  --token rs_live_8f2a… --mode agent` : mode === "SDK/API" ? `pip install roboshield-connector\nroboshield connect --vendor-api https://robot.local/api --token rs_live_8f2a…` : `rs-gateway enroll --robot ${name} --inline eth1 --token rs_live_8f2a…`}
            </pre>
          </div>
        )}
        {step === 3 && done && (
          <div className="animate-in-up flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="size-12 text-success" />
            <p className="mt-3 font-semibold">{name} connected</p>
            <p className="text-sm text-muted-foreground">Baseline captured. Protection active in {mode} mode.</p>
          </div>
        )}

        <div className="mt-2 flex justify-between">
          <Button variant="ghost" disabled={step === 0 || done} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 && <Button disabled={step === 1 && audit < checks.length} onClick={() => setStep(step + 1)}>Continue</Button>}
          {step === 3 && !done && <Button onClick={finish}>Verify connection</Button>}
          {step === 3 && done && <Button onClick={() => onOpenChange(false)}>Done</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
