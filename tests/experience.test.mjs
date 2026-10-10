import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { forgeAt, FORGE_CASES, simopsAt, SIMOPS_CASES, SIMOPS_FREQUENCIES, riskAt, RISK_CASES, planningAt, PLANNING_BASELINE, PLANNING_CASES, opsAt, OPS_CASES, knowledgeAt, KNOWLEDGE_CASES, journeyState, inspectionAt, signalAt, retailAt, reconcileRows, money4, RETAIL_ROWS, RETAIL_CASES, SCENE_STOPS, SCENE_BRIDGES, AOI_CASES, SAFE_CASES } from "../experience-state.js";
import { TOUR_ORDER, TOUR_RATES, TOUR_SCRIPT, TOUR_TIMING, tourSelector, easeTour, tourBridgeProgress, captionLines } from "../experience-tour.js";
const root=fileURLToPath(new URL("../",import.meta.url));

test("Practical portfolio title and initial AOI copy agree with the live scene",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8"),js=await readFile(join(root,"experience.js"),"utf8");
 assert.match(html,/<title>2026_8月合輯｜AI 與工程實務作品集<\/title>/);
 assert.match(html,/<strong class="identity-title">AI 與工程實務作品集<\/strong><small>2026_8月合輯<\/small>/);
 const aoi=js.match(/aoi: \{ eyebrow:"([^"]*)", title:"([^"]*)", copy:"([^"]*)"/);
 assert.ok(aoi);
 for(const text of aoi.slice(1))assert.ok(html.includes(text));
 assert.ok(html.includes("呈現各項技術的處理流程、判斷依據與應用限制"));
});
test("Header promotes the portfolio title and right-aligns all chapter navigation",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8"),css=await readFile(join(root,"experience.css"),"utf8");
 assert.equal((html.match(/data-stop="(?:aoi|safe|retail|knowledge|ops|planning|risk|simops|forge)"/g)||[]).length>=9,true);
 assert.match(html,/09 模型治理<\/a><a href="#collection">全部作品/);
 assert.match(css,/\.identity-title\{[^}]*font-size:/);
 assert.match(css,/\.site-header nav\{margin-left:auto;justify-content:flex-end\}/);
});
test("Opening curtain names both guided and manual ways to explore",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");
 assert.match(html,/id="openingCurtain"/);assert.match(html,/id="startAutoTour"[^>]*>[\s\S]*自動導覽模式/);assert.match(html,/id="startManualTour"[^>]*>[\s\S]*手動遊覽/);
 assert.match(html,/id="curtainIntroTitle"[^>]*>九個作品/);assert.match(html,/你不需要技術背景/);
 assert.match(html,/約 5 分鐘/);assert.match(html,/id="tourSubtitleOld"/);assert.match(html,/id="tourSubtitleCurrent"/);assert.match(html,/id="tourSpeed"/);
});
test("Guided tour covers nine anchored scenes in the authored order",()=>{
 assert.deepEqual(TOUR_RATES,[1,1.5,2,2.5]);
 assert.deepEqual(TOUR_ORDER,["aoi","safe","retail","knowledge","ops","planning","risk","simops","forge"]);
 assert.deepEqual(TOUR_SCRIPT.map(scene=>scene.id),TOUR_ORDER);assert.equal(TOUR_SCRIPT.length,9);
 for(const id of TOUR_ORDER)assert.ok(Object.hasOwn(SCENE_STOPS,id));
});
test("Guided tour operates all twenty-seven scenario controls",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");
 assert.equal(TOUR_SCRIPT.flatMap(scene=>scene.steps).length,27);
 for(const scene of TOUR_SCRIPT){assert.equal(scene.steps.length,3);for(const step of scene.steps)assert.ok(html.includes(tourSelector(scene,step).replaceAll('[','').replaceAll(']','').replaceAll('="','="'))||html.includes(`${scene.attribute}="${step.value}"`));}
});
test("Every guided explanation carries readable copy and a non-color label",()=>{
 const tones=new Set(["normal","warning","review"]);
 for(const scene of TOUR_SCRIPT)for(const step of scene.steps){assert.ok(step.title.length>=6);assert.ok(step.body.length>=6);assert.notEqual(step.title,step.body);assert.ok(tones.has(step.tone));}
 assert.equal(TOUR_SCRIPT[0].steps[0].title,"放入一塊表面完整的鋼板");
 assert.equal(TOUR_SCRIPT[0].steps[1].title,"下一塊鋼板出現一道明顯刮痕");
 assert.ok(TOUR_SCRIPT.every(scene=>scene.steps.some(step=>/突然|下一|再次|逾時|切換|放入|載入|送入/.test(step.title))));
});
test("Automatic particle transitions are intentionally slow",()=>{
 assert.ok(TOUR_TIMING.transition>=11000);assert.ok(TOUR_TIMING.collection>=8500);
 assert.ok(TOUR_TIMING.typing>=40&&TOUR_TIMING.typing<=60);assert.ok(TOUR_TIMING.lineShift>=250&&TOUR_TIMING.lineShift<=350);
 assert.ok(TOUR_TIMING.explain>=500&&TOUR_TIMING.explain<=700);assert.ok(TOUR_TIMING.observe>=1000&&TOUR_TIMING.observe<=1300);
});
test("Tour easing is clamped, reversible and reaches exact endpoints",()=>{
 assert.equal(easeTour(-1),0);assert.equal(easeTour(0),0);assert.equal(easeTour(.5),.5);assert.equal(easeTour(1),1);assert.equal(easeTour(2),1);
 assert.ok(easeTour(.25)<.25);assert.ok(easeTour(.75)>.75);
});
test("Each bridge spends over ten seconds inside the actual morph range",()=>{
 for(const bridge of SCENE_BRIDGES){
  const from=SCENE_STOPS[bridge.from],to=SCENE_STOPS[bridge.to];
  assert.equal(tourBridgeProgress(0,from,to,bridge),from);
  assert.equal(tourBridgeProgress(1,from,to,bridge),to);
  assert.ok(Math.abs(tourBridgeProgress(.08,from,to,bridge)-bridge.start)<1e-10);
  assert.ok(Math.abs(tourBridgeProgress(.92,from,to,bridge)-bridge.end)<1e-10);
  let previous=from;
  for(let i=1;i<=100;i++){
   const p=tourBridgeProgress(i/100,from,to,bridge);
   assert.ok(p>=previous);previous=p;
   if(i>8&&i<92)assert.equal(journeyState(p).phase,"transition");
  }
  assert.ok(TOUR_TIMING.transition*.84>=10000);
 }
});
test("Caption fitting preserves long Chinese and mixed text without clipping or orphan punctuation",()=>{
 const measure=s=>Array.from(s).reduce((n,c)=>n+(/[A-Za-z0-9 ]/.test(c)?6:12),0);
 const samples=[...TOUR_SCRIPT.flatMap(s=>s.steps.flatMap(x=>[x.title+"。",x.body+"。"])),"NF4 與 Q8，逐字顯示。"];
 for(const width of [96,180,343,896])for(const text of samples){
  const lines=captionLines(text,width,measure);
  assert.equal(lines.join(""),text);
  for(const line of lines){assert.ok(measure(line)<=width);assert.ok(!/^[，。！？、；：]/.test(line));}
 }
});
test("All nine practical scene headings retain full explanatory paragraphs",async()=>{
 const js=await readFile(join(root,"experience.js"),"utf8");
 const entries=[...js.matchAll(/  (\w+): \{ eyebrow:"([^"]*)", title:"([^"]*)", copy:"([^"]*)"/g)];
 assert.equal(entries.length,9);
 for(const [_,id,eyebrow,title,copy] of entries){assert.match(eyebrow,/實務/);assert.match(title,/<br><em>/);assert.ok(copy.length>=45,id);assert.ok(!copy.includes("<br>"));}
 assert.match(js,/依據既有實測紀錄，比較 NF4、Q8 與 Q4/);
});

test("All nine scenes each have a stable dwell range",()=>{
 const ranges={aoi:[0,.025,.05],safe:[.09,.14,.19],retail:[.21,.255,.30],knowledge:[.32,.37,.42],ops:[.44,.485,.53],planning:[.55,.60,.65],risk:[.67,.715,.76],simops:[.79,.83,.88],forge:[.93,.965,1]};
 for(const [scene,points] of Object.entries(ranges))for(const p of points)assert.equal(journeyState(p).phase,scene);
 for(const [scene,p] of Object.entries(SCENE_STOPS))assert.equal(journeyState(p).phase,scene);
 assert.equal(Object.keys(SCENE_STOPS).length,9);assert.equal(SCENE_BRIDGES.length,8);
});
test("All eight bridges dismantle all models and expose particles at midpoint",()=>{
  for(const bridge of SCENE_BRIDGES){
    const s=journeyState((bridge.start+bridge.end)/2);
    assert.equal(s.phase,"transition");assert.equal(s.aoiDissolve,1);assert.equal(s.safeDissolve,1);assert.equal(s.retailDissolve,1);assert.equal(s.knowledgeDissolve,1);assert.equal(s.opsDissolve,1);assert.equal(s.planningDissolve,1);assert.equal(s.riskDissolve,1);assert.equal(s.simopsDissolve,1);assert.equal(s.forgeDissolve,1);assert.equal(s.particles,1);
    assert.equal(s.from,bridge.from);assert.equal(s.to,bridge.to);
  }
});
test("Scroll reversal reconstructs identical authored transition states",()=>{
  const forward=Array.from({length:101},(_,i)=>journeyState(i/100));
  const reverse=Array.from({length:101},(_,i)=>journeyState((100-i)/100)).reverse();
  assert.deepEqual(forward,reverse);
});
test("Model dissolve is monotonic with no discontinuity at dwell boundaries",()=>{
  for(const bridge of SCENE_BRIDGES){
    let a=0,s=1;
    for(let i=0;i<=1000;i++){
      const state=journeyState(bridge.start+(bridge.end-bridge.start)*i/1000);
      const source=state[bridge.from+"Dissolve"],target=state[bridge.to+"Dissolve"];
      assert.ok(source>=a);assert.ok(target<=s);a=source;s=target;
    }
    assert.ok(journeyState(bridge.start+.00001)[bridge.from+"Dissolve"]<.001);
    assert.ok(journeyState(bridge.end-.00001)[bridge.to+"Dissolve"]<.001);
  }
});
test("Invalid or out-of-range scroll inputs do not produce NaN",()=>{
  for(const p of [-20,20,NaN,Infinity]){const s=journeyState(p);assert.ok(Number.isFinite(s.transition));assert.ok(s.progress>=0&&s.progress<=1);}
});
test("Reduced motion chooses complete models and no particle interval",()=>{
  for(let i=0;i<=100;i++){const s=journeyState(i/100,true);assert.notEqual(s.phase,"transition");assert.equal(s.particles,0);assert.equal(s.aoiDissolve+s.safeDissolve+s.retailDissolve+s.knowledgeDissolve+s.opsDissolve+s.planningDissolve+s.riskDissolve+s.simopsDissolve+s.forgeDissolve,8);}
});
test("Monitor and conveyor use the same workpiece identity and location",()=>{
  const first=inspectionAt(1.8),next=inspectionAt(5.4);
  assert.equal(first.unit,1);assert.equal(next.unit,2);assert.ok(Math.abs(first.x)<.00001);assert.ok(Math.abs(next.x)<.00001);assert.equal(first.scanning,true);
});
test("Three AOI cases have explicit and distinct verdicts",()=>{
  assert.equal(inspectionAt(1,"normal").verdict,"OK");assert.equal(inspectionAt(1,"normal").defect,false);
  assert.equal(inspectionAt(1,"scratch").verdict,"NG");assert.equal(inspectionAt(1,"scratch").defect,true);
  assert.equal(inspectionAt(1,"review").verdict,"REVIEW");
});
test("Inspection lifecycle includes entry, scanning and completion",()=>{
  assert.equal(inspectionAt(.2).phase,"工件進站");assert.equal(inspectionAt(1.8).phase,"掃描檢查");assert.equal(inspectionAt(3.5).phase,"判定完成");
});
test("Force and heartbeat faults stop the robot and keep distinct reasons",()=>{
  assert.equal(signalAt(2,"normal").moving,true);
  for(const fault of ["force","heartbeat"]){assert.equal(signalAt(2,fault).moving,false);assert.equal(signalAt(2,fault).status,"SAFE STOP");}
  assert.equal(signalAt(2,"force").force,92);assert.equal(signalAt(2,"heartbeat").heartbeat,"LOST");
});
test("Identical clocks freeze simulation values deterministically",()=>{
  assert.deepEqual(inspectionAt(9,"review"),inspectionAt(9,"review"));
  assert.deepEqual(signalAt(9,"force"),signalAt(9,"force"));
});
test("No-JS document retains all nine projects and meaningful fallback assets",async()=>{
  const html=await readFile(join(root,"experience.html"),"utf8");
  assert.equal((html.match(/<h3>[^<]*<small>/g)||[]).length,9);
  assert.match(html,/<noscript>/);assert.match(html,/非真實檢測影像/);assert.match(html,/八段可逆光點轉場/);
  for(const path of ["assets/immersive-aoi.svg","assets/immersive-safe.svg","assets/immersive-retail.svg","assets/immersive-knowledge.svg","assets/immersive-ops.svg","assets/immersive-planning.svg","assets/immersive-risk.svg","assets/immersive-simops.svg","assets/immersive-forge.svg","experience-state.js","experience-models.js","experience.css"])await access(join(root,path));
});
test("All referenced local HTML resources exist",async()=>{
  const html=await readFile(join(root,"experience.html"),"utf8");
  const paths=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1].split("#")[0]).filter(p=>p&&!p.includes(":"));
  for(const path of paths)await access(join(root,path));
});
test("HTML IDs are unique and every scenario has an accessible button",async()=>{
  const html=await readFile(join(root,"experience.html"),"utf8");
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  for(const name of Object.keys(AOI_CASES))assert.ok(html.includes('data-aoi="'+name+'"'));
  for(const name of Object.keys(SAFE_CASES))assert.ok(html.includes('data-safe="'+name+'"'));
  for(const name of Object.keys(RETAIL_CASES))assert.ok(html.includes('data-retail="'+name+'"'));
  for(const name of Object.keys(KNOWLEDGE_CASES))assert.ok(html.includes('data-knowledge="'+name+'"'));
  for(const name of Object.keys(OPS_CASES))assert.ok(html.includes('data-ops="'+name+'"'));
  for(const name of Object.keys(PLANNING_CASES))assert.ok(html.includes('data-planning="'+name+'"'));
  for(const name of Object.keys(RISK_CASES))assert.ok(html.includes('data-risk="'+name+'"'));
  for(const name of Object.keys(SIMOPS_CASES))assert.ok(html.includes('data-simops="'+name+'"'));
  for(const name of Object.keys(FORGE_CASES))assert.ok(html.includes('data-forge="'+name+'"'));
  assert.match(html,/aria-haspopup="dialog"/);assert.match(html,/aria-live="polite"/);
});

test("Retail batch conserves all 11 input rows with documented demo totals",()=>{
  const batch=reconcileRows(RETAIL_ROWS);
  assert.equal(batch.received,11);assert.equal(batch.accepted,7);assert.equal(batch.rejected,3);assert.equal(batch.duplicates,1);
  assert.equal(batch.accepted+batch.rejected+batch.duplicates,batch.received);
  assert.equal(batch.sourceCents,11000);assert.equal(money4(batch.sourceCents),"110.0000");
});
test("Retail quality gate keeps cancellation, rejects invalid rows and deduplicates keys",()=>{
  const batch=reconcileRows(RETAIL_ROWS);
  assert.equal(batch.rows[3].route,"warehouse");assert.equal(batch.rows[3].quantity,-1);
  for(const row of batch.rows.slice(7,10))assert.equal(row.route,"quarantine");
  assert.equal(batch.rows[10].route,"duplicate");
  assert.deepEqual(RETAIL_ROWS[0],RETAIL_ROWS[10]);
});
test("Retail discrepancy blocks publication and does not mutate source data",()=>{
  const mismatch=retailAt(1,"mismatch"),normal=retailAt(1,"normal");
  assert.equal(mismatch.targetCents,10900);assert.equal(mismatch.deltaCents,-100);
  assert.equal(mismatch.publishable,false);assert.equal(mismatch.status,"BLOCKED");
  assert.equal(normal.targetCents,11000);assert.equal(normal.publishable,true);
  assert.equal(mismatch.sourceCents,normal.sourceCents);assert.equal(money4(-100),"-1.0000");
});
test("Retail rerun illustrates zero inserts and unchanged accepted records",()=>{
  const result=retailAt(14,"rerun");
  assert.equal(result.inserted,0);assert.equal(result.unchanged,7);assert.equal(result.targetCents,11000);assert.equal(result.deltaCents,0);
  assert.equal(result.status,"NO DUP");assert.equal(result.publishable,true);
});
test("Retail monitor and packet share the same row and deterministic routing clock",()=>{
  for(let i=0;i<11;i++){
    const s=retailAt(i*2.4+1.2);
    assert.equal(s.rowIndex,i);assert.ok(Math.abs(s.fraction-.5)<1e-8);
    assert.equal(s.row.route,i<7?"warehouse":i<10?"quarantine":"duplicate");
    assert.deepEqual(s,retailAt(i*2.4+1.2));
  }
  assert.equal(retailAt(11*2.4+.1).rowIndex,0);
});
test("Retail input guards and integer cents avoid floating amount drift",()=>{
  for(const t of [NaN,Infinity,-2])assert.equal(retailAt(t).rowIndex,0);
  assert.equal(retailAt(1,"unknown").status,"MATCH");
  assert.equal(reconcileRows([{key:"A",quantity:1,unitCents:10},{key:"B",quantity:1,unitCents:20}]).sourceCents,30);
  assert.equal(reconcileRows([{key:"A",quantity:1,unitCents:1.2}]).rejected,1);
});
test("Third scene has direct navigation, a unique monitor and truthful scope",async()=>{
  const html=await readFile(join(root,"experience.html"),"utf8");
  assert.match(html,/href="#retail" data-stop="retail"/);
  assert.match(html,/id="retailImage"/);assert.match(html,/id="retailTitle"/);assert.match(html,/9／9/);
  assert.match(html,/id="nextRetailRow"/);
  assert.match(html,/不等同執行原專案 ETL/);assert.match(html,/每一站都可停留/);
});

test("Knowledge cited script exposes evidence and a labelled demo citation",()=>{
  const s=knowledgeAt(4.4,"cited");
  assert.equal(s.authorized,true);assert.equal(s.evidence,true);assert.equal(s.retrieved,1);
  assert.equal(s.mockGenerated,true);assert.equal(s.route,"answer");assert.match(s.citation,/DEMO-SOP/);
});
test("Insufficient evidence routes to human review without a generated answer",()=>{
  const s=knowledgeAt(4.4,"insufficient");
  assert.equal(s.authorized,true);assert.equal(s.retrieved,0);assert.equal(s.mockGenerated,false);
  assert.equal(s.route,"review");assert.equal(s.status,"REVIEW");
});
test("Denied collection never retrieves or generates in the teaching script",()=>{
  const s=knowledgeAt(4.4,"denied");
  assert.equal(s.authorized,false);assert.equal(s.retrieved,0);assert.equal(s.mockGenerated,false);
  assert.equal(s.route,"blocked");assert.equal(s.citation,"未讀取文件");
});
test("Knowledge script has five deterministic steps per scenario",()=>{
  for(const name of Object.keys(KNOWLEDGE_CASES)){
    const steps=Array.from({length:5},(_,i)=>knowledgeAt(i+.4,name));
    assert.deepEqual(steps.map(s=>s.step),[0,1,2,3,4]);
    assert.equal(new Set(steps.map(s=>s.phase)).size,5);
    assert.equal(knowledgeAt(5.4,name).step,0);
  }
});
test("Knowledge input guards select a finite default state",()=>{
  for(const t of [NaN,Infinity,-2])assert.equal(knowledgeAt(t).step,0);
  assert.equal(knowledgeAt(1,"unknown").status,"CITED");
});
test("Knowledge clock is repeatable and authored cases are immutable",()=>{
  for(const name of Object.keys(KNOWLEDGE_CASES)){
    assert.deepEqual(knowledgeAt(8.4,name),knowledgeAt(8.4,name));
    assert.equal(Object.isFrozen(KNOWLEDGE_CASES[name]),true);
    assert.equal(knowledgeAt(1,name).provider,"OFFLINE SCRIPT");
  }
});
test("Fourth scene provides navigation, monitor, manual stepping and demo scope",async()=>{
  const html=await readFile(join(root,"experience.html"),"utf8");
  assert.match(html,/href="#knowledge" data-stop="knowledge"/);
  for(const id of ["knowledgeImage","knowledgeTitle","knowledgeQuestion","knowledgeCitation","nextKnowledgeStep"])assert.ok(html.includes('id="'+id+'"'));
  assert.match(html,/固定腳本/);
});

test("OpsFlow complete evidence produces a summary, never actuator permission",()=>{
 const r=opsAt(4.4,"normal");
 assert.equal(r.status,"SUMMARY");assert.equal(r.route,"summary");assert.equal(r.gate,"summary-only");
 assert.equal(r.approved,false);assert.equal(r.externalActions,0);
});
test("OpsFlow high risk stays at a closed human gate for every step",()=>{
 for(let t=0;t<20;t+=.2){const r=opsAt(t,"critical");assert.equal(r.route,"review");assert.equal(r.gate,"closed");assert.equal(r.approved,false);assert.equal(r.externalActions,0);}
});
test("OpsFlow timeout trace has at most two attempts and cannot self-approve",()=>{
 assert.deepEqual([.4,1.4,2.4,3.4,4.4].map(t=>opsAt(t,"timeout").attempts),[0,1,2,2,2]);
 const r=opsAt(4.4,"timeout");assert.equal(r.status,"REVIEW");assert.equal(r.phase,"轉人工接手");assert.equal(r.maxAttempts,2);assert.equal(r.externalActions,0);
});
test("OpsFlow cases provide five unique authored steps and repeatable clocks",()=>{
 for(const name of Object.keys(OPS_CASES)){
  const rows=Array.from({length:5},(_,i)=>opsAt(i+.4,name));
  assert.deepEqual(rows.map(r=>r.step),[0,1,2,3,4]);assert.equal(new Set(rows.map(r=>r.phase)).size,5);
  assert.deepEqual(opsAt(2.4,name),opsAt(2.4,name));assert.equal(opsAt(5.4,name).step,0);assert.ok(Object.isFrozen(OPS_CASES[name]));
 }
});
test("OpsFlow invalid inputs remain finite and select a safe known case",()=>{
 for(const t of [-4,NaN,Infinity])assert.equal(opsAt(t).step,0);
 for(const name of ["unknown","__proto__","constructor"])assert.equal(opsAt(1,name).status,"SUMMARY");
});
test("All nine scenes have exactly one static key model in reduced mode",()=>{
 for(let i=0;i<=1000;i++){const r=journeyState(i/1000,true);assert.equal(Object.keys(SCENE_STOPS).filter(id=>r[id+"Dissolve"]===0).length,1);}
});
test("Fifth scene supplies evidence, manual stepping and truthful boundaries",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");
 assert.match(html,/href="#ops" data-stop="ops"/);
 for(const id of ["opsImage","opsTitle","opsIncident","opsTool","opsTrace","nextOpsStep"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/未執行真實工具/);assert.match(html,/所有情境外部動作/);
});

test("Planning baseline is an authored seven-day series totalling 700",()=>{
 const r=planningAt(.6);assert.deepEqual(r.values,[80,100,120,100,80,120,100]);assert.equal(r.total,700);assert.equal(r.delta,0);
});
test("Planning scenarios apply exact declared multipliers",()=>{
 const up=planningAt(.6,"upside"),down=planningAt(.6,"downside");
 assert.equal(up.total,875);assert.equal(up.delta,175);assert.deepEqual(up.values,[100,125,150,125,100,150,125]);
 assert.equal(down.total,560);assert.equal(down.delta,-140);assert.deepEqual(down.values,[64,80,96,80,64,96,80]);
});
test("Planning day, chart and model share one deterministic clock",()=>{
 for(const scenario of Object.keys(PLANNING_CASES))for(let i=0;i<7;i++){
  const r=planningAt(i*1.5+.6,scenario);assert.equal(r.dayIndex,i);assert.equal(r.value,r.values[i]);assert.equal(r.baseValue,PLANNING_BASELINE[i]);
  assert.deepEqual(r,planningAt(i*1.5+.6,scenario));
 }
 assert.equal(planningAt(11.1).dayIndex,0);
});
test("Planning scenario changes never mutate the baseline or definitions",()=>{
 assert.ok(Object.isFrozen(PLANNING_BASELINE));assert.ok(Object.isFrozen(PLANNING_CASES));
 for(const name of Object.keys(PLANNING_CASES)){assert.ok(Object.isFrozen(PLANNING_CASES[name]));const r=planningAt(0,name);r.values[0]=999;}
 assert.equal(planningAt(0).value,80);
});
test("Planning invalid inputs select a finite known state",()=>{
 for(const t of [NaN,Infinity,-5])assert.equal(planningAt(t).dayIndex,0);
 for(const name of ["unknown","__proto__","constructor"])assert.equal(planningAt(0,name).total,700);
});
test("Planning demonstration neither fits models nor estimates causality or orders",()=>{
 for(const name of Object.keys(PLANNING_CASES)){
  const r=planningAt(5,name);assert.equal(r.fitted,false);assert.equal(r.causal,false);assert.equal(r.externalOrders,0);assert.equal(r.model,"AUTHORED SERIES");
 }
});
test("Sixth scene has seven paired bars, manual stepping and explicit scope",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");
 assert.match(html,/href="#planning" data-stop="planning"/);
 for(const id of ["planningImage","planningTitle","planningTotal","planningDelta","nextPlanningDay"])assert.ok(html.includes('id="'+id+'"'));
 for(let i=0;i<7;i++)assert.ok(html.includes('id="planningBar'+i+'"'));
 assert.match(html,/未執行模型回測/);assert.match(html,/非因果/);
});

test("Risk equal holdings retain explicit full coverage without claiming low risk",()=>{
 const r=riskAt(.6);assert.equal(r.covered,100);assert.equal(r.top,25);assert.equal(r.concentration,.25);assert.equal(r.flag,false);assert.equal(r.gate,"report");
 assert.match(r.label,/不等於低風險/);
});
test("Risk concentrated fixture triggers only its declared illustrative threshold",()=>{
 const r=riskAt(.6,"concentrated");assert.equal(r.top,70);assert.equal(r.concentration,.52);assert.equal(r.threshold,60);assert.equal(r.flag,true);assert.equal(r.status,"REVIEW");
});
test("Risk missing holdings block conclusions without imputation or normalization",()=>{
 const r=riskAt(5.4,"missing");assert.equal(r.covered,90);assert.equal(r.weights[3],null);
 assert.equal(r.top,null);assert.equal(r.concentration,null);assert.equal(r.flag,null);assert.equal(r.complete,false);assert.equal(r.gate,"blocked");assert.equal(r.value,null);
});
test("Risk scanner and issuer share a repeatable four-position clock",()=>{
 for(let i=0;i<4;i++){const r=riskAt(i*1.6+.6);assert.equal(r.issuerIndex,i);assert.equal(r.issuer,"ABCD"[i]);assert.equal(r.value,r.weights[i]);assert.deepEqual(r,riskAt(i*1.6+.6));}
 assert.equal(riskAt(7).issuerIndex,0);
});
test("Risk unknown cases and invalid clocks safely use a finite known fixture",()=>{
 for(const t of [-1,NaN,Infinity])assert.equal(riskAt(t).issuerIndex,0);
 for(const name of ["unknown","__proto__","constructor"])assert.equal(riskAt(0,name).name,"均分持倉");
});
test("Risk fixtures are immutable, with no live model or trading side effects",()=>{
 for(const name of Object.keys(RISK_CASES)){const r=riskAt(0,name);assert.ok(Object.isFrozen(RISK_CASES[name]));assert.ok(Object.isFrozen(r.weights));assert.equal(r.modelRun,false);assert.equal(r.externalTrades,0);}
});
test("Seventh scene has direct navigation, manual inspection and truthful boundaries",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");
 assert.match(html,/href="#risk" data-stop="risk"/);
 for(const id of ["riskImage","riskTitle","riskCoverage","riskTop","riskIssuer","nextRiskIssuer"])assert.ok(html.includes('id="'+id+'"'));
 for(let i=0;i<4;i++)assert.ok(html.includes('id="riskBar'+i+'"'));
 assert.match(html,/非模型分數/);assert.match(html,/不提供買賣建議/);
});

test("SimOps pass and fail derive from the authored peak and explicit threshold",()=>{
 const pass=simopsAt(0),fail=simopsAt(0,"fail");
 assert.equal(pass.peak,46);assert.equal(pass.threshold,50);assert.equal(pass.passed,true);assert.equal(pass.status,"PASS");
 assert.equal(fail.peak,110);assert.equal(fail.passed,false);assert.equal(fail.status,"FAIL");
});
test("SimOps timeout never fabricates an impedance curve or verdict",()=>{
 for(let i=0;i<6;i++){const r=simopsAt(i*1.2+.4,"timeout");
 assert.equal(r.hasResult,false);assert.equal(r.samples,null);assert.equal(r.peak,null);assert.equal(r.value,null);assert.equal(r.frequency,null);assert.equal(r.passed,null);assert.equal(r.status,"NO RESULT");}
});
test("SimOps timeout attempts are bounded and terminate at a human handoff",()=>{
 const rows=Array.from({length:6},(_,i)=>simopsAt(i*1.2+.4,"timeout"));
 assert.deepEqual(rows.map(r=>r.attempts),[0,1,2,2,2,2]);assert.equal(rows[5].phase,"交由人員處理");
 assert.equal(rows[5].maxAttempts,2);
});
test("SimOps chart and probe share all six sample positions and a repeating clock",()=>{
 for(let i=0;i<6;i++){const r=simopsAt(i*1.2+.4,"fail");assert.equal(r.step,i);assert.equal(r.frequency,SIMOPS_FREQUENCIES[i]);assert.equal(r.value,SIMOPS_CASES.fail.samples[i]);assert.deepEqual(r,simopsAt(i*1.2+.4,"fail"));}
 assert.equal(simopsAt(7.6).step,0);
});
test("SimOps invalid inputs use a known fixture with a finite step",()=>{
 for(const t of [-1,NaN,Infinity])assert.equal(simopsAt(t).step,0);
 for(const name of ["unknown","__proto__","constructor"])assert.equal(simopsAt(0,name).status,"PASS");
});
test("SimOps authored definitions are immutable and cannot claim live solver or signoff",()=>{
 assert.ok(Object.isFrozen(SIMOPS_FREQUENCIES));
 for(const name of Object.keys(SIMOPS_CASES)){const r=simopsAt(0,name);assert.ok(Object.isFrozen(SIMOPS_CASES[name]));if(r.samples)assert.ok(Object.isFrozen(r.samples));assert.equal(r.solverRun,false);assert.equal(r.externalJobs,0);assert.equal(r.signoff,false);}
});
test("Eighth scene includes direct navigation, error state and explicit demonstration scope",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");assert.match(html,/href="#simops" data-stop="simops"/);
 for(const id of ["simopsImage","simopsTitle","simopsCurve","simopsNoResult","simopsTrace","nextSimopsStep"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/未執行求解器/);assert.match(html,/不代表正式 SI\/PI/);
});

test("Forge keeps the three historical registry states distinct",()=>{
 assert.equal(forgeAt(0,"nf4").status,"RELEASED");assert.equal(forgeAt(0,"q8").status,"PREVIOUS");assert.equal(forgeAt(0,"q4").status,"BLOCKED");
 assert.equal(forgeAt(0,"q8").absoluteGate,"pass");assert.notEqual(forgeAt(0,"q8").route,"released");
});
test("Forge quantitative snapshot matches the source policy-v2 evaluation",async()=>{
 const source=await readFile(join(root,"docs/sources/forge-evaluation.md"),"utf8");
 for(const c of Object.values(FORGE_CASES))for(const metric of ["eventF1","severityF1","rawSchema"])assert.ok(source.includes(c[metric].toFixed(2)+"%"));
 assert.equal(forgeAt(0,"q4").eventDrop,10.73);assert.equal(forgeAt(0,"q4").relativeLimit,1.5);assert.equal(forgeAt(0,"q4").relativePass,false);
});
test("Forge artifact sizes are bytes not VRAM and missing NF4 size stays unknown",async()=>{
 const source=await readFile(join(root,"docs/sources/forge-evidence.md"),"utf8");
 assert.equal(forgeAt(0).bytes,null);assert.match(forgeAt(0).size,/未列/);
 for(const name of ["q8","q4"]){const r=forgeAt(0,name);assert.ok(source.includes(r.bytes.toLocaleString("en-US")));assert.match(r.size,/十進位檔案大小/);}
});
test("Forge source run IDs and generation-contract boundaries stay traceable",async()=>{
 const source=await readFile(join(root,"docs/sources/forge-evidence.md"),"utf8");
 for(const c of Object.values(FORGE_CASES))assert.ok(source.includes(c.runId));
 assert.notEqual(FORGE_CASES.nf4.contract,FORGE_CASES.q8.contract);
 assert.equal(FORGE_CASES.q8.contract,FORGE_CASES.q4.contract);assert.match(forgeAt(0).comparison,/只作描述/);
});
test("Forge five-step explanation loops without modifying the historical verdict",()=>{
 for(const name of Object.keys(FORGE_CASES))for(let i=0;i<5;i++){const r=forgeAt(i*1.4+.4,name);assert.equal(r.step,i);assert.equal(r.status,FORGE_CASES[name].status);assert.deepEqual(r,forgeAt(i*1.4+.4,name));}
 assert.equal(forgeAt(7.4).step,0);
 for(const t of [-1,NaN,Infinity])assert.equal(forgeAt(t).step,0);
 for(const name of ["unknown","constructor","__proto__"])assert.equal(forgeAt(0,name).status,"RELEASED");
});
test("Forge snapshots are immutable and cannot perform training or release",()=>{
 assert.ok(Object.isFrozen(FORGE_CASES));
 for(const name of Object.keys(FORGE_CASES)){const r=forgeAt(0,name);assert.ok(Object.isFrozen(FORGE_CASES[name]));assert.equal(r.evidenceKind,"source-snapshot");assert.equal(r.records,224);assert.equal(r.policy,"policy-v2");assert.equal(r.trainingRun,false);assert.equal(r.inferenceRun,false);assert.equal(r.registryWrites,0);}
 assert.equal(forgeAt(0,"q4").gate,"closed");
});
test("Ninth station has navigation, controls, source links and static fallback",async()=>{
 const html=await readFile(join(root,"experience.html"),"utf8");
 for(const id of ["forgeImage","forgeTitle","forgeTrace","forgeEventBar","forgeControls","nextForgeStep"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/href="#forge" data-stop="forge"/);assert.match(html,/9／9/);assert.match(html,/非真實工廠準確率/);
 for(const source of ["forge-evaluation.md","forge-evidence.md","forge-external.md"])assert.ok(html.includes(source));
 await access(join(root,"assets/immersive-forge.svg"));
});
