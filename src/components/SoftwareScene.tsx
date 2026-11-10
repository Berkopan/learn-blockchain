import { useEffect, useRef } from 'react';
import type { Frame, Language, Position, VisualNode } from '../types';
import { palette } from './Projection';

interface Props { frame:Frame; language:Language; playing?:boolean; reducedMotion?:boolean; selected?:string|null; onSelect?:(id:string)=>void; resetKey?:number }
interface Point { x:number; y:number; depth:number }
const short=(s:string,n=22)=>s.length>n?s.slice(0,n-1)+'…':s;
const mix=(hex:string,factor:number)=>{const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,(n>>8)&255,n&255].map(v=>Math.round(v*factor)).join(',')+')';};

/** World-space projection and orbit controls, without a GPU dependency. */
export default function SoftwareScene(props:Props){
 const canvasRef=useRef<HTMLCanvasElement>(null),live=useRef(props);live.current=props;
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const context=canvas.getContext('2d');if(!context)return;const ctx=context;
  let width=600,height=450,dpr=1,yaw=.72,pitch=.48,scale=40,visible=true,raf=0,last=0,elapsed=0,resetSeen=live.current.resetKey;
  let pointer:{x:number;y:number;startX:number;startY:number}|null=null;
  const positions=new Map<string,Position>();let hits:{id:string;x:number;y:number;depth:number;r:number}[]=[];
  const project=(p:Position):Point=>{const rx=Math.cos(yaw)*p[0]-Math.sin(yaw)*p[2],depth=Math.sin(yaw)*p[0]+Math.cos(yaw)*p[2];return{x:width/2+rx*scale,y:height*.46+(depth*Math.sin(pitch)-p[1]*Math.cos(pitch))*scale,depth:depth*Math.cos(pitch)+p[1]*Math.sin(pitch)};};
  const polygon=(points:Point[],fill:string,stroke='rgba(55,44,72,.12)')=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();};
  const box=(p:Position,size:Position,color:string)=>{
   const [w,h,d]=size,x=p[0],y=p[1],z=p[2];
   const verts:Position[]=[[-w/2,-h/2,-d/2],[w/2,-h/2,-d/2],[w/2,-h/2,d/2],[-w/2,-h/2,d/2],[-w/2,h/2,-d/2],[w/2,h/2,-d/2],[w/2,h/2,d/2],[-w/2,h/2,d/2]];
   const v=verts.map(a=>project([a[0]+x,a[1]+y,a[2]+z]));
   const faces=[{ids:Math.sin(yaw)>0?[1,2,6,5]:[0,3,7,4],color:mix(color,.81)},{ids:Math.cos(yaw)>0?[2,3,7,6]:[0,1,5,4],color:mix(color,.93)},{ids:[4,5,6,7],color}];
   faces.sort((a,b)=>a.ids.reduce((s,i)=>s+v[i].depth,0)-b.ids.reduce((s,i)=>s+v[i].depth,0));
   for(const face of faces)polygon(face.ids.map(i=>v[i]),face.color);
  };
  const line=(a:Position,b:Position,color:string,lineWidth=1)=>{const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();};
  const pill=(label:string,x:number,y:number,fontSize:number,color:string)=>{
   ctx.font='600 '+fontSize+'px "Manrope Variable", sans-serif';const w=ctx.measureText(label).width+14,h=fontSize+10;
   ctx.fillStyle='rgba(255,255,255,.94)';ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,5);ctx.fill();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(label,x,y+.5);
  };
  const drawNode=(node:VisualNode,p:Position)=>{
   const color=palette[node.status||'idle'],s=node.scale||1,q=project(p),floor=project([p[0],-.65,p[2]]);
   ctx.save();ctx.translate(floor.x,floor.y);ctx.scale(1,.34);const shadow=ctx.createRadialGradient(0,0,0,0,0,scale*.72*s);shadow.addColorStop(0,'rgba(47,35,65,.17)');shadow.addColorStop(1,'rgba(47,35,65,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,scale*.72*s,0,Math.PI*2);ctx.fill();ctx.restore();
   if(node.id===live.current.selected){ctx.strokeStyle='#82669b';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(floor.x,floor.y,scale*.68*s,scale*.25*s,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
   const kind=node.kind||'node',at=(dy:number):Position=>[p[0],p[1]+dy*s,p[2]];
   if(kind==='node'){
    box(at(-.05),[.78*s,.82*s,.73*s],'#f8f7fc');box(at(.41),[.66*s,.1*s,.62*s],color);
    for(let i=0;i<3;i++){const z=Math.cos(yaw)>0?.377:-.377;line([p[0]-.23*s,p[1]+(.17-i*.17)*s,p[2]+z*s],[p[0]+.23*s,p[1]+(.17-i*.17)*s,p[2]+z*s],'#c9c6d7',Math.max(1,scale*.023));}
    const dot=project([p[0]+.23*s,p[1]-.29*s,p[2]+(Math.cos(yaw)>0?.38:-.38)*s]);ctx.fillStyle=color;ctx.beginPath();ctx.arc(dot.x,dot.y,Math.max(2,scale*.035*s),0,Math.PI*2);ctx.fill();
   }else if(kind==='block'){
    box(p,[.86*s,.7*s,.8*s],color);box(at(.38),[.61*s,.055*s,.55*s],mix(color,1.02));
    for(let i=0;i<3;i++){const z=Math.cos(yaw)>0?.407:-.407;line([p[0]-.22*s,p[1]+(.13-i*.13)*s,p[2]+z*s],[p[0]+.18*s,p[1]+(.13-i*.13)*s,p[2]+z*s],'rgba(255,255,255,.67)',Math.max(1,scale*.027));}
   }else if(kind==='data'){box(p,[.73*s,.24*s,.66*s],color);box(at(.16),[.48*s,.045*s,.42*s],'#ffffff');}
   else if(kind==='gate'){
    box(at(-.1),[.65*s,.48*s,.4*s],color);const top=project(at(.18));ctx.strokeStyle=mix(color,.65);ctx.lineWidth=Math.max(2,scale*.08*s);ctx.beginPath();ctx.arc(top.x,top.y,scale*.18*s,Math.PI,0);ctx.stroke();
   }else{
    const r=scale*.3*s,gradient=ctx.createLinearGradient(q.x-r,q.y-r,q.x+r,q.y+r);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.12,color);gradient.addColorStop(1,mix(color,.72));ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1.5,scale*.03);ctx.beginPath();if(kind==='clock'){ctx.moveTo(q.x,q.y-r*.65);ctx.lineTo(q.x,q.y);ctx.lineTo(q.x+r*.48,q.y+r*.2);}else{ctx.moveTo(q.x-r*.3,q.y-r*.45);ctx.lineTo(q.x+r*.3,q.y);ctx.lineTo(q.x-r*.3,q.y+r*.45);}ctx.stroke();
   }
   const status=node.status||'idle';if(status==='success'||status==='error'||status==='warning'){const x=q.x+scale*.34*s,y=q.y-scale*.36*s;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,6.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(status==='success'?'✓':status==='error'?'×':'!',x,y);}
   const font=live.current.frame.nodes.length>24?10:12,labelY=q.y+scale*.56*s+12;
   pill(short(node.label,26),q.x,labelY,font,'#4e4559');
   if(node.value)pill(short(node.value,28),q.x,labelY+font+10,Math.max(9,font-2),'#72657d');
   hits.push({id:node.id,x:q.x,y:q.y,depth:q.depth,r:Math.max(21,scale*.6*s)});
  };
  const drawLink=(link:Frame['links'][number],index:number)=>{
   const a=positions.get(link.from),b=positions.get(link.to);if(!a||!b)return;
   const p=project(a),q=project(b),m=project([(a[0]+b[0])/2,(a[1]+b[1])/2+.65,(a[2]+b[2])/2]),color=palette[link.status||'idle'];
   ctx.strokeStyle=color;ctx.globalAlpha=link.status==='muted'?.32:.65;ctx.lineWidth=link.status==='active'?2:1.3;
   if(link.status==='error'||link.status==='muted')ctx.setLineDash([4,4]);
   ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(m.x,m.y,q.x,q.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
   const point=(t:number)=>({x:(1-t)*(1-t)*p.x+2*(1-t)*t*m.x+t*t*q.x,y:(1-t)*(1-t)*p.y+2*(1-t)*t*m.y+t*t*q.y});
   if(link.directed){const u=point(.73),v=point(.77),angle=Math.atan2(v.y-u.y,v.x-u.x);ctx.save();ctx.translate(v.x,v.y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-3);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();ctx.restore();}
   if(link.status==='active'||link.status==='success'){const v=point(live.current.playing&&!live.current.reducedMotion?(elapsed*.38+index*.13)%1:.5);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=5;ctx.beginPath();ctx.arc(v.x,v.y,3.3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
   if(link.label&&index<8&&link.status!=='muted'){const v=point(.5);pill(short(link.label,22),v.x,v.y-9,9,'#73617d');}
  };
  const resize=()=>{const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(window.devicePixelRatio||1,1.7);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);};
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;});intersection.observe(canvas);
  const draw=(time:number)=>{
   raf=requestAnimationFrame(draw);if(!visible||document.hidden){last=time;return;}if(time-last<30)return;const dt=Math.min((time-last)/1000,.06);last=time;
   const state=live.current;if(resetSeen!==state.resetKey){yaw=.72;pitch=.48;resetSeen=state.resetKey;}
   if(state.playing&&!state.reducedMotion)elapsed+=dt;
   const current=new Set(state.frame.nodes.map(n=>n.id));for(const id of positions.keys())if(!current.has(id))positions.delete(id);
   for(const n of state.frame.nodes){const old=positions.get(n.id)||[...n.position] as Position;const amount=state.reducedMotion?1:1-Math.exp(-dt*12);positions.set(n.id,old.map((v,i)=>v+(n.position[i]-v)*amount) as Position);}
   const bounds=Math.max(3.8,...state.frame.nodes.map(n=>Math.hypot(n.position[0],n.position[2])+Math.abs(n.position[1])*.55+1));
   const targetScale=Math.min(width/(bounds*2.1),height/(bounds*1.55));scale+=(targetScale-scale)*.17;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
   for(let i=-10;i<=10;i++){line([i,-.68,-10],[i,-.68,10],'rgba(156,143,174,.12)',.65);line([-10,-.68,i],[10,-.68,i],'rgba(156,143,174,.12)',.65);}
   state.frame.links.forEach(drawLink);hits=[];
   [...state.frame.nodes].sort((a,b)=>project(positions.get(a.id)!).depth-project(positions.get(b.id)!).depth).forEach(n=>drawNode(n,positions.get(n.id)!));
  };
  const down=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';};
  const move=(e:PointerEvent)=>{if(!pointer)return;yaw-=(e.clientX-pointer.x)*.007;pitch=Math.max(.18,Math.min(1.05,pitch+(e.clientY-pointer.y)*.004));pointer.x=e.clientX;pointer.y=e.clientY;};
  const up=(e:PointerEvent)=>{if(pointer&&Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)<6){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=[...hits].sort((a,b)=>b.depth-a.depth).find(h=>Math.hypot(h.x-x,h.y-y)<h.r);if(hit)live.current.onSelect?.(hit.id);}pointer=null;canvas.style.cursor='grab';if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);resizeObserver.disconnect();intersection.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);};
 },[]);
 return <canvas ref={canvasRef} className="software-stage" role="img" aria-label={props.language==='tr'?'Döndürülebilir 3D sahne. Nesneler alttaki listeden de incelenebilir.':'Orbitable 3D scene. Objects can also be inspected in the list below.'}/>;
}
