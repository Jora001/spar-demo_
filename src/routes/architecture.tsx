import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowDown, Bot, Cloud, Cpu, Network, Plug, ShieldCheck, WifiOff, AppWindow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/rs/badges';
import { pageMeta } from '@/lib/page-meta';
import { cn } from '@/lib/utils';
export const Route=createFileRoute('/architecture')({head:()=>pageMeta('Architecture','Explore cloud-connected and autonomous robot protection.'),component:Architecture});
const blocks=[
 {name:'Customer Application',icon:AppWindow,desc:'Operator console and customer applications use authenticated APIs to manage fleets and receive security telemetry.'},
 {name:'Cloud Management Platform',icon:Cloud,desc:'Central fleet registry, correlation, policy distribution, entitlement management and immutable incident evidence. Local protection does not depend on connectivity.'},
 {name:'SDK/API Connector',icon:Plug,desc:'Wraps vendor command APIs, validates callers and monitors exposed robot telemetry without shell access.'},
 {name:'Security Agent',icon:Cpu,desc:'On-robot EDR, process monitoring, integrity checks and behavior analysis. Cached policies continue to protect the robot offline.'},
 {name:'OT Gateway',icon:Network,desc:'Inline network IDS/IPS for closed platforms. Filters network traffic without modifying the robot OS.'},
 {name:'Robot Security Engine',icon:ShieldCheck,desc:'EDR, IDS/IPS, behavior analysis, API security, integrity monitoring and incident response execute under the Safety Policy Engine.'},
 {name:'Robots A / B / C',icon:Bot,desc:'Heterogeneous AMRs, quadrupeds and industrial arms. Physical Safety Controller and E-Stop remain independent and authoritative.'}
];
function Architecture(){const[offline,setOffline]=useState(false);const[sel,setSel]=useState(3);const current=blocks[sel];
 const node=(i:number)=>{const b=blocks[i];if(!b)return null;return <Button key={b.name} variant="outline" onClick={()=>setSel(i)} className={cn('h-auto min-h-20 w-full flex-col gap-2 whitespace-normal p-4',sel===i&&'border-primary bg-primary/5',offline&&i===1&&'border-dashed opacity-45')}><b.icon className="size-6 text-primary"/><span>{b.name}</span>{offline&&i===1&&<span className="text-xs text-critical">Disconnected</span>}</Button>};
 return <div><PageHeader title="Platform Architecture" sub="Cloud orchestration. Local protection. Independent safety."><label className="flex items-center gap-2 text-sm"><WifiOff className="size-4"/>Offline mode<Switch checked={offline} onCheckedChange={setOffline}/></label></PageHeader>
 {offline&&<div className="mb-5 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success">Autonomous protection active · cached policies and local detection engines remain operational</div>}
 <div className="grid gap-8 lg:grid-cols-[1fr_300px]"><div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3"><div className="w-64">{node(0)}</div><ArrowDown className="size-5 text-primary"/><div className="w-72">{node(1)}</div><ArrowDown className={cn('size-5 text-primary',offline&&'opacity-20')}/><div className="grid w-full grid-cols-3 gap-3">{[2,3,4].map(node)}</div><ArrowDown className="size-5 text-success"/><div className="w-full">{node(5)}</div><div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">{['EDR','IDS/IPS','Behavior Analysis','API Security','Integrity Monitoring','Incident Response'].map(n=><span key={n} className="rounded border bg-card px-2 py-1">{n}</span>)}</div><ArrowDown className="size-5 text-success"/><div className="w-72">{node(6)}</div></div>
 <aside className="h-fit border-l pl-6"><h2 className="text-lg font-semibold">{current?.name}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current?.desc}</p><div className="mt-6 border-t pt-4"><ShieldCheck className="mb-2 size-7 text-success"/><p className="text-sm font-semibold">Safety boundary</p><p className="mt-1 text-xs text-muted-foreground">Cyber controls may restrict access, but never disable physical safety limits or E-Stop.</p></div></aside></div></div>;
}
