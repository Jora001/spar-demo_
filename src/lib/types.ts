export type ProtectionMode = "SDK/API" | "Agent" | "Gateway";
export type Connection = "Online" | "Offline" | "Offline-Protected";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type IncidentStatus = "New" | "Investigating" | "Contained" | "Resolved";
export type Impact = "Low" | "Medium" | "High";
export type PlanId = "Basic" | "Pro" | "Enterprise";

export interface Robot {
  id: string;
  name: string;
  uuid: string;
  vendor: string;
  kind: "AMR" | "Robotic Arm" | "Quadruped";
  os: string;
  mode: ProtectionMode;
  connection: Connection;
  risk: number;
  lastSeen: number;
  site: string;
  battery: number;
  uptimeH: number;
  firmware: string;
  ip: string;
  mac: string;
  isolated?: boolean;
  safeMode?: boolean;
}

export interface SecEvent {
  id: string;
  time: number;
  robotId: string;
  robotName: string;
  severity: Severity;
  category: string;
  message: string;
}

export interface AuditEntry {
  time: number;
  actor: string;
  text: string;
}

export interface Incident {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  confidence: number;
  robotId: string;
  robotName: string;
  status: IncidentStatus;
  createdAt: number;
  impact: Impact;
  explanation: string;
  recommendedAction: string;
  decision?: "approved" | "rejected";
  audit: AuditEntry[];
}

export interface Notification {
  id: string;
  time: number;
  title: string;
  severity: Severity;
  read: boolean;
}
