import * as T from "./assets/vendor/three.module.min.js";
export const moduleIds=["aoi","safe","data","knowledge","rag","planning","risk","eda","forge"];
export function createAxis(){
 const root=new T.Group(); root.name="AXIS-09";
 const white=new T.MeshStandardMaterial({color:0xe4e9df,roughness:.37,metalness:.38});
 const dark=new T.MeshStandardMaterial({color:0x27362e,roughness:.34,metalness:.65});
 const metal=new T.MeshStandardMaterial({color:0x778477,roughness:.25,metalness:.72});
 const glass=new T.MeshStandardMaterial({color:0x4a766b,roughness:.15,metalness:.62});
 const palette=[0x71bdba,0xdfab54,0x71bdba,0xa995da,0x99b9dc,0x85b899,0xdfab54,0x82b7a8,0xaa94d8];
 const glow=palette.map(color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.4,roughness:.33,metalness:.35}));
 const mesh=(g,m,parent,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(w,h,d,m,p,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
 const cyl=(r,h,m,p,x=0,y=0,z=0,seg=48)=>mesh(new T.CylinderGeometry(r,r,h,seg),m,p,x,y,z);
 const ring=(r,t,m,p,x=0,y=0,z=0)=>{const o=mesh(new T.TorusGeometry(r,t,8,64),m,p,x,y,z);o.rotation.x=Math.PI/2;return o;};
 const core=new T.Group();core.name="decision-core";root.add(core);
 cyl(.98,.32,dark,core,0,0,0,12);cyl(.84,.12,metal,core,0,.22);ring(.73,.045,glow[0],core,0,.31);cyl(.65,.18,dark,core,0,.34,0,32);ring(.54,.035,metal,core,0,.45);
 const eye=mesh(new T.SphereGeometry(.44,32,20),glass,core,0,.4);eye.scale.y=.66;ring(.38,.02,glow[0],core,0,.55);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const b=box(.12,.18,.35,white,core,Math.sin(a)*.9,.22,Math.cos(a)*.9);b.rotation.y=a;}
 const modules=[];const arms=[];
 // Bevelled wedge footprint is shared by all nine chassis.
 const shape=new T.Shape();shape.moveTo(-.35,-.52);shape.lineTo(.35,-.52);shape.lineTo(.51,.5);shape.lineTo(-.51,.5);shape.closePath();
 const chassis=new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.07,bevelThickness:.05,curveSegments:1});
 chassis.rotateX(-Math.PI/2);
 for(let i=0;i<9;i++){
  const a=i*Math.PI*2/9;const p=new T.Group();p.name=moduleIds[i];p.userData={moduleIndex:i,title:moduleIds[i]};p.rotation.y=a;p.position.set(Math.sin(a)*2.05,0,Math.cos(a)*2.05);root.add(p);modules.push(p);
  mesh(chassis,white,p);box(.7,.08,.74,dark,p,0,.29);box(.63,.035,.66,metal,p,0,.345);box(.48,.025,.035,glow[i],p,0,.37,.37);
  for(const x of [-.35,.35])for(const z of [-.36,.36]){cyl(.043,.06,metal,p,x,.3,z,8);box(.035,.003,.008,dark,p,x,.334,z);}
  const arm=new T.Group();arm.rotation.y=a;root.add(arm);arms.push(arm);
  box(.13,.1,1.16,metal,arm,0,0,1.45);box(.035,.022,.94,glow[i],arm,0,.065,1.44);
  // Module-specific hardware silhouettes, authored rather than billboard rotation.
  if(i===0){cyl(.29,.21,dark,p,0,.46);ring(.29,.04,metal,p,0,.58);cyl(.22,.06,glass,p,0,.59);ring(.19,.018,glow[i],p,0,.635);}
  if(i===1){ring(.27,.027,glow[i],p,0,.5);cyl(.28,.18,dark,p,0,.46);ring(.28,.019,metal,p,0,.57);for(let j=0;j<11;j++){const ang=j*.55;box(.028,.07+(j%3)*.025,.028,glow[i],p,Math.sin(ang)*.28,.58,Math.cos(ang)*.28);}}
  if(i===2){for(let j=0;j<5;j++){const z=-.24+j*.12;box(.48,.014,.017,glow[i],p,0,.4,z);cyl(.047,.06,glass,p,.23,.44,z,12);}box(.019,.04,.55,glow[i],p,-.22,.42);}
  if(i===3||i===8){for(let j=0;j<6;j++){const layer=box(.57-j*.025,.048,.56-j*.025,j%2?glow[i]:dark,p,0,.41+j*.085);layer.name="weight-layer-"+j;}if(i===3){box(.05,.52,.06,metal,p,-.33,.57);box(.05,.52,.06,metal,p,.33,.57);box(.7,.05,.06,metal,p,0,.82);}}
  if(i===4){for(let j=0;j<4;j++){box(.48,.37,.032,white,p,0,.53,-.24+j*.15);box(.28,.018,.006,glow[i],p,0,.65,-.218+j*.15);}}
  if(i===5){for(let j=0;j<7;j++){const h=.08+j*.039;box(.044,h,.09,glow[i],p,-.25+j*.083,.37+h/2,0);}}
  if(i===6){cyl(.28,.06,dark,p,0,.41);ring(.25,.027,glow[i],p,0,.46);const needle=box(.024,.023,.22,white,p,0,.49,-.06);needle.rotation.y=.65;}
  if(i===7){box(.55,.03,.55,glass,p,0,.41);for(let j=0;j<4;j++){box(.03,.017,.47,glow[i],p,-.2+j*.13,.44);box(.47,.017,.015,glow[i],p,0,.45,-.2+j*.13);}box(.19,.12,.19,dark,p,0,.48);box(.15,.02,.15,glow[i],p,0,.55);}
 }
 root.userData={description:"Original modular engineering visualization; nine named modules and decision-core.",version:"1.0"};
 return {root,modules,core,arms,glow};
}
export const poses=[
 {x:1.15,y:.1,s:1.12,rx:.12,ry:-.27,rz:-.11,e:0},
 {x:2.4,y:.1,s:1.02,rx:.32,ry:.37,rz:.12,e:.5},
 {x:2.05,y:.25,s:1.02,rx:.12,ry:2.78,rz:-.1,e:.45},
 {x:2.1,y:.2,s:.94,rx:.26,ry:.76,rz:.1,e:.6},
 {x:2.2,y:.1,s:.93,rx:-.16,ry:-.5,rz:-.13,e:.65},
 {x:2.3,y:.1,s:1.04,rx:.3,ry:.2,rz:.1,e:.7},
 {x:2.1,y:.15,s:1.02,rx:.24,ry:1.05,rz:-.08,e:.5},
 {x:1.9,y:.1,s:1.02,rx:.05,ry:-.27,rz:-.1,e:0}
];
export function poseAxis(axis,index,t=0,selection={}){
 const a=poses[index]||poses[0],b=poses[Math.min(index+1,7)];
 const smooth=t*t*(3-2*t); const mix=k=>a[k]+(b[k]-a[k])*smooth;
 const {root,modules,arms}=axis;root.position.set(mix("x"),mix("y"),0);root.scale.setScalar(mix("s"));root.rotation.set(mix("rx"),mix("ry"),mix("rz"));
 const selected=index===2?[selection.field==="safe"?1:0]:index===3?[selection.flow??2]:index===4?[5,6,7]:index===5?[8]:[];
 modules.forEach((m,i)=>{const angle=i*Math.PI*2/9;const active=selected.includes(i);const radius=2.05+mix("e")*(active?1.25:.52);m.position.set(Math.sin(angle)*radius,active?.32:0,Math.cos(angle)*radius);m.scale.setScalar(active?1.22:selected.length?.87:1);arms[i].scale.z=radius/2.05;});
 if(index===4){
  const intensity=selection.scenario==="promo"?1.35:selection.scenario==="recovery"?.73:1;
  modules[5].scale.y=intensity;
  modules[6].rotation.y=6*Math.PI*2/9+(selection.scenario==="recovery"?.2:0);
  modules[7].position.y=selection.scenario==="promo"?.5:selection.scenario==="recovery"?.1:.32;
 }else modules[6].rotation.y=6*Math.PI*2/9;
 const layers=selection.layers??6;
 modules[8].children.filter(m=>m.name.startsWith("weight-layer")).forEach((m,i)=>{m.visible=index!==5||i<layers;});
}
