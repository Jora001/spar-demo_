import { create } from "zustand";
import { makeEvent, makeEvents, makeIncidents, makeRobots, makeTimeline, rand } from "./mock-data";
import type { Incident, IncidentStatus, Notification, PlanId, Robot, SecEvent, Severity } from "./types";

const robots = makeRobots();

export type RobotAction = "isolate" | "block" | "restart" | "safe" | "release";

interface State {
  loggedIn: boolean;
  plan: PlanId;
  expired: boolean;
  robots: Robot[];
  events: SecEvent[];
  incidents: Incident[];
  timeline: { label: string; threats: number; blocked: number }[];
  notifications: Notification[];
  blocked24h: number;
  login: () => void;
  logout: () => void;
  tick: () => SecEvent;
  pushEvent: (e: Omit<SecEvent, "id" | "time">) => SecEvent;
  notify: (title: string, severity: Severity) => void;
  markAllRead: () => void;
  addIncident: (i: Incident) => void;
  setIncidentStatus: (id: string, s: IncidentStatus, actor?: string) => void;
  decide: (id: string, d: "approved" | "rejected") => void;
  robotAction: (robotId: string, a: RobotAction) => void;
  addRobot: (r: Robot) => void;
  setExpired: (v: boolean) => void;
  setPlan: (p: PlanId) => void;
}

let n = 0;
const uid = (p: string) => `${p}${Date.now()}${n++}`;

export const useStore = create<State>((set, get) => ({
  loggedIn: false,
  plan: "Enterprise",
  expired: false,
  robots,
  events: makeEvents(robots),
  incidents: makeIncidents(robots),
  timeline: makeTimeline(),
  notifications: [
    { id: "n1", time: Date.now() - 600_000, title: "Unsigned firmware detected on ARM-Orion-02", severity: "high", read: false },
    { id: "n2", time: Date.now() - 1_800_000, title: "Velocity override blocked on AMR-Atlas-01", severity: "critical", read: false },
    { id: "n3", time: Date.now() - 3_600_000, title: "Weekly report ready", severity: "info", read: true },
  ],
  blocked24h: 1284,
  login: () => set({ loggedIn: true }),
  logout: () => set({ loggedIn: false }),
  tick: () => {
    const e = makeEvent(get().robots);
    set((s) => {
      const tl = [...s.timeline];
      const last = { ...(tl[tl.length - 1] ?? {label: "Now", threats: 0, blocked: 0}) };
      last.threats += 1;
      if (e.severity !== "info") last.blocked += rand() > 0.15 ? 1 : 0;
      tl[tl.length - 1] = last;
      return {
        events: [e, ...s.events].slice(0, 120),
        timeline: tl,
        blocked24h: s.blocked24h + (e.severity !== "info" ? 1 : 0),
      };
    });
    if (e.severity === "critical") get().notify(`${e.message} — ${e.robotName}`, "critical");
    return e;
  },
  pushEvent: (ev) => {
    const e = { ...ev, id: uid("e"), time: Date.now() };
    set((s) => ({ events: [e, ...s.events].slice(0, 120) }));
    return e;
  },
  notify: (title, severity) =>
    set((s) => ({ notifications: [{ id: uid("n"), time: Date.now(), title, severity, read: false }, ...s.notifications].slice(0, 30) })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((x) => ({ ...x, read: true })) })),
  addIncident: (i) => set((s) => ({ incidents: [i, ...s.incidents] })),
  setIncidentStatus: (id, status, actor = "jora@roboshield.io") =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, status, audit: [...i.audit, { time: Date.now(), actor, text: `Status changed to ${status}` }] } : i,
      ),
    })),
  decide: (id, d) =>
    set((s) => ({
      robots: s.robots.map(r => {
        const inc = s.incidents.find(i => i.id === id && !i.decision);
        if (!inc || d !== "approved" || inc.robotId !== r.id) return r;
        return { ...r, safeMode: r.safeMode === true || inc.category === "Unauthorized command", isolated: r.isolated === true || inc.category === "Network anomaly", risk: Math.max(5, r.risk - 20) };
      }),
      incidents: s.incidents.map((i) =>
        i.id === id && !i.decision
          ? {
              ...i,
              decision: d,
              status: d === "approved" ? "Contained" : "Investigating",
              audit: [
                ...i.audit,
                { time: Date.now(), actor: "jora@roboshield.io", text: d === "approved" ? `Approved: ${i.recommendedAction}` : "Rejected recommended action" },
                ...(d === "approved" ? [{ time: Date.now() + 1, actor: "Response Engine", text: "Response executed. Safety Controller untouched." }] : []),
              ],
            }
          : i,
      ),
    })),
  robotAction: (robotId, a) =>
    set((s) => ({
      robots: s.robots.map((r) =>
        r.id !== robotId
          ? r
          : a === "isolate"
            ? { ...r, isolated: true }
            : a === "safe"
              ? { ...r, safeMode: true }
              : a === "release"
                ? { ...r, isolated: false, safeMode: false }
                : a === "block"
                  ? { ...r, risk: Math.max(5, r.risk - 15) }
                  : { ...r, lastSeen: Date.now() },
      ),
    })),
  addRobot: (r) => set((s) => ({ robots: [r, ...s.robots] })),
  setExpired: (v) => set((s) => ({ expired: v, robots: s.robots.map(r => ({...r, safeMode: v || r.safeMode === true})) })),
  setPlan: (p) => { get().setExpired(false); set({ plan: p }); },
}));

export function fleetScore(rs: Robot[]) {
  const avg = rs.reduce((a, r) => a + r.risk, 0) / rs.length;
  return Math.round(100 - avg * 0.7);
}
