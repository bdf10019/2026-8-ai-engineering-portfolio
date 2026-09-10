import * as T from "./assets/vendor/three.module.min.js";
import {createAxis,poseAxis} from "./axis-model.js";
export async function createRenderer(canvas){
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new T.Scene();const camera=new T.PerspectiveCamera(36,1,.1,60);camera.position.set(0,6.7,10.2);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(0xf6ffef,0x455748,2.2));
 const key=new T.DirectionalLight(0xfff8e5,4);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.bias=-.002;scene.add(key);
 const fill=new T.DirectionalLight(0xcdebe5,2.5);fill.position.set(5,3,-4);scene.add(fill);
 const axis=createAxis();scene.add(axis.root);
 const floor=new T.Mesh(new T.PlaneGeometry(60,60),new T.ShadowMaterial({color:0x435641,opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.75;floor.receiveShadow=true;scene.add(floor);
 let failed=false;
 canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();failed=true;document.documentElement.classList.remove("has-3d","compact-motion");});
 function resize(){const rect=canvas.parentElement.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();}
 resize();
 function render(index,progress,selection,pointer={x:0,y:0}){
  if(failed)return;poseAxis(axis,index,progress,selection);axis.root.rotation.y+=pointer.x*.045;axis.root.rotation.x+=pointer.y*.035;
  if(document.documentElement.classList.contains("compact-motion")){
   axis.root.position.set(0,-.05,0);
   axis.root.scale.multiplyScalar(1.35);
  }
  renderer.render(scene,camera);
  canvas.dataset.scene=String(index+1);
  canvas.dataset.progress=progress.toFixed(4);
  canvas.dataset.rotation=axis.root.rotation.y.toFixed(4);
 }
 render(0,0,{});document.documentElement.classList.add("has-3d");
 return {render,resize,dispose(){renderer.dispose();},axis,renderer,camera};
}
