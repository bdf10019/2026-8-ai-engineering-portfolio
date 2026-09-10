import {createRenderer} from '../axis-renderer.js';
import {poseAxis} from '../axis-model.js';
const view=await createRenderer(document.querySelector('canvas'));
window.renderStill=(index)=>{
 poseAxis(view.axis,index,0,{field:'aoi',flow:2,layers:6});
 view.axis.root.position.set(0,0,0);view.axis.root.scale.setScalar(1.25);
 view.renderer.render(view.axis.root.parent,view.camera);
};
window.renderStill(0);
window.stillReady=true;
window.renderProject=(index)=>{
 const {axis}=view;axis.root.children.forEach(child=>child.visible=false);
 const selected=axis.modules[index];selected.visible=true;selected.position.set(0,0,0);selected.rotation.set(0,0,0);
 axis.root.position.set(0,-.5,0);axis.root.rotation.set(.1,-.5,.05);axis.root.scale.setScalar(4);
 view.renderer.render(axis.root.parent,view.camera);
};
