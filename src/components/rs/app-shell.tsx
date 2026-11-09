import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Activity, Bell, Boxes, Crosshair, FileText, LayoutDashboard, LogOut, Moon, Network, Search, Settings, ShieldAlert,
  ShieldCheck, Sun, Swords, CreditCard, Bot,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { SeverityBadge, ago } from "./badges";
import { useState } from "react";

const groups = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Robot Fleet", url: "/fleet", icon: Bot },
      { title: "Threats & Incidents", url: "/threats", icon: ShieldAlert },
      { title: "Attack Simulation", url: "/simulation", icon: Swords },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Safety Policy Engine", url: "/policies", icon: ShieldCheck },
      { title: "Architecture", url: "/architecture", icon: Network },
      { title: "Subscription", url: "/subscription", icon: CreditCard },
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
] as const;

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
        <ShieldCheck className="size-4.5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-sm font-bold">RoboShield</p>
          <p className="text-[10px] uppercase tracking-widest opacity-60">RCaaS</p>
        </div>
      )}
    </div>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const active = (u: string) => (u === "/" ? path === "/" : path.startsWith(u) || (u === "/fleet" && path.startsWith("/robots")));
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Logo compact={state === "collapsed"} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active(it.url)} tooltip={it.title}>
                      <Link to={it.url}>
                        <it.icon />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {state !== "collapsed" && (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/20 p-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-success">
              <Activity className="size-3.5" /> All engines operational
            </div>
            <p className="mt-1 opacity-60">EDR · IDS/IPS · Integrity</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle theme">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function Bellmenu() {
  const notes = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markAllRead);
  const unread = notes.filter((n) => !n.read).length;
  return (
    <DropdownMenu onOpenChange={(o) => !o && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Recent alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-auto">
          {notes.slice(0, 8).map((n) => (
            <div key={n.id} className="flex gap-2 px-2 py-2 text-sm">
              <SeverityBadge s={n.severity} className="h-fit" />
              <div className="min-w-0">
                <p className={n.read ? "text-muted-foreground" : ""}>{n.title}</p>
                <p className="text-xs text-muted-foreground">{ago(n.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const tick = useStore((s) => s.tick);
  const plan = useStore((s) => s.plan);
  const expired = useStore((s) => s.expired);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        const e = tick();
        if (e.severity === "critical") toast.error("Critical event", { description: `${e.message} — ${e.robotName}` });
        loop();
      }, 4000 + Math.random() * 2000);
    };
    loop();
    return () => clearTimeout(t);
  }, [tick]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger />
            <div className="relative hidden max-w-sm flex-1 md:block">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search robots…" className="h-9 bg-card pl-8" onKeyDown={(e) => { if(e.key === "Enter") navigate({to: "/fleet", search: {q: e.currentTarget.value}}); }} />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-warning">
                DEMO MODE
              </span>
              <Link to="/subscription" className="hidden sm:block">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${expired ? "bg-critical/15 text-critical" : "bg-primary/15 text-primary"}`}>
                  {expired ? `${plan} · Expired` : plan}
                </span>
              </Link>
              <ThemeToggle />
              <Bellmenu />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 rounded-full" aria-label="Account">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-accent text-xs">JH</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    Jora Hovsepyan
                    <p className="text-xs font-normal text-muted-foreground">Clinical SAS Programmer</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    <Settings /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/subscription" })}>
                    <Boxes /> Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate({ to: "/login" });
                    }}
                  >
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="bg-glow flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export { Crosshair };
