import { describe, it, expect } from 'vitest';
import { useStore } from '@/lib/store';
describe('RoboShield safety demo',()=>{
 it('has 24 heterogeneous robots and three protection modes',()=>{const r=useStore.getState().robots;expect(r).toHaveLength(24);expect(new Set(r.map(x=>x.mode))).toEqual(new Set(['Agent','Gateway','SDK/API']));});
 it('expiry restricts robots without removing their local protection',()=>{const before=useStore.getState().robots.map(r=>r.mode);useStore.getState().setExpired(true);expect(useStore.getState().robots.every(r=>r.safeMode)).toBe(true);expect(useStore.getState().robots.map(r=>r.mode)).toEqual(before);useStore.getState().setExpired(false);});
 it('rejected response remains investigating, not contained',()=>{const id='INC-2041';useStore.getState().decide(id,'rejected');expect(useStore.getState().incidents.find(i=>i.id===id)?.status).toBe('Investigating');});
 it('decisions cannot rewrite prior audit evidence',()=>{const id='INC-2042';useStore.getState().decide(id,'approved');const audit=useStore.getState().incidents.find(i=>i.id===id)?.audit;useStore.getState().decide(id,'rejected');expect(useStore.getState().incidents.find(i=>i.id===id)?.audit).toEqual(audit);expect(useStore.getState().incidents.find(i=>i.id===id)?.status).toBe('Contained');});
});
