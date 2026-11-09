import arm from '@/assets/robot-arm.png';
import mobile from '@/assets/mobile-robot.png';
import quad from '@/assets/quadruped.png';
import type { Robot } from '@/lib/types';
export function RobotImage({kind,className='size-16'}:{kind:Robot['kind'];className?:string}){return <img src={kind==='AMR'?mobile:kind==='Quadruped'?quad:arm} alt={`${kind} demo robot`} className={`${className} object-contain`} width={816} height={816} loading="lazy"/>;}
