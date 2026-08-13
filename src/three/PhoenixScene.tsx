import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sparkles } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type PhoenixProps={mode:number};
const colors=['#ff5b45','#a77bff','#66e3ff','#d6ff67'];

function Wing({side}:{side:number}){
  const feathers=useMemo(()=>Array.from({length:8},(_,i)=>({
    p:[side*(.55+i*.22),.65-Math.abs(i-2)*.08,-i*.02] as [number,number,number],
    r:[0,0,side*(-.34+i*.055)] as [number,number,number],
    s:[.16,.75-i*.035,.07] as [number,number,number]
  })),[side]);
  return <group>{feathers.map((f,i)=><mesh key={i} position={f.p} rotation={f.r} scale={f.s}>
    <capsuleGeometry args={[.42,.7,4,10]}/><meshStandardMaterial color={i%3===0?'#dedbd3':'#92908a'} roughness={.6} metalness={.25}/>
  </mesh>)}</group>
}

function Glasses({vr}:{vr:boolean}){
  return <group position={[0,.79,.31]}>{[-1,1].map(x=><mesh key={x} position={[x*.19,0,0]} scale={[vr?.22:.16,vr?.13:.1,.06]}>
    <boxGeometry/><meshStandardMaterial color={vr?'#8b5cf6':'#17171b'} emissive={vr?'#ff4f87':'#4deaff'} emissiveIntensity={1.6} roughness={.15}/>
  </mesh>)}<mesh scale={[.08,.025,.02]}><boxGeometry/><meshBasicMaterial color="#ddd"/></mesh></group>
}

function Phoenix({mode}:PhoenixProps){
  const root=useRef<THREE.Group>(null); const wings=useRef<THREE.Group>(null);
  useFrame(({clock,pointer})=>{if(!root.current||!wings.current)return; const t=clock.elapsedTime; root.current.rotation.y=THREE.MathUtils.lerp(root.current.rotation.y,pointer.x*.24,.035); root.current.rotation.x=THREE.MathUtils.lerp(root.current.rotation.x,-pointer.y*.08,.035); wings.current.rotation.z=Math.sin(t*1.4)*.035;});
  return <Float speed={1.7} rotationIntensity={.1} floatIntensity={.25}><group ref={root} scale={mode?1.02:1.12} position={[0,-.08,0]}>
    <group ref={wings}><Wing side={-1}/><Wing side={1}/></group>
    <mesh scale={[.42,.78,.38]}><capsuleGeometry args={[.5,.7,8,18]}/><meshStandardMaterial color="#c9c6bf" roughness={.55} metalness={.18}/></mesh>
    <mesh position={[0,.73,.05]} scale={[.33,.38,.32]}><sphereGeometry args={[1,24,24]}/><meshStandardMaterial color="#ddd9cf" roughness={.5}/></mesh>
    <mesh position={[0,.79,.35]} rotation={[Math.PI/2,0,0]} scale={[.12,.24,.12]}><coneGeometry args={[1,1,3]}/><meshStandardMaterial color="#151516"/></mesh>
    <mesh position={[0,.44,.27]} rotation={[.35,0,0]} scale={[.18,.36,.08]}><coneGeometry args={[1,1,4]}/><meshStandardMaterial color="#77746f"/></mesh>
    {Array.from({length:7},(_,i)=><mesh key={i} position={[(i-3)*.09,-.75-i*.16,-.03]} rotation={[0,0,(i-3)*.08]} scale={[.09,.42,.06]}><capsuleGeometry args={[.35,.6,4,8]}/><meshStandardMaterial color={i%2?'#85827c':'#b6b2aa'}/></mesh>)}
    {(mode===1||mode===4)&&<Glasses vr={mode===4}/>} 
    {mode===2&&<group position={[0,-.1,.7]} rotation={[-.3,0,0]}><mesh scale={[.75,.04,.48]}><boxGeometry/><meshStandardMaterial color="#16161b" metalness={.5}/></mesh><mesh position={[0,.34,-.24]} rotation={[-1.3,0,0]} scale={[.75,.035,.4]}><boxGeometry/><meshStandardMaterial color="#23232b" emissive="#7c4dff" emissiveIntensity={.4}/></mesh></group>}
    {mode===3&&<group position={[.02,.02,.72]} rotation={[0,0,-.08]}><mesh scale={[.25,.46,.035]}><boxGeometry/><meshStandardMaterial color="#15151a" metalness={.5}/></mesh><mesh position={[0,0,.04]} scale={[.21,.4,.01]}><boxGeometry/><meshBasicMaterial color="#84eaff"/></mesh></group>}
  </group></Float>
}

export default function PhoenixScene({mode=0}:{mode?:number}){
  return <Canvas camera={{position:[0,.15,6],fov:36}} dpr={[1,1.5]} gl={{antialias:true,alpha:true}}>
    <ambientLight intensity={1.3}/><directionalLight position={[4,5,5]} intensity={3} color="#fff3df"/><pointLight position={[-3,1,2]} intensity={4} color={colors[Math.max(0,mode-1)]}/>
    <Phoenix mode={mode}/><Sparkles count={mode?85:55} scale={[5,3,2]} size={2.4} speed={.35} color={colors[Math.max(0,mode-1)]}/>
    <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={.45} minPolarAngle={1.25} maxPolarAngle={1.9}/>
  </Canvas>
}
