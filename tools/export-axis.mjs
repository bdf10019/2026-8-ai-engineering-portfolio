import {writeFile} from 'node:fs/promises';
import {GLTFExporter} from '../assets/vendor/GLTFExporter.js';
import {createAxis} from '../axis-model.js';
// FileReader is needed only by Three's browser-compatible GLB packager.
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.();});}
};
const {root}=createAxis();
const buffer=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});
await writeFile(new URL('../assets/axis-09.glb',import.meta.url),Buffer.from(buffer));
console.log('AXIS-09 GLB exported:',buffer.byteLength,'bytes');
