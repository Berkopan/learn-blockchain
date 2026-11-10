import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Box, Layers3, RotateCcw } from 'lucide-react';
import type { Frame, Language, VisualNode } from '../types';
import { palette, Projection } from './Projection';
import SoftwareScene from './SoftwareScene';

interface Props { frame:Frame; language:Language; playing?:boolean; reducedMotion?:boolean; hero?:boolean; selected?:string|null; onSelect?:(id:string)=>void }
interface SceneApi { update:(frame:Frame)=>void; reset:()=>void }
let webglAvailable:boolean|undefined;
const trim=(s:string,n=24)=>s.length>n?s.slice(0,n-1)+'…':s;
function release(root:THREE.Object3D){
 root.traverse(object=>{const mesh=object as THREE.Mesh;mesh.geometry?.dispose();const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const material of list){if(!material)continue;(material as THREE.MeshStandardMaterial).map?.dispose();material.dispose();}});
}
function label(text:string,value?:string):THREE.Sprite{
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=value?126:82;const c=canvas.getContext('2d')!;
 c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.roundRect(5,5,470,canvas.height-10,17);c.fill();c.textAlign='center';c.textBaseline='middle';c.font='600 34px "Manrope Variable", sans-serif';c.fillStyle='#50465b';c.fillText(trim(text,27),240,value?43:42,445);
 if(value){c.font='500 27px "Manrope Variable", sans-serif';c.fillStyle='#7a6b86';c.fillText(trim(value,30),240,89,440);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(2.3,value ? .60 : .39,1);sprite.renderOrder=5;return sprite;
}
function objectFor(node:VisualNode):THREE.Group{
 const g=new THREE.Group();g.userData.nodeId=node.id;const color=palette[node.status||'idle'];
 const material=(c:string)=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:.02});
 const box=(w:number,h:number,d:number,c:string,x=0,y=0,z=0,r=.07)=>{const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),material(c));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;};
 const kind=node.kind||'node';
 if(kind==='node'){
  box(.78,.83,.73,'#f8f7fc');box(.64,.10,.59,color,0,.46,0,.035);
  for(let i=0;i<3;i++)box(.45,.035,.025,'#d1cdda',-.02,.20-i*.15,.376,.01);
  const light=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),material(color));light.position.set(.25,-.28,.38);g.add(light);
  box(.87,.08,.81,'#e7e4ef',0,-.47,0,.025);
 }else if(kind==='block'){
  box(.84,.68,.79,color);box(.58,.055,.53,new THREE.Color(color).lerp(new THREE.Color('#ffffff'),.25).getStyle(),0,.37,0,.025);
  for(let i=0;i<3;i++)box(.42,.035,.025,'#f7f4fb',-.04,.15-i*.13,.408,.01);
 }else if(kind==='data'){box(.72,.23,.66,color);box(.46,.045,.41,'#f5f3fa',0,.15,0,.02);}
 else if(kind==='gate'){
  box(.65,.47,.4,color,0,-.12);const shackle=new THREE.Mesh(new THREE.TorusGeometry(.18,.045,8,24,Math.PI),material('#b5acbf'));shackle.position.set(0,.18,0);g.add(shackle);
  box(.035,.1,.025,'#ffffff',0,-.1,.21,.01);
 }else if(kind==='clock'){
  const face=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.1,32),material(color));face.rotation.x=Math.PI/2;g.add(face);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.30,.025,8,32),material('#f7f5fb'));rim.position.z=.06;g.add(rim);
  box(.025,.2,.025,'#ffffff',0,.075,.07,.01);box(.14,.025,.025,'#ffffff',.06,0,.07,.01);
 }else{
  const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,0),material(color));gem.castShadow=true;g.add(gem);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.39,.018,6,28),material(new THREE.Color(color).lerp(new THREE.Color('#fff'),.3).getStyle()));rim.rotation.x=Math.PI/3;g.add(rim);
 }
 const name=label(node.label,node.value);name.position.y=kind==='node'?1.04:.86;g.add(name);
 if(node.status==='success'||node.status==='error'||node.status==='warning'){
  const marker=label(node.status==='success'?'✓':node.status==='error'?'×':'!');marker.scale.set(.35,.28,1);marker.position.set(.43,.5,.05);g.add(marker);
 }
 const s=node.scale||1;g.scale.setScalar(s);g.position.fromArray(node.position);return g;
}

export default function Scene(props:Props){
 const host=useRef<HTMLDivElement>(null),api=useRef<SceneApi|null>(null),live=useRef(props);live.current=props;
 const[flat,setFlat]=useState(false),[unavailable,setUnavailable]=useState(webglAvailable===false),[resetKey,setResetKey]=useState(0);
 useEffect(()=>{
  if(flat)return;const mount=host.current;if(!mount)return;
  if(webglAvailable===false){setUnavailable(true);return;}
  const canvas=document.createElement('canvas');let renderer:THREE.WebGLRenderer;
  try{const context=canvas.getContext('webgl2',{alpha:true,antialias:true});if(!context)throw new Error('WebGL2 unavailable');renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});webglAvailable=true;setUnavailable(false);}
  catch{webglAvailable=false;setUnavailable(true);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.setClearColor(0,0);canvas.setAttribute('aria-label',live.current.language==='tr'?'Etkileşimli 3D sahne':'Interactive 3D scene');mount.appendChild(canvas);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-8,8,6,-6,.1,100);camera.position.set(11,10,13);camera.lookAt(0,.25,0);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,.25,0);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.075;controls.rotateSpeed=.75;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2.1;controls.update();
  scene.add(new THREE.AmbientLight('#e8e0fa',2.4));
  const key=new THREE.DirectionalLight('#ffffff',4.1);key.position.set(-4,13,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14});key.shadow.bias=-.001;scene.add(key);
  const rim=new THREE.DirectionalLight('#c4b5ef',2);rim.position.set(9,5,-8);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-.62;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(40,40,'#d6cfe2','#e1dce9');grid.position.y=-.63;const gridMaterial=grid.material as THREE.Material;gridMaterial.transparent=true;gridMaterial.opacity=.45;scene.add(grid);
  const objectsLayer=new THREE.Group(),linksLayer=new THREE.Group();scene.add(objectsLayer,linksLayer);
  const selection=new THREE.Mesh(new THREE.TorusGeometry(.64,.017,6,48),new THREE.MeshBasicMaterial({color:'#8a6aa3',transparent:true,opacity:.9}));selection.rotation.x=-Math.PI/2;selection.position.y=-.57;selection.visible=false;scene.add(selection);
  const objects=new Map<string,THREE.Group>(),targets=new Map<string,THREE.Vector3>();let packets:{mesh:THREE.Mesh;curve:THREE.QuadraticBezierCurve3;offset:number}[]=[];
  let elapsed=0,last=0,raf=0,visible=true,lost=false,bounds=5;
  const resize=()=>{const r=mount.getBoundingClientRect(),w=Math.max(r.width,1),h=Math.max(r.height,1),aspect=w/h;renderer.setSize(w,h,false);const half=Math.max(live.current.hero?4.8:4.9,bounds*.73+1.3)/Math.min(aspect,1.3);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();};
  const update=(frame:Frame)=>{
   const old=new Map([...objects].map(([id,obj])=>[id,obj.position.clone()]));
   release(objectsLayer);objectsLayer.clear();release(linksLayer);linksLayer.clear();objects.clear();targets.clear();packets=[];
   for(const n of frame.nodes){const obj=objectFor(n);if(old.has(n.id))obj.position.copy(old.get(n.id)!);objects.set(n.id,obj);targets.set(n.id,new THREE.Vector3(...n.position));objectsLayer.add(obj);}
   frame.links.forEach((link,i)=>{
    const a=frame.nodes.find(n=>n.id===link.from),b=frame.nodes.find(n=>n.id===link.to);if(!a||!b)return;
    const start=new THREE.Vector3(...a.position),end=new THREE.Vector3(...b.position),middle=start.clone().lerp(end,.5);middle.y+=.65;
    const curve=new THREE.QuadraticBezierCurve3(start,middle,end),color=palette[link.status||'idle'];
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,24,link.status==='active'?.023:.014,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:link.status==='muted'?.18:.55}));linksLayer.add(tube);
    if(link.directed){const arrow=new THREE.Mesh(new THREE.ConeGeometry(.065,.16,7),new THREE.MeshBasicMaterial({color}));arrow.position.copy(curve.getPoint(.74));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(.74));linksLayer.add(arrow);}
    if(link.status==='active'||link.status==='success'){const packet=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,roughness:.3}));packet.position.copy(curve.getPoint(.5));linksLayer.add(packet);packets.push({mesh:packet,curve,offset:i*.13});}
    if(link.label&&i<8&&link.status!=='muted'){const caption=label(link.label);caption.scale.multiplyScalar(.63);caption.position.copy(curve.getPoint(.5));caption.position.y+=.2;linksLayer.add(caption);}
   });
   bounds=Math.max(3.6,...frame.nodes.map(n=>Math.hypot(n.position[0],n.position[2])+Math.abs(n.position[1])*.3));resize();
  };
  const reset=()=>{camera.position.set(11,10,13);controls.target.set(0,.25,0);camera.zoom=1;camera.updateProjectionMatrix();controls.update();};
  api.current={update,reset};update(live.current.frame);
  const observer=new ResizeObserver(resize);observer.observe(mount);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;});intersection.observe(mount);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start:{x:number;y:number}|null=null;
  const down=(e:PointerEvent)=>{start={x:e.clientX,y:e.clientY};};
  const up=(e:PointerEvent)=>{if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(objectsLayer.children,true);for(const hit of hits){let obj:THREE.Object3D|null=hit.object;while(obj&&!obj.userData.nodeId)obj=obj.parent;if(obj?.userData.nodeId){live.current.onSelect?.(obj.userData.nodeId);break;}}start=null;};
  const contextLost=(e:Event)=>{e.preventDefault();lost=true;webglAvailable=false;setUnavailable(true);};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('webglcontextlost',contextLost);
  const animate=(time:number)=>{
   raf=requestAnimationFrame(animate);const dt=Math.min((time-last)/1000,.05);last=time;if(!visible||document.hidden||lost)return;const state=live.current;
   if(state.playing&&!state.reducedMotion)elapsed+=dt;
   for(const[id,obj]of objects)obj.position.lerp(targets.get(id)!,state.reducedMotion?1:1-Math.exp(-dt*12));
   for(const packet of packets)packet.mesh.position.copy(packet.curve.getPoint(state.playing&&!state.reducedMotion?(elapsed*.38+packet.offset)%1:.5));
   const selected=state.selected?objects.get(state.selected):undefined;selection.visible=!!selected;if(selected){selection.position.set(selected.position.x,-.57,selected.position.z);selection.scale.setScalar(selected.scale.x);}
   controls.enableDamping=!state.reducedMotion;controls.update();renderer.render(scene,camera);
  };
  raf=requestAnimationFrame(animate);
  return()=>{api.current=null;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();controls.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('webglcontextlost',contextLost);release(scene);renderer.dispose();canvas.remove();};
 },[flat,props.hero]);
 useEffect(()=>{api.current?.update(props.frame);},[props.frame]);
 const reset=()=>{api.current?.reset();setResetKey(n=>n+1);};
 return <div className={'three-stage '+(props.hero?'hero-stage':'')}>
  <div ref={host} className="canvas-mount" style={{display:flat||unavailable?'none':undefined}}/>
  {flat?<Projection frame={props.frame} language={props.language} selected={props.selected} onSelect={props.onSelect}/>:unavailable?<SoftwareScene frame={props.frame} language={props.language} playing={props.playing} reducedMotion={props.reducedMotion} selected={props.selected} onSelect={props.onSelect} resetKey={resetKey}/>:null}
  {!props.hero&&<div className="scene-tools"><button onClick={()=>setFlat(v=>!v)} aria-label={props.language==='tr'?(flat?'3D görünüm':'2D görünüm'):(flat?'3D view':'2D view')} title={flat?'3D':'2D'}>{flat?<Box size={15}/>:<Layers3 size={15}/>}<span>{flat?'3D':'2D'}</span></button><button onClick={reset} disabled={flat} aria-label={props.language==='tr'?'Kamerayı sıfırla':'Reset camera'} title={props.language==='tr'?'Kamerayı sıfırla':'Reset camera'}><RotateCcw size={15}/></button></div>}
  {!props.hero&&<div className="scene-hint">{props.language==='tr'?(flat?'İncelemek için bir nesne seç':'Sürükle: döndür · Tıkla: incele'):(flat?'Select an object to inspect':'Drag to orbit · Click to inspect')}</div>}
 </div>;
}
