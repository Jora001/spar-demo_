import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, Factory, ShieldAlert, ShieldBan, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, fleetScore } from "@/lib/store";
import { EventRow, PageHeader } from "@/components/rs/badges";
import { SITES, THREAT_CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — RoboShield" },
      { name: "description", content: "Live overview of robot fleet security: threats, blocked attacks and fleet security score." },
      { property: "og:title", content: "Dashboard — RoboShield" },
      { property: "og:description", content: "Live overview of robot fleet security." },
    ],
  }),
  component: Dashboard,
});

export const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" },
};

function Kpi({ label, value, sub, icon: Icon, tone = "text-primary" }: { label: string; value: React.ReactNode; sub?: string; icon: React.ElementType; tone?: string }) {
  return (
    <Card className="animate-in-up">
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {label}
          <Icon className={cn("size-4", tone)} />
        </div>
        <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function Gauge({ value, size = 110 }: { value: number; size?: number }) {
  const r = size / 2 - 10;
  const c = Math.PI * r;
  const tone = value >= 75 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--critical)";
  return (
    <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
      <path d={`M10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`} fill="none" stroke="var(--muted)" strokeWidth={10} strokeLinecap="round" />
      <path
        d={`M10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
        fill="none" stroke={tone} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 1s" }}
      />
      <text x="50%" y={size / 2 + 4} textAnchor="middle" className="fill-foreground font-display text-2xl font-semibold">{value}</text>
    </svg>
  );
}

function Dashboard() {
  const robots = useStore((s) => s.robots);
  const events = useStore((s) => s.events);
  const incidents = useStore((s) => s.incidents);
  const timeline = useStore((s) => s.timeline);
  const blocked = useStore((s) => s.blocked24h);
  const online = robots.filter((r) => r.connection === "Online").length;
  const active = incidents.filter((i) => i.status === "New" || i.status === "Investigating").length;
  const modes = (["SDK/API", "Agent", "Gateway"] as const).map((m) => ({ name: m, value: robots.filter((r) => r.mode === m).length }));
  const cats = THREAT_CATEGORIES.map((c) => ({ name: c, value: events.filter((e) => e.category === c).length * 7 + c.length }));
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  return (
    <div>
      <PageHeader title="Security Overview" sub="Real-time posture across all protected robots" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Protected Robots" value={robots.length} sub="across 3 sites" icon={Bot} />
        <Kpi label="Online / Offline" value={<>{online}<span className="text-muted-foreground"> / {robots.length - online}</span></>} sub="Offline robots stay protected locally" icon={Wifi} tone="text-info" />
        <Kpi label="Active Threats" value={active} sub="open incidents" icon={ShieldAlert} tone="text-critical" />
        <Kpi label="Blocked Attacks (24h)" value={blocked.toLocaleString()} sub="+ live" icon={ShieldBan} tone="text-warning" />
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex flex-col items-center p-4">
            <p className="self-start text-xs text-muted-foreground">Fleet Security Score</p>
            <Gauge value={fleetScore(robots)} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Threat timeline · last 24h</CardTitle>
            <span className="flex items-center gap-1.5 text-xs text-success"><span className="pulse-dot size-2 rounded-full bg-current" />Live</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--critical)" stopOpacity={0.4} /><stop offset="1" stopColor="var(--critical)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--success)" stopOpacity={0.4} /><stop offset="1" stopColor="var(--success)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} width={30} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="threats" name="Threats" stroke="var(--critical)" fill="url(#gT)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke="var(--success)" fill="url(#gB)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Protection modes</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={modes} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {modes.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-4 flex justify-center gap-4 text-xs">
              {modes.map((m, i) => (
                <span key={m.name} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colors[i] }} />{m.name} · {m.value}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top threat categories</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={cats} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={110} tickLine={false} axisLine={false} />
                <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Live security events</CardTitle>
            <Link to="/threats" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="h-72 overflow-hidden">
            {events.slice(0, 7).map((e) => <EventRow key={e.id} e={e} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Sites</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {SITES.map((s) => {
              const rs = robots.filter((r) => r.site === s.name);
              return (
                <div key={s.name} className="flex items-center gap-3 rounded-lg border bg-surface p-3">
                  <div className="grid size-9 place-items-center rounded-md bg-accent"><Factory className="size-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.city} · {rs.length} robots</p>
                  </div>
                  <span className={cn("text-xs font-medium", s.health === "Healthy" ? "text-success" : "text-warning")}>{s.health}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
