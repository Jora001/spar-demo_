import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Ban, Battery, Clock, Cpu, Lock, RotateCcw, ShieldOff, ShieldAlert, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, type RobotAction } from "@/lib/store";
import { ConnBadge, EventRow, ModeBadge, RiskPill, SeverityBadge } from "@/components/rs/badges";
import { CVES } from "@/lib/mock-data";
import { chartTip as tip } from "@/lib/page-meta";
import { RobotImage } from "@/components/rs/robot-image";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/robots/$robotId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Robot detail — RoboShield" },
      { name: "description", content: "Status, telemetry, integrity and response actions for a protected robot." },
      { property: "og:title", content: "Robot detail — RoboShield" },
      { property: "og:description", content: "Status, telemetry and response actions for a robot." },
    ],
  }),
  component: RobotDetail,
});

function useTelemetry() {
  const [data, setData] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 30 + Math.random() * 20, mem: 50 + Math.random() * 10, net: 100 + Math.random() * 80, lidar: 20 + Math.random() * 5 })),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setData((d) => {
        const l = d[d.length - 1];
        if (!l) return d;
        const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
        return [...d.slice(1), {
          t: l.t + 1, cpu: clamp(l.cpu + (Math.random() - 0.5) * 12, 5, 95), mem: clamp(l.mem + (Math.random() - 0.5) * 4, 30, 90),
          net: clamp(l.net + (Math.random() - 0.5) * 60, 20, 400), lidar: clamp(l.lidar + (Math.random() - 0.5) * 2, 10, 30),
        }];
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);
  return data;
}

function Mini({ title, data, k, unit, color }: { title: string; data: Record<string, number>[]; k: string; unit: string; color: string }) {
  const last = data[data.length - 1]?.[k] ?? 0;
  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="font-mono text-lg tabular-nums">{last.toFixed(0)}<span className="text-xs text-muted-foreground"> {unit}</span></span>
      </CardHeader>
      <CardContent className="h-36 pt-2">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="t" hide /><YAxis hide domain={["auto", "auto"]} />
            <Tooltip {...tip} />
            <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const ACTIONS: { a: RobotAction; label: string; icon: React.ElementType; critical: boolean; desc: string }[] = [
  { a: "isolate", label: "Isolate network", icon: ShieldOff, critical: true, desc: "Cuts all network traffic except the safety and management channels." },
  { a: "block", label: "Block connection", icon: Ban, critical: false, desc: "Blocks the most suspicious active connection." },
  { a: "restart", label: "Restart agent", icon: RotateCcw, critical: false, desc: "Restarts the RoboShield security agent." },
  { a: "safe", label: "Restricted Safe mode", icon: Lock, critical: true, desc: "Limits robot to reduced speed & essential functions. Physical safety controller is untouched." },
];

function RobotDetail() {
  const { robotId } = Route.useParams();
  const robot = useStore((s) => s.robots.find((r) => r.id === robotId));
  const allEvents = useStore((s) => s.events);
  const events = allEvents.filter((e) => e.robotId === robotId);
  const robotAction = useStore((s) => s.robotAction);
  const pushEvent = useStore((s) => s.pushEvent);
  const tel = useTelemetry();
  const [confirm, setConfirm] = useState<(typeof ACTIONS)[number] | null>(null);
  const [approved, setApproved] = useState(false);

  if (!robot) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold">Robot not found</p>
        <Link to="/fleet" className="text-sm text-primary">Back to fleet</Link>
      </div>
    );
  }

  const run = (x: (typeof ACTIONS)[number]) => {
    robotAction(robot.id, x.a);
    pushEvent({ robotId: robot.id, robotName: robot.name, severity: "info", category: "Response", message: `${x.label} executed by jora@roboshield.io` });
    toast.success(`${x.label} executed`, { description: robot.name });
  };

  const procs = [
    ["ros2_daemon", 412, 2.1, "trusted"], ["nav2_controller", 655, 18.4, "trusted"], ["lidar_driver", 702, 6.3, "trusted"],
    ["roboshield-agent", 120, 1.2, "trusted"], ["python3 /tmp/.x", 9921, 41.0, "suspicious"], ["sshd", 88, 0.1, "trusted"],
  ] as const;
  const conns = [
    ["10.10.0.5:443", "Fleet manager", "allowed"], ["10.10.0.8:7400", "DDS discovery", "allowed"],
    ["185.220.101.4:4444", "Unknown (TOR exit)", "blocked"], ["52.18.9.12:443", "RoboShield cloud", "allowed"], ["10.12.4.66:22", "Lateral SSH", "blocked"],
  ] as const;

  return (
    <div>
      <Link to="/fleet" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Fleet</Link>
      <div className="mb-6 flex flex-wrap items-center gap-4"><RobotImage kind={robot.kind} className="size-20"/>
        <div>
          <h1 className="text-2xl font-semibold">{robot.name}</h1>
          <p className="text-sm text-muted-foreground">{robot.vendor} · {robot.kind} · {robot.os}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ConnBadge c={robot.connection} /><ModeBadge m={robot.mode} /><RiskPill v={robot.risk} />
          {robot.isolated && <span className="rounded-md bg-critical/15 px-2 py-0.5 text-xs font-medium text-critical">Network isolated</span>}
          {robot.safeMode && <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">Restricted Safe mode</span>}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Tabs defaultValue="overview" className="min-w-0">
          <TabsList className="h-auto flex-wrap justify-start">
            {["overview", "telemetry", "processes", "network", "firmware", "vulnerabilities", "events"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">{t === "firmware" ? "Firmware & Integrity" : t === "events" ? "Security Events" : t}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="font-mono text-sm text-muted-foreground">get_status()</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { l: "Mode", v: robot.safeMode ? "RESTRICTED_SAFE" : "AUTONOMOUS", i: Cpu },
                  { l: "Health", v: robot.risk > 60 ? "DEGRADED" : "NOMINAL", i: ShieldAlert },
                  { l: "Battery", v: `${robot.battery}%`, i: Battery },
                  { l: "Uptime", v: `${robot.uptimeH}h`, i: Clock },
                ].map((x) => (
                  <div key={x.l} className="rounded-lg border bg-surface p-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><x.i className="size-3.5" />{x.l}</p>
                    <p className="mt-1 font-mono font-medium">{x.v}</p>
                  </div>
                ))}
                <pre className="col-span-full overflow-auto rounded-lg border bg-surface p-3 font-mono text-xs text-muted-foreground">
{JSON.stringify({ uuid: robot.uuid, site: robot.site, firmware: robot.firmware, ip: robot.ip, estop: "ARMED", safety_controller: "OK" }, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telemetry" className="mt-4 grid gap-4 md:grid-cols-2">
            <Mini title="CPU" data={tel} k="cpu" unit="%" color="var(--chart-1)" />
            <Mini title="Memory" data={tel} k="mem" unit="%" color="var(--chart-2)" />
            <Mini title="Network traffic" data={tel} k="net" unit="kB/s" color="var(--chart-3)" />
            <Mini title="LiDAR min range" data={tel} k="lidar" unit="m" color="var(--chart-5)" />
          </TabsContent>

          <TabsContent value="processes" className="mt-4">
            {robot.mode !== "Agent" ? (
              <Card><CardContent className="py-16 text-center">
                <Cpu className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 font-medium">Not available in {robot.mode} protection mode</p>
                <p className="text-sm text-muted-foreground">Process visibility requires the on-robot Security Agent.</p>
              </CardContent></Card>
            ) : (
              <Card className="overflow-hidden"><Table>
                <TableHeader><TableRow><TableHead>Process</TableHead><TableHead>PID</TableHead><TableHead>CPU %</TableHead><TableHead>Verdict</TableHead></TableRow></TableHeader>
                <TableBody>{procs.map(([n, pid, cpu, v]) => (
                  <TableRow key={pid}><TableCell className="font-mono text-xs">{n}</TableCell><TableCell>{pid}</TableCell><TableCell>{cpu}</TableCell>
                    <TableCell><span className={cn("text-xs font-medium", v === "trusted" ? "text-success" : "text-critical")}>{v}</span></TableCell></TableRow>
                ))}</TableBody>
              </Table></Card>
            )}
          </TabsContent>

          <TabsContent value="network" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[["eth0", robot.ip, robot.mac], ["wlan0", robot.ip.replace(/\.\d+$/, ".201"), robot.mac.replace(/^../, "a2")]].map(([n, ip, mac]) => (
                <Card key={n}><CardContent className="p-4 font-mono text-xs"><p className="mb-1 text-sm font-semibold">{n}</p><p>IP {ip}</p><p className="text-muted-foreground">MAC {mac}</p></CardContent></Card>
              ))}
            </div>
            <Card className="overflow-hidden"><Table>
              <TableHeader><TableRow><TableHead>Remote</TableHead><TableHead>Service</TableHead><TableHead>Policy</TableHead></TableRow></TableHeader>
              <TableBody>{conns.map(([r, s, p]) => (
                <TableRow key={r}><TableCell className="font-mono text-xs">{r}</TableCell><TableCell>{s}</TableCell>
                  <TableCell><span className={cn("rounded px-2 py-0.5 text-xs font-medium", p === "allowed" ? "bg-success/15 text-success" : "bg-critical/15 text-critical")}>{robot.isolated && p === "allowed" && s !== "RoboShield cloud" ? "blocked" : p}</span></TableCell></TableRow>
              ))}</TableBody>
            </Table></Card>
          </TabsContent>

          <TabsContent value="firmware" className="mt-4 grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Firmware</p><p className="font-mono text-xl">{robot.firmware}</p><p className="mt-1 text-xs text-success">Signed by vendor · verified</p></CardContent></Card>
            <Card className="md:col-span-2"><CardContent className="space-y-2 p-4 text-sm">
              <p className="mb-2 text-xs text-muted-foreground">File integrity monitor</p>
              {[["/opt/ros/humble/lib", true], ["/etc/robot/safety.yaml", true], ["/usr/bin/motion_ctl", robot.risk < 60], ["/boot/firmware.bin", true]].map(([f, ok]) => (
                <div key={String(f)} className="flex justify-between font-mono text-xs"><span>{f}</span><span className={ok ? "text-success" : "text-critical"}>{ok ? "unchanged" : "MODIFIED"}</span></div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">Signed packages: 412 / 412 verified</p>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="mt-4">
            <Card className="overflow-hidden"><Table>
              <TableHeader><TableRow><TableHead>CVE</TableHead><TableHead>Package</TableHead><TableHead>Severity</TableHead><TableHead>CVSS</TableHead><TableHead>Fix</TableHead></TableRow></TableHeader>
              <TableBody>{CVES.map((c) => (
                <TableRow key={c.id}><TableCell className="font-mono text-xs">{c.id}</TableCell><TableCell>{c.pkg}</TableCell><TableCell><SeverityBadge s={c.severity} /></TableCell><TableCell>{c.cvss}</TableCell>
                  <TableCell>{c.fix ? <span className="text-xs text-success">Fix available</span> : <span className="text-xs text-muted-foreground">No fix yet</span>}</TableCell></TableRow>
              ))}</TableBody>
            </Table></Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Card><CardContent className="p-4">
              {events.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No security events for this robot yet.</p> : events.slice(0, 20).map((e) => <EventRow key={e.id} e={e} />)}
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Response Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ACTIONS.map((x) => (
              <Button key={x.a} variant={x.critical ? "destructive" : "outline"} className="w-full justify-start"
                onClick={() => (x.critical ? (setApproved(false), setConfirm(x)) : run(x))}>
                <x.icon />{x.label}
              </Button>
            ))}
            {(robot.isolated || robot.safeMode) && (
              <Button variant="secondary" className="w-full justify-start" onClick={() => { robotAction(robot.id, "release"); toast("Restrictions released"); }}><Unlock />Release restrictions</Button>
            )}
            <p className="pt-2 text-xs text-muted-foreground">Cyber-response never overrides the robot's physical Safety Controller or E-Stop.</p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.label} — human approval required</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-start gap-2 rounded-lg border bg-surface p-3 text-sm">
            <Checkbox checked={approved} onCheckedChange={(v) => setApproved(!!v)} className="mt-0.5" />
            I confirm the robot's surroundings are safe and approve this action. It will be recorded in the audit log.
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!approved} onClick={() => confirm && run(confirm)}>Approve & execute</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
