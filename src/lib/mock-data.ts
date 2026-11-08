import type { Incident, ProtectionMode, Robot, SecEvent, Severity } from "./types";

let seed = 42;
export function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
export const pick = <T,>(arr: T[]): T => {
  const item = arr[Math.floor(rand() * arr.length)];
  if (item === undefined) throw new Error("Cannot sample empty demo data");
  return item;
};
const hex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join("");

export const VENDORS = ["Vendor A", "Vendor B", "ROS 2 custom", "Custom API"];
export const MODES: ProtectionMode[] = ["SDK/API", "Agent", "Gateway"];
export const SITES = [
  { name: "Factory A", city: "Yerevan", health: "Healthy" as const },
  { name: "Warehouse B", city: "Rotterdam", health: "Degraded" as const },
  { name: "Lab C", city: "Munich", health: "Healthy" as const },
];
export const THREAT_CATEGORIES = [
  "Network anomaly",
  "Unauthorized command",
  "Firmware change",
  "Suspicious process",
  "API abuse",
];

const NAMES = [
  "Atlas", "Orion", "Vega", "Nova", "Kestrel", "Titan", "Lynx", "Echo", "Falcon", "Rover",
  "Spark", "Helix", "Comet", "Argo", "Pulse", "Quill", "Sable", "Draco", "Iris", "Bolt",
  "Ember", "Juno", "Zephyr", "Onyx",
];
const KINDS: Robot["kind"][] = ["AMR", "Robotic Arm", "Quadruped"];
const OS = ["Ubuntu 22.04 + ROS 2 Humble", "Ubuntu 20.04 + ROS 2 Foxy", "Vendor RTOS", "Yocto Linux", "Windows IoT"];

const NOW = Date.now();

export function makeRobots(): Robot[] {
  return NAMES.map((n, i) => {
    const kind = (KINDS[i % 3] ?? "AMR");
    const vendor = (VENDORS[i % 4] ?? "Vendor A");
    const os = vendor === "Vendor B" ? "Vendor RTOS" : vendor === "Custom API" ? pick(["Yocto Linux", "Windows IoT"]) : pick(OS.slice(0, 2));
    const mode: ProtectionMode = os === "Vendor RTOS" ? "Gateway" : vendor === "Custom API" ? "SDK/API" : pick<ProtectionMode>(["Agent", "Agent", "SDK/API"]);
    const r = rand();
    const connection = r < 0.75 ? "Online" : r < 0.88 ? "Offline-Protected" : "Offline";
    const prefix = kind === "AMR" ? "AMR" : kind === "Robotic Arm" ? "ARM" : "QDR";
    return {
      id: `r${i + 1}`,
      name: `${prefix}-${n}-${String(i + 1).padStart(2, "0")}`,
      uuid: `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`,
      vendor,
      kind,
      os,
      mode,
      connection,
      risk: Math.round(5 + rand() * (i % 5 === 0 ? 85 : 45)),
      lastSeen: NOW - Math.floor(rand() * (connection === "Online" ? 60 : 7200)) * 1000,
      site: (SITES[i % 3]?.name ?? "Factory A"),
      battery: Math.round(25 + rand() * 75),
      uptimeH: Math.round(rand() * 900),
      firmware: `v${1 + (i % 3)}.${Math.floor(rand() * 9)}.${Math.floor(rand() * 20)}`,
      ip: `10.${10 + (i % 3)}.${Math.floor(rand() * 250)}.${Math.floor(10 + rand() * 240)}`,
      mac: Array.from({ length: 6 }, () => hex(2)).join(":"),
    } satisfies Robot;
  });
}

export const EVENT_TEMPLATES: { category: string; severity: Severity; message: string }[] = [
  { category: "Network anomaly", severity: "medium", message: "Unusual outbound traffic to 185.220.x.x:4444" },
  { category: "Network anomaly", severity: "low", message: "Port scan detected from internal host" },
  { category: "Unauthorized command", severity: "high", message: "Motion command from unregistered client blocked" },
  { category: "Unauthorized command", severity: "critical", message: "Velocity override attempt beyond policy limits" },
  { category: "Firmware change", severity: "high", message: "Unsigned firmware package checksum mismatch" },
  { category: "Suspicious process", severity: "medium", message: "Unknown binary /tmp/.x spawned by ros2 node" },
  { category: "Suspicious process", severity: "critical", message: "Crypto-miner signature detected in process memory" },
  { category: "API abuse", severity: "medium", message: "Rate limit exceeded on /api/v1/move" },
  { category: "API abuse", severity: "low", message: "Expired token reuse attempt" },
  { category: "Policy", severity: "info", message: "Integrity baseline verified" },
  { category: "Policy", severity: "info", message: "Agent heartbeat restored" },
];

let evtCounter = 1000;
export function makeEvent(robots: Robot[], time = Date.now(), tpl = pick(EVENT_TEMPLATES)): SecEvent {
  const r = pick(robots);
  return { id: `e${evtCounter++}`, time, robotId: r.id, robotName: r.name, ...tpl };
}

export function makeEvents(robots: Robot[]): SecEvent[] {
  return Array.from({ length: 40 }, (_, i) => makeEvent(robots, NOW - i * 1000 * (60 + Math.floor(rand() * 600))));
}

export function makeTimeline() {
  return Array.from({ length: 24 }, (_, i) => {
    const h = new Date(NOW - (23 - i) * 3600_000).getHours();
    const threats = Math.round(8 + rand() * 22 + (h > 9 && h < 18 ? 10 : 0));
    return { label: `${String(h).padStart(2, "0")}:00`, threats, blocked: Math.round(threats * (0.7 + rand() * 0.25)) };
  });
}

export function makeIncidents(robots: Robot[]): Incident[] {
  const defs: Omit<Incident, "id" | "robotId" | "robotName" | "createdAt" | "audit">[] = [
    { title: "Velocity override from unknown client", category: "Unauthorized command", severity: "critical", confidence: 94, status: "New", impact: "High", explanation: "Commands could move the arm outside its safe envelope near human operators.", recommendedAction: "Block source client and switch robot to Restricted Safe mode" },
    { title: "Unsigned firmware detected", category: "Firmware change", severity: "high", confidence: 88, status: "Investigating", impact: "Medium", explanation: "Firmware integrity cannot be guaranteed; motion controller behaviour may be altered.", recommendedAction: "Quarantine firmware and roll back to last signed version" },
    { title: "Outbound C2 beacon pattern", category: "Network anomaly", severity: "high", confidence: 81, status: "New", impact: "Low", explanation: "Data exfiltration risk; no direct effect on physical motion.", recommendedAction: "Isolate robot network except safety channel" },
    { title: "Crypto-miner process", category: "Suspicious process", severity: "medium", confidence: 76, status: "Contained", impact: "Low", explanation: "CPU starvation could delay navigation planning.", recommendedAction: "Kill process and restart security agent" },
    { title: "API token brute force", category: "API abuse", severity: "medium", confidence: 69, status: "Investigating", impact: "Low", explanation: "Credential compromise could enable later command injection.", recommendedAction: "Rotate API keys and block source IP" },
    { title: "Lateral movement attempt", category: "Network anomaly", severity: "low", confidence: 58, status: "Resolved", impact: "Low", explanation: "Scan blocked at gateway; no access gained.", recommendedAction: "Keep monitoring" },
  ];
  return defs.map((d, i) => {
    const r = robots[(i * 5) % robots.length] ?? pick(robots);
    const createdAt = NOW - (i + 1) * 47 * 60_000;
    return {
      ...d,
      id: `INC-${2041 + i}`,
      robotId: r.id,
      robotName: r.name,
      createdAt,
      audit: [
        { time: createdAt, actor: "Detection Engine", text: `Incident created from correlated ${d.category.toLowerCase()} events` },
        { time: createdAt + 30_000, actor: "Risk Engine", text: `Severity ${d.severity}, confidence ${d.confidence}%` },
        ...(d.status !== "New" ? [{ time: createdAt + 300_000, actor: "elmira@roboshield.io", text: "Status changed to Investigating" }] : []),
      ],
    };
  });
}

export const CVES = [
  { id: "CVE-2025-31842", pkg: "ros2-rclcpp", severity: "critical" as Severity, cvss: 9.1, fix: true },
  { id: "CVE-2025-22190", pkg: "openssl 3.0.2", severity: "high" as Severity, cvss: 7.5, fix: true },
  { id: "CVE-2024-48102", pkg: "fastdds", severity: "high" as Severity, cvss: 7.2, fix: false },
  { id: "CVE-2024-39811", pkg: "linux-kernel 5.15", severity: "medium" as Severity, cvss: 5.9, fix: true },
  { id: "CVE-2024-11003", pkg: "libusb", severity: "low" as Severity, cvss: 3.1, fix: false },
];
