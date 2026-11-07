import { Check, Database, Filter, Gauge, Radar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const PIPELINE = [
  { label: "Data Collection", icon: Database },
  { label: "Normalization", icon: Filter },
  { label: "Detection & Correlation", icon: Radar },
  { label: "Risk Assessment", icon: Gauge },
  { label: "Response", icon: Zap },
];

/** active = index of the step in progress; steps before it are complete. */
export function Pipeline({ active }: { active: number }) {
  return (
    <div className="flex items-center">
      {PIPELINE.map((p, i) => {
        const done = i < active, cur = i === active;
        return (
          <div key={p.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className={cn(
                "grid size-10 place-items-center rounded-full border-2 transition-all duration-500",
                done && "border-success bg-success text-primary-foreground",
                cur && "scale-110 border-primary bg-primary/15 text-primary shadow-glow",
                !done && !cur && "border-border text-muted-foreground",
              )}>
                {done ? <Check className="size-4" /> : <p.icon className={cn("size-4", cur && "animate-pulse")} />}
              </div>
              <span className={cn("w-20 text-[11px] leading-tight", done || cur ? "text-foreground" : "text-muted-foreground")}>{p.label}</span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className="mx-1 mb-6 h-0.5 flex-1 overflow-hidden rounded bg-border">
                <div className={cn("h-full bg-success transition-all duration-700", done ? "w-full" : "w-0")} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
