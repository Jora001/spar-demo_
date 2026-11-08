import { createFileRoute } from '@tanstack/react-router';
import { Check, Crown, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/rs/badges';
import { pageMeta } from '@/lib/page-meta';
import { useStore } from '@/lib/store';
import type { PlanId } from '@/lib/types';
export const Route=createFileRoute('/subscription')({head:()=>pageMeta('Subscription & Entitlements','Compare plans and simulate a safe entitlement expiry.'),component:Subscription});
const features=['EDR','Network IDS/IPS','AI Detection','API Security','Fleet Management','Custom Reports'];
const plans: {id:PlanId;desc:string;features:boolean[]}[]=[{id:'Basic',desc:'Essential command protection',features:[false,false,false,true,false,false]},{id:'Pro',desc:'Advanced robot protection',features:[true,true,true,true,true,false]},{id:'Enterprise',desc:'Complete fleet security',features:[true,true,true,true,true,true]}];
function Subscription(){const plan=useStore(s=>s.plan);const expired=useStore(s=>s.expired);const setExpired=useStore(s=>s.setExpired);const setPlan=useStore(s=>s.setPlan);const robots=useStore(s=>s.robots);
return <div><PageHeader title="Subscription & Entitlements" sub="Flexible protection for every stage of your robot fleet"/>
<div className="grid gap-4 md:grid-cols-3">{plans.map(p=><Card key={p.id} className={p.id===plan?'border-primary/50 bg-primary/5':''}><CardContent className="p-6"><Crown className="mb-3 size-7 text-primary"/><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{p.id}</h2>{p.id===plan&&<span className="rounded bg-primary/15 px-2 py-1 text-xs text-primary">Current plan</span>}</div><p className="my-3 text-sm text-muted-foreground">{p.desc}</p><div className="space-y-3 py-4">{features.map((f,i)=><div key={f} className="flex items-center gap-2 text-sm">{p.features[i]?<Check className="size-4 text-success"/>:<Lock className="size-4 text-muted-foreground"/>}<span className={!p.features[i]?'text-muted-foreground':''}>{f}</span></div>)}</div><Button variant={p.id===plan?'default':'outline'} className="mt-3 w-full" disabled={p.id===plan&&!expired} onClick={()=>{setPlan(p.id);toast.success(`${p.id} plan activated (demo)`);}}>{p.id===plan?(expired?'Renew demo plan':'Active'):'Choose demo plan'}</Button></CardContent></Card>)}</div>
<section className="mt-8 border-t pt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Entitlement lifecycle</h2><p className="mt-1 text-sm text-muted-foreground">Core local protection stays active even when a subscription expires.</p></div><Button variant={expired?'default':'outline'} onClick={()=>{setExpired(!expired);toast(expired?'Subscription restored':'Subscription expired — Restricted Safe state active');}}>{expired?'Restore subscription':'Simulate subscription expiry'}</Button></div>
{expired&&<div className="mt-5 rounded-lg border border-warning/40 bg-warning/10 p-4"><p className="font-semibold text-warning">Restricted Safe state · {robots.length} robots</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><p className="flex items-center gap-2 text-sm"><ShieldCheck className="size-5 text-success"/>Core local EDR / network protection active</p><p className="flex items-center gap-2 text-sm"><Lock className="size-5 text-warning"/>Premium AI detection & custom reports locked</p></div></div>}</section></div>;
}
