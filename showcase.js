import {projects,evidence,models,flows,scenarios} from "./showcase-data.js";
const $=s=>document.querySelector(s),root=document.documentElement;
const state={field:"aoi",flow:2,scenario:"base",model:"nf4",layers:6};
const reducedQuery=matchMedia("(prefers-reduced-motion: reduce)"),desktop=matchMedia("(min-width:901px)");
const fine=matchMedia("(hover:hover) and (pointer:fine)");
let preferred=false;try{preferred=localStorage.getItem("axis09-reduced")==="true";}catch{}
let reduced=reducedQuery.matches||preferred,frame=0,renderer=null,loading=false,positions=[],current=0,progress=0,pointer={x:0,y:0};
const sections=[...document.querySelectorAll(".scene")],rail=[...document.querySelectorAll(".chapter-rail a")];
const set=(id,value)=>{$("#"+id).textContent=value;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function geometry(){const offset=root.classList.contains("compact-motion")?$("#world").getBoundingClientRect().bottom:0;positions=sections.map((s,i)=>({top:Math.max(0,s.offsetTop-(i?offset:0)),height:s.offsetHeight}));renderer?.resize();schedule();}
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(update);}
const hotspots=document.createElement("div");hotspots.className="module-hotspots";hotspots.setAttribute("aria-label","AXIS-09 模組");document.body.append(hotspots);
projects.forEach((p,i)=>{const b=document.createElement("button");b.dataset.project=p.id;b.innerHTML="<span>"+String(i+1).padStart(2,"0")+"</span><small>"+esc(p.name)+"</small>";b.setAttribute("aria-label",p.name+"，查看作品");hotspots.append(b);});
const hotspotButtons=[...hotspots.children];
function update(){
 frame=0;const y=scrollY,vh=innerHeight;const available=Math.max(1,root.scrollHeight-vh);
 $("#scrollProgress").style.transform="scaleX("+Math.min(1,y/available)+")";
 let idx=0;for(let i=0;i<positions.length;i++)if(y>=positions[i].top)idx=i;
 current=idx;const p=positions[idx];const next=positions[idx+1]?.top??p.top+p.height;progress=Math.max(0,Math.min(1,(y-p.top)/(next-p.top)));
 const dark=!reduced&&(idx===5||idx===6);document.body.classList.toggle("dark",dark);
 rail.forEach((a,i)=>i===idx?a.setAttribute("aria-current","step"):a.removeAttribute("aria-current"));
 const inside=y<$("#project-index").offsetTop-vh*.25;
 $("#world").style.opacity=inside?"1":"0";
 const canRender=renderer&&!reduced&&inside;
 if(canRender){
  renderer.render(idx,progress,state,pointer);
  const show=desktop.matches&&(idx===0||idx===6);
  hotspots.hidden=!show;
  if(show){
   const {axis,camera}=renderer;const width=innerWidth,height=innerHeight-88;
   axis.root.updateWorldMatrix(true,true);
   axis.modules.forEach((m,i)=>{
    const point=m.position.clone();m.getWorldPosition(point);point.y+=.2;point.project(camera);
    const x=(point.x*.5+.5)*width,yy=(-point.y*.5+.5)*height;
    hotspotButtons[i].style.transform="translate("+x.toFixed(1)+"px,"+yy.toFixed(1)+"px)";
    hotspotButtons[i].hidden=point.z>1||x<0||x>width||yy<0||yy>height;
   });
  }
 }else hotspots.hidden=true;
}
async function enable3d(){
 if(loading||renderer||reduced)return;loading=true;
 try{const {createRenderer}=await import("./axis-renderer.js");if(!reduced){renderer=await createRenderer($("#axisCanvas"));geometry();}}
 catch(error){root.classList.remove("has-3d","compact-motion");geometry();console.warn("AXIS-09: static artwork retained.",error.message);}
 finally{loading=false;}
}
function applyMotion(){
 reduced=reducedQuery.matches||preferred;root.classList.toggle("reduced-motion",reduced);root.classList.toggle("compact-motion",!desktop.matches&&!reduced);$("#motionSwitch").setAttribute("aria-pressed",String(reduced));
 $("#motionSwitch").textContent=reduced?"動態已減少":"減少動態";geometry();enable3d();
}
$("#motionSwitch").addEventListener("click",()=>{if(reducedQuery.matches){set("announcement","目前依照裝置設定減少動態。可在系統輔助使用設定變更。");return;}preferred=!preferred;try{localStorage.setItem("axis09-reduced",String(preferred));}catch{}applyMotion();});
reducedQuery.addEventListener("change",applyMotion);desktop.addEventListener("change",()=>{applyMotion();enable3d();});
addEventListener("resize",geometry);addEventListener("scroll",schedule,{passive:true});addEventListener("pageshow",geometry);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();});
addEventListener("pointermove",e=>{if(!fine.matches||reduced||e.target.closest("dialog"))return;pointer={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};schedule();},{passive:true});
document.documentElement.addEventListener("pointerleave",()=>{pointer={x:0,y:0};schedule();});
document.querySelectorAll('img').forEach(img=>img.addEventListener("load",geometry));
document.fonts.ready.then(geometry);
const initialAoi=$("#fieldVisual").innerHTML;
function selectTabs(button){
 const list=button.closest('[role="tablist"]');list.querySelectorAll('[role="tab"]').forEach(tab=>{const selected=tab===button;tab.setAttribute("aria-selected",String(selected));tab.tabIndex=selected?0:-1;});
 $("#"+button.getAttribute("aria-controls")).setAttribute("aria-labelledby",button.id);
}
document.querySelectorAll('[role="tablist"]').forEach(list=>list.addEventListener("keydown",e=>{
 if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;
 e.preventDefault();const tabs=[...list.querySelectorAll('[role="tab"]')],index=tabs.indexOf(document.activeElement);
 const next=e.key==="Home"?0:e.key==="End"?tabs.length-1:(index+(e.key==="ArrowLeft"||e.key==="ArrowUp"?-1:1)+tabs.length)%tabs.length;
 tabs[next].focus();tabs[next].click();
}));
function selectField(button){
 selectTabs(button);state.field=button.dataset.field;const safe=state.field==="safe";
 set("fieldTitle",safe?"RTSafe Sensor Hub":"Surface AOI Inspector");
 set("fieldCopy",safe?"以感測、心跳與狀態機實現可追蹤的安全反應。故障必須能被辨識，也必須有清楚的復歸條件。":"C# 與 ONNX Runtime 整合，在官方測試集上辨識表面瑕疵。量產前仍需依實際光學條件校正。");
 $("#fieldValue").innerHTML=safe?"1<span>ms</span>":"97.11<span>%</span>";
 set("fieldLabel",safe?"設計控制週期":"桌面整合測試準確率");set("fieldSecond",safe?"1,000":"1,004");set("fieldSecondLabel",safe?"Hz 取樣設計":"官方測試影像");
 set("fieldSource",safe?"主機邏輯驗證 · 硬體時限待目標板測試":"原專案實測 · KSDD2 測試集 · 非量產允收值");
 $("#fieldVisual").innerHTML=safe?'<svg viewBox="0 0 480 120" role="img" aria-label="心跳與安全突波示意"><path class="chart-grid" d="M0 30H480M0 60H480M0 90H480"/><path class="wave" d="M0 65H35L42 51L49 81L57 65H105L112 51L119 81L127 65H180L186 20L194 99L202 65H255L262 51L269 81L277 65H330L338 52L345 80L352 65H480"/><text x="282" y="23">HEARTBEAT / ILLUSTRATIVE</text></svg>':initialAoi;
 $("#fieldEvidence").dataset.evidence=safe?"safe":"aoi";set("announcement",safe?"已選擇即時安全，1 ms 設計週期。":"已選擇影像檢測，桌面整合準確率 97.11%。");schedule();
}
function selectFlow(button){
 selectTabs(button);const f=flows[button.dataset.flow];state.flow=f.index;
 for(const k of ["tag","title","copy","input","output"])set("flow"+k[0].toUpperCase()+k.slice(1),f[k]);
 $("#flowEvidence").dataset.evidence=f.evidence;set("announcement","已選擇 "+f.title);schedule();
}
function selectScenario(button){
 selectTabs(button);state.scenario=button.dataset.scenario;const s=scenarios[state.scenario];set("scenarioTitle",s.title);set("demandValue",s.demand);set("riskValue",s.risk);set("edaValue",s.eda);set("scenarioCopy",s.copy);
 const xs=[220,275,330,385,440,490];$("#forecastLine").setAttribute("d",s.line.map((y,i)=>(i?"L":"M")+xs[i]+" "+y).join(""));
 const upper=s.line.map((y,i)=>(i?"L":"M")+xs[i]+" "+Math.max(8,y-23)).join("");const lower=[...s.line].reverse().map((y,i)=>"L"+xs[5-i]+" "+Math.min(140,y+25)).join("");
 $("#forecastBand").setAttribute("d",upper+lower+"Z");set("chartTitle",button.textContent+"：14 日合成需求指數，"+s.demand+"；壓力"+s.risk+"；餘裕"+s.eda);set("announcement",s.title+"合成需求指數 "+s.demand);schedule();
}
function selectModel(button){
 selectTabs(button);state.model=button.dataset.model;const m=models[state.model];state.layers=m.layers;
 set("modelTitle",m.title);set("modelStatus",m.status);set("modelSize",m.size);set("modelReason",m.reason);
 $("#modelQuality").innerHTML=m.quality.toFixed(2)+"<span>%</span>";$("#modelLatency").innerHTML=m.latency+"<span>s</span>";$("#qualityBar").style.width=m.quality+"%";
 $("#modelPanel").style.setProperty("--accent",state.model==="q4"?"#dfb06a":state.model==="q8"?"#8ccbc4":"#b8d997");
 set("announcement",button.textContent+"，Event F1 "+m.quality+"%，"+m.status);schedule();
}
const dialog=$("#detailDialog");let returnFocus=null;
function diagram(p){
 if(!p.flow)return "";
 return '<div class="project-diagram"><svg viewBox="0 0 480 105" role="img" aria-label="'+esc(p.name+"流程："+p.flow.join("、"))+'">'+p.flow.map((label,i)=>'<rect x="'+(i*120+4)+'" y="22" width="103" height="58" rx="2"/><text x="'+(i*120+55)+'" y="46" text-anchor="middle" font-size="9">'+String(i+1).padStart(2,"0")+'</text><text x="'+(i*120+55)+'" y="64" text-anchor="middle" font-size="11">'+esc(label)+'</text>'+(i<3?'<path d="M'+(i*120+108)+' 51h14m-5-4 5 4-5 4"/>':"")).join("")+'</svg></div>';
}
function openDetail(p,isProject){
 if(!p)return;returnFocus=document.activeElement;
 set("detailKicker",isProject?"THE COLLECTION / PROJECT":"TRACEABLE EVIDENCE");set("detailTitle",p.name);set("detailKind",p.kind);set("detailCopy",p.copy);set("detailBoundary",p.boundary);
 const projectIndex=projects.findIndex(project=>project.id===p.id);
 $("#detailVisual").innerHTML=(projectIndex>=0?'<img class="module-portrait" src="assets/modules/module-'+String(projectIndex+1).padStart(2,"0")+'.png" alt="'+esc(p.name)+' 的原創功能模組造型" width="700" height="520">':"")+diagram(p)+((p===evidence.quantization||p.id==="forge")?'<a href="assets/modelforge-comparison.svg" target="_blank" rel="noopener"><img class="comparison-image" src="assets/modelforge-comparison.svg" alt="三模型比較：NF4 86.24%／8.333秒；Q8 85.16%／1.060秒／1.834GB；Q4 74.43%／0.825秒／1.107GB。點擊放大。" width="940" height="460"></a>':"");
 $("#detailFacts").innerHTML=p.facts.map(([k,v])=>"<div><dt>"+esc(k)+"</dt><dd>"+esc(v)+"</dd></div>").join("");
 $("#detailLinks").innerHTML='<a href="docs/sources/'+esc(p.source)+'" target="_blank" rel="noopener">閱讀原始專案文件快照 ↗</a><a href="docs/showcase-evidence.md" target="_blank" rel="noopener">閱讀完整來源索引 ↗</a>'+(p.view?'<a href="index.html#'+esc(p.view)+'">在工作台操作此能力 ↗</a>':p.id==="forge"?'<a href="#model-forge" data-dialog-anchor>回到三模型互動比較 ↗</a>':"");
 dialog.showModal();dialog.scrollTop=0;document.body.style.overflow="hidden";$("#closeDialog").focus();
}
function closeDetail(){dialog.close();}
dialog.addEventListener("close",()=>{document.body.style.overflow="";returnFocus?.focus({preventScroll:true});schedule();});
$("#closeDialog").addEventListener("click",closeDetail);
dialog.addEventListener("click",e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
document.addEventListener("click",e=>{
 const b=e.target.closest("button,a");if(!b)return;
 if(b.dataset.field)selectField(b);
 else if(b.dataset.flow)selectFlow(b);
 else if(b.dataset.scenario)selectScenario(b);
 else if(b.dataset.model)selectModel(b);
 else if(b.dataset.project)openDetail(projects.find(p=>p.id===b.dataset.project),true);
 else if(b.dataset.evidence)openDetail(evidence[b.dataset.evidence],false);
 else if(b.hasAttribute("data-dialog-anchor"))closeDetail();
});
root.classList.add("js-ready");applyMotion();geometry();enable3d();
