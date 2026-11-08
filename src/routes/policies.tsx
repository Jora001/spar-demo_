import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ShieldCheck, Upload, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/rs/badges';
import { pageMeta } from '@/lib/page-meta';
import { useStore } from '@/lib/store';
export const Route = createFileRoute('/policies')({ head: () => pageMeta('Safety Policy Engine', 'Safety-first policy rules for every robot in the fleet.'), component: Policies });
const rules = [
 ['Preserve manufacturer safety limits', 'Motion envelope, speed and force limits remain under the physical safety controller.'],
 ['E-Stop integrity protection', 'Detect changes to emergency-stop configuration and safety wiring state.'],
 ['Human-in-the-loop for critical actions', 'An operator must approve isolation and restricted motion responses.'],
 ['Fail-safe modes', 'Keep core protection active during cloud outages or entitlement changes.'],
 ['Immutable audit log', 'Append-only evidence of every detection, decision and response.'],
];
function Policies() {
 const count = useStore(s=>s.robots.length); const notify = useStore(s=>s.notify);
 const [enabled,setEnabled]=useState([true,true,true,true,true]); const [progress,setProgress]=useState<number|null>(null);
 const [sets,setSets]=useState([true,true,true]);
 useEffect(()=>{ if(progress===null || progress>=100) return; const id=setTimeout(()=>setProgress(v=>Math.min(100,(v??0)+20)),400); return ()=>clearTimeout(id); },[progress]);
 useEffect(()=>{if(progress===100){toast.success(`Policy deployed to ${count} robots`);notify('Safety policy deployment complete','info');}},[progress,count,notify]);
 return <div><PageHeader title="Safety Policy Engine" sub="Physical safety always has the final authority"><Button disabled={progress!==null && progress<100} onClick={()=>setProgress(0)}><Upload/>Deploy to fleet</Button></PageHeader>
 <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4"><ShieldCheck className="size-6 text-success"/><div><p className="font-semibold">Safety-first, by design</p><p className="text-sm text-muted-foreground">Cyber-response never overrides the robot's Safety Controller / E-Stop.</p></div></div>
 {progress!==null && <div className="mb-6"><div className="mb-2 flex justify-between text-sm"><span>{progress===100?'Deployment complete':'Deploying policy bundle…'}</span><span>{progress}%</span></div><Progress value={progress}/></div>}
 <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]"><section><h2 className="mb-3 text-lg font-semibold">Safety invariants</h2>{rules.map(([title,desc],i)=><div key={title} className="flex items-center gap-4 border-b py-5"><div className="flex-1"><p className="flex items-center gap-2 font-medium">{title}{i<3 && <LockKeyhole className="size-3 text-muted-foreground"/>}</p><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div><Switch aria-label={title} checked={enabled[i]??true} disabled={i<3} onCheckedChange={v=>setEnabled(a=>a.map((x,j)=>j===i?v:x))}/></div>)}</section>
 <section><h2 className="mb-3 text-lg font-semibold">Fleet rulesets</h2>{['Production floor • strict','Warehouse navigation • balanced','Lab development • monitored'].map((name,i)=><div key={name} className="mb-3 flex items-center justify-between rounded-lg border bg-card p-4"><div><p className="text-sm font-medium">{name}</p><p className="mt-1 text-xs text-muted-foreground">v2.4 · signed policy bundle</p></div><Switch aria-label={name} checked={sets[i]??false} onCheckedChange={v=>setSets(a=>a.map((x,j)=>j===i?v:x))}/></div>)}<p className="text-xs text-muted-foreground">Mandatory safety invariants cannot be disabled by cyber policy.</p></section></div></div>;
}
