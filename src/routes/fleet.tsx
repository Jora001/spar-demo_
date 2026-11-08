import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { ConnBadge, ModeBadge, PageHeader, RiskPill, ago } from "@/components/rs/badges";
import { MODES, VENDORS } from "@/lib/mock-data";
import { AddRobotWizard } from "@/components/rs/add-robot-wizard";
import type { Robot } from "@/lib/types";

export const Route = createFileRoute("/fleet")({
  validateSearch: (search: Record<string, unknown>): {q?: string} => typeof search.q === "string" ? {q: search.q} : {},
  head: () => ({
    meta: [
      { title: "Robot Fleet — RoboShield" },
      { name: "description", content: "Device registry of every protected robot with vendor, protection mode and risk score." },
      { property: "og:title", content: "Robot Fleet — RoboShield" },
      { property: "og:description", content: "Device registry of every protected robot." },
    ],
  }),
  component: Fleet,
});

type SortKey = "name" | "risk" | "lastSeen";

function Filter({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-40"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const riskLevel = (v: number) => (v >= 70 ? "High" : v >= 40 ? "Medium" : "Low");

function Fleet() {
  const robots = useStore((s) => s.robots);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [vendor, setVendor] = useState("all");
  const [mode, setMode] = useState("all");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "risk", dir: -1 });
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    return robots
      .filter((r) => (q ? `${r.name} ${r.uuid} ${r.os}`.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => vendor === "all" || r.vendor === vendor)
      .filter((r) => mode === "all" || r.mode === mode)
      .filter((r) => status === "all" || r.connection === status)
      .filter((r) => risk === "all" || riskLevel(r.risk) === risk)
      .sort((a, b) => {
        const x = a[sort.k] as string | number, y = b[sort.k] as string | number;
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
      });
  }, [robots, q, vendor, mode, status, risk, sort]);

  const H = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button className="inline-flex items-center gap-1" onClick={() => setSort({ k, dir: sort.k === k ? (-sort.dir as 1 | -1) : 1 })}>
      {children}<ArrowUpDown className="size-3" />
    </button>
  );

  return (
    <div>
      <PageHeader title="Robot Fleet" sub={`${robots.length} robots registered`}>
        <Button onClick={() => setOpen(true)}><Plus />Add Robot</Button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, UUID, OS" className="h-9 pl-8" />
        </div>
        <Filter value={vendor} onChange={setVendor} label="Vendors" options={VENDORS} />
        <Filter value={mode} onChange={setMode} label="Modes" options={MODES} />
        <Filter value={status} onChange={setStatus} label="Statuses" options={["Online", "Offline", "Offline-Protected"]} />
        <Filter value={risk} onChange={setRisk} label="Risk levels" options={["High", "Medium", "Low"]} />
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><H k="name">Name</H></TableHead>
              <TableHead>UUID</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>OS / Platform</TableHead>
              <TableHead>Protection</TableHead>
              <TableHead>Connection</TableHead>
              <TableHead><H k="risk">Risk</H></TableHead>
              <TableHead><H k="lastSeen">Last seen</H></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: Robot) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate({ to: "/robots/$robotId", params: { robotId: r.id } })}>
                <TableCell>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.kind} · {r.site}</p>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.uuid.slice(0, 13)}…</TableCell>
                <TableCell>{r.vendor}</TableCell>
                <TableCell className="text-xs">{r.os}</TableCell>
                <TableCell><ModeBadge m={r.mode} /></TableCell>
                <TableCell><ConnBadge c={r.connection} /></TableCell>
                <TableCell><RiskPill v={r.risk} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{ago(r.lastSeen)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No robots match these filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <AddRobotWizard open={open} onOpenChange={setOpen} />
    </div>
  );
}
