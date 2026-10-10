// Pure, deterministic contracts shared by the 3D scene, monitor and tests.
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const smooth = x => { const p = clamp(x); return p * p * (3 - 2 * p); };
export const AOI_CASES = Object.freeze({
  normal: { name: "正常品", verdict: "OK", label: "未發現示意缺陷", color: "#91dbc3", defect: false },
  scratch: { name: "明顯刮痕", verdict: "NG", label: "刮痕超過示意門檻", color: "#f2a278", defect: true },
  review: { name: "人工複核", verdict: "REVIEW", label: "邊界案例，交由人員確認", color: "#dac894", defect: true }
});
export const SAFE_CASES = Object.freeze({
  normal: { name: "正常運轉", status: "NORMAL", label: "訊號有效，允許運動", color: "#91dbc3", moving: true },
  force: { name: "力量超限", status: "SAFE STOP", label: "模擬力量超限，鎖定安全停止", color: "#f2a278", moving: false },
  heartbeat: { name: "心跳遺失", status: "SAFE STOP", label: "模擬回報中斷，鎖定安全停止", color: "#f2a278", moving: false }
});
export const SCENE_STOPS = Object.freeze({ aoi:.025, safe:.14, retail:.255, knowledge:.37, ops:.485, planning:.60, risk:.715, simops:.83, forge:.965 });
export const SCENE_BRIDGES = Object.freeze([
  Object.freeze({from:"aoi",to:"safe",start:.05,end:.09}),
  Object.freeze({from:"safe",to:"retail",start:.19,end:.21}),
  Object.freeze({from:"retail",to:"knowledge",start:.30,end:.32}),
  Object.freeze({from:"knowledge",to:"ops",start:.42,end:.44}),
  Object.freeze({from:"ops",to:"planning",start:.53,end:.55}),
  Object.freeze({from:"planning",to:"risk",start:.65,end:.67}),
  Object.freeze({from:"risk",to:"simops",start:.76,end:.79}),
  Object.freeze({from:"simops",to:"forge",start:.88,end:.93})
]);
export function journeyState(value, reduced = false) {
  const p = clamp(Number.isFinite(value) ? value : 0);
  const found = SCENE_BRIDGES.findIndex(b => p <= SCENE_STOPS[b.to]);
  const bridgeIndex = found < 0 ? SCENE_BRIDGES.length - 1 : found, bridge = SCENE_BRIDGES[bridgeIndex];
  const transition = p <= bridge.start ? 0 : p >= bridge.end ? 1 : (p - bridge.start) / (bridge.end - bridge.start);
  const destination = transition < .5 ? bridge.from : bridge.to;
  const phase = reduced ? destination : transition <= 0 ? bridge.from : transition >= 1 ? bridge.to : "transition";
  const dissolve = Object.fromEntries(Object.keys(SCENE_STOPS).map(id => [id,1]));
  if (phase !== "transition") dissolve[phase] = 0;
  else {
    dissolve[bridge.from] = smooth(transition / .36);
    dissolve[bridge.to] = 1 - smooth((transition - .64) / .36);
  }
  return { progress: p, transition, phase, destination, bridgeIndex, from: bridge.from, to: bridge.to,
    aoiDissolve: dissolve.aoi, safeDissolve: dissolve.safe, retailDissolve: dissolve.retail, knowledgeDissolve: dissolve.knowledge, opsDissolve: dissolve.ops, planningDissolve: dissolve.planning, riskDissolve: dissolve.risk, simopsDissolve: dissolve.simops, forgeDissolve: dissolve.forge,
    particles: reduced ? 0 : smooth(transition / .16) * (1 - smooth((transition - .84) / .16)) };
}



/** Authored seven-day forecast, not a fitted model or a production plan.
 * Percent scenarios are deterministic overlays, not causal promotion estimates. */
export const PLANNING_BASELINE = Object.freeze([80,100,120,100,80,120,100]);
export const PLANNING_CASES = Object.freeze({
  baseline:Object.freeze({name:"基準預測",percent:100,status:"BASELINE",label:"7 日示意基準；未執行模型回測",color:"#91dbc3"}),
  upside:Object.freeze({name:"需求 +25%",percent:125,status:"+25%",label:"人為倍率假設，不代表促銷因果效果",color:"#e9b86b"}),
  downside:Object.freeze({name:"需求 −20%",percent:80,status:"−20%",label:"人為倍率假設，不代表實際市場變化",color:"#9fc9ed"})
});
export function planningAt(time,scenario="baseline"){
  const selected=Object.hasOwn(PLANNING_CASES,scenario)?PLANNING_CASES[scenario]:PLANNING_CASES.baseline;
  const seconds=Math.max(0,Number.isFinite(time)?time:0),dayIndex=Math.floor(seconds/1.5)%7,fraction=(seconds/1.5)%1;
  const values=PLANNING_BASELINE.map(n=>n*selected.percent/100);
  const baseTotal=PLANNING_BASELINE.reduce((a,b)=>a+b,0),total=values.reduce((a,b)=>a+b,0);
  return {...selected,values,dayIndex,fraction,baseTotal,total,delta:total-baseTotal,
    baseValue:PLANNING_BASELINE[dayIndex],value:values[dayIndex],
    phase:"第 "+(dayIndex+1)+" 日 · 基準 "+PLANNING_BASELINE[dayIndex]+" → 情境 "+values[dayIndex]+" 件",
    model:"AUTHORED SERIES",unit:"件",fitted:false,causal:false,externalOrders:0};
}

// Offline narrative only: no live telemetry, tool calls, real approval or actuator.
export const OPS_CASES = Object.freeze({
  normal: Object.freeze({name:"證據齊全",status:"SUMMARY",label:"交付調查摘要，不執行設備動作",color:"#91dbc3",route:"summary",risk:"示意低風險",
    incident:"DEMO-INC-01 · 運轉狀態查核",evidence:"遙測、維護紀錄與 SOP 均有示意引用",citation:"DEMO-T01 / H01 / SOP-02",
    action:"建議持續觀察；摘要不是執行授權",tool:"唯讀工具回傳示意結果",maxAttempts:1}),
  critical: Object.freeze({name:"高風險事件",status:"REVIEW",label:"保留證據，等待人工審核",color:"#f2a278",route:"review",risk:"示意高風險",
    incident:"DEMO-INC-02 · 異常訊號待查",evidence:"異常遙測與維護紀錄仍需人員判讀",citation:"DEMO-T02 / H02 / SOP-02",
    action:"不得自動處置；交由審核者確認",tool:"唯讀工具回傳示意結果",maxAttempts:1}),
  timeout: Object.freeze({name:"工具失敗",status:"REVIEW",label:"重試達上限，轉人工接手",color:"#e9b86b",route:"review",risk:"證據不完整",
    incident:"DEMO-INC-03 · 遙測取用失敗",evidence:"遙測缺失，不推測風險或結論",citation:"無遙測引用 · DEMO-SOP-02",
    action:"已停止重試；保留失敗軌跡待查",tool:"TIMEOUT · 最多 2 次嘗試",maxAttempts:2})
});
export function opsAt(time, scenario="normal") {
  const selected=Object.hasOwn(OPS_CASES,scenario)?OPS_CASES[scenario]:OPS_CASES.normal;
  const seconds=Math.max(0,Number.isFinite(time)?time:0);
  const steps=scenario==="timeout"
    ? ["事件驗證","唯讀工具：第 1 次逾時","有限重試：第 2 次逾時","停止重試、保留錯誤","轉人工接手"]
    : ["事件驗證","有界任務規劃","讀取示意證據","風險與引用驗證",selected.route==="summary"?"交付摘要（不執行動作）":"等待人工審核"];
  const fraction=(seconds/5)%1,step=Math.min(4,Math.floor(fraction*5));
  return {...selected,fraction,step,steps,phase:steps[step],
    attempts:scenario==="timeout"?(step<1?0:step<2?1:2):(step<2?0:1),
    gate:selected.route==="review"?"closed":"summary-only",
    externalActions:0,approved:false,trace:"OFFLINE / "+selected.incident.split(" · ")[0]};
}

// Authored teaching cases, not real retrieval, ACL enforcement or model inference.
export const KNOWLEDGE_CASES = Object.freeze({
  cited: Object.freeze({ name:"引用通過", status:"CITED", label:"引用檢查通過，交付示意回答", color:"#91dbc3", authorized:true, evidence:true, route:"answer",
    question:"設備異常如何通報？", answer:"記錄設備編號與異常，通知值班人員。", citation:"DEMO-SOP-01 §3", excerpt:"異常通報應附設備編號、現象與發生時間。" }),
  insufficient: Object.freeze({ name:"證據不足", status:"REVIEW", label:"沒有可用證據，轉人工查核", color:"#f2a278", authorized:true, evidence:false, route:"review",
    question:"未建檔機型的維修規範？", answer:"現有資料不足，不產生推測答案。", citation:"無可用引用", excerpt:"知識庫尚未收錄此機型的規範。" }),
  denied: Object.freeze({ name:"權限拒絕", status:"DENIED", label:"集合未授權，停止檢索與生成", color:"#c2abe4", authorized:false, evidence:false, route:"blocked",
    question:"能查詢未授權的文件集合嗎？", answer:"沒有存取權限，請向管理者申請。", citation:"未讀取文件", excerpt:"權限檢查不通過；未取得任何文件內容。" })
});
export function knowledgeAt(time, scenario = "cited") {
  const selected=KNOWLEDGE_CASES[scenario] || KNOWLEDGE_CASES.cited;
  const seconds=Math.max(0,Number.isFinite(time)?time:0), fraction=(seconds/5)%1;
  const steps=selected.authorized
    ? selected.evidence?["權限檢查","授權文件檢索","示意回答組合","引用驗證","回答交付"]:["權限檢查","授權文件檢索","證據門檻檢查","停止生成","人工審核"]
    : ["權限檢查","拒絕未授權集合","不讀取文件","不呼叫模型","等待申請授權"];
  const step=Math.min(4,Math.floor(fraction*5));
  return {...selected,fraction,step,phase:steps[step],steps,
    retrieved:selected.evidence?1:0, mockGenerated:selected.evidence,
    promptVersion:selected.evidence?"DEMO-P01 v1":"未執行",provider:"OFFLINE SCRIPT",trace:"DEMO-"+(selected.route.toUpperCase())};
}

// Original illustrative fixtures. Amounts are integer cents, not floating-point sums.
// Matches the documented demo shape (11 = 7 accepted + 3 rejected + 1 duplicate).
export const RETAIL_ROWS = Object.freeze([
  { key: "WEB-001", source: "CSV", quantity: 1, unitCents: 2500 },
  { key: "POS-002", source: "SQL", quantity: 2, unitCents: 2000 },
  { key: "WEB-003", source: "CSV", quantity: 1, unitCents: 1500 },
  { key: "RET-004", source: "JSONL", quantity: -1, unitCents: 1000 },
  { key: "POS-005", source: "SQL", quantity: 1, unitCents: 2000 },
  { key: "WEB-006", source: "CSV", quantity: 1, unitCents: 1250 },
  { key: "POS-007", source: "SQL", quantity: 1, unitCents: 750 },
  { key: "", source: "CSV", quantity: 1, unitCents: 800 },
  { key: "POS-009", source: "SQL", quantity: 0, unitCents: 1000 },
  { key: "WEB-010", source: "CSV", quantity: 1, unitCents: -100 },
  { key: "WEB-001", source: "CSV", quantity: 1, unitCents: 2500 }
].map(Object.freeze));
export const RETAIL_CASES = Object.freeze({
  normal: { name: "正常對帳", status: "MATCH", label: "筆數與淨額相符，可發布", color: "#91dbc3" },
  mismatch: { name: "金額不符", status: "BLOCKED", label: "差額 -1.0000，阻擋發布", color: "#f2a278" },
  rerun: { name: "重跑批次", status: "NO DUP", label: "相同批次再執行，新增 0 筆", color: "#91dbc3" }
});
export function money4(cents) {
  const sign = cents < 0 ? "-" : "", amount = Math.abs(cents);
  return sign + Math.floor(amount / 100) + "." + String(amount % 100).padStart(2, "0") + "00";
}
export function reconcileRows(rows) {
  const seen = new Set(), classified = [];
  let accepted = 0, rejected = 0, duplicates = 0, sourceCents = 0;
  for (const row of rows) {
    let route = "warehouse", reason = "品質通過，送入倉儲";
    if (!row.key || !Number.isInteger(row.quantity) || row.quantity === 0 || !Number.isInteger(row.unitCents) || row.unitCents < 0) {
      route = "quarantine"; reason = !row.key ? "缺少來源鍵" : row.quantity === 0 ? "數量不可為零" : "價格格式不合格"; rejected++;
    } else if (seen.has(row.key)) { route = "duplicate"; reason = "相同來源鍵，略過重複"; duplicates++; }
    else { seen.add(row.key); accepted++; sourceCents += row.quantity * row.unitCents; }
    classified.push(Object.freeze({ ...row, route, reason }));
  }
  return Object.freeze({ received: rows.length, accepted, rejected, duplicates, sourceCents, rows: Object.freeze(classified) });
}
const retailBatch = reconcileRows(RETAIL_ROWS);
export function retailAt(time, scenario = "normal") {
  const selected = RETAIL_CASES[scenario] || RETAIL_CASES.normal;
  const seconds = Math.max(0, Number.isFinite(time) ? time : 0), cycle = seconds / 2.4;
  const rowIndex = Math.floor(cycle) % retailBatch.received, fraction = cycle % 1;
  const row = retailBatch.rows[rowIndex], targetCents = retailBatch.sourceCents - (scenario === "mismatch" ? 100 : 0);
  return { ...retailBatch, ...selected, row, rowIndex, fraction, targetCents,
    deltaCents: targetCents - retailBatch.sourceCents, publishable: scenario !== "mismatch",
    inserted: scenario === "rerun" ? 0 : retailBatch.accepted, unchanged: scenario === "rerun" ? retailBatch.accepted : 0,
    phase: fraction < .42 ? "擷取與標準化" : fraction < .60 ? "品質與去重檢查" : row.reason };
}
export function inspectionAt(time, scenario = "scratch") {
  const seconds = Math.max(0, Number.isFinite(time) ? time : 0);
  const cycle = seconds / 3.6, fraction = cycle % 1;
  const item = AOI_CASES[scenario] || AOI_CASES.scratch;
  return { ...item, unit: Math.floor(cycle) + 1, fraction, x: (fraction - .5) * 1.72,
    scanning: Math.abs(fraction - .5) < .19,
    completed: fraction >= .69, phase: fraction < .31 ? "工件進站" : fraction < .69 ? "掃描檢查" : "判定完成" };
}
export function signalAt(time, scenario = "normal") {
  const selected = SAFE_CASES[scenario] || SAFE_CASES.normal;
  return { ...selected, force: scenario === "force" ? 92 : Math.round(18 + Math.sin(time * 1.8) * 4),
    heartbeat: scenario === "heartbeat" ? "LOST" : "ONLINE" };
}

// Original illustrative holdings, not public filings or a model score.
// Missing weights remain null. Never impute or normalize incomplete coverage.
export const RISK_CASES=Object.freeze({
 equal:Object.freeze({name:"均分持倉",weights:Object.freeze([25,25,25,25]),status:"COVERED",label:"資料完整不等於低風險；仍須研究",color:"#91dbc3"}),
 concentrated:Object.freeze({name:"單一集中",weights:Object.freeze([70,10,10,10]),status:"REVIEW",label:"單一占比 70%，觸發示意門檻 60%",color:"#e9b86b"}),
 missing:Object.freeze({name:"資料缺漏",weights:Object.freeze([40,30,20,null]),status:"BLOCKED",label:"缺少發行人 D；停止集中度結論",color:"#f2a278"})
});
export function riskAt(time,scenario="equal"){
 const c=Object.hasOwn(RISK_CASES,scenario)?RISK_CASES[scenario]:RISK_CASES.equal;
 const seconds=Math.max(0,Number.isFinite(time)?time:0),issuerIndex=Math.floor(seconds/1.6)%4;
 const covered=c.weights.reduce((a,w)=>a+(w??0),0),complete=c.weights.every(w=>w!==null)&&covered===100;
 const top=complete?Math.max(...c.weights):null;
 const concentration=complete?c.weights.reduce((a,w)=>a+w*w,0)/10000:null;
 const value=c.weights[issuerIndex],issuer="ABCD"[issuerIndex];
 return {...c,issuerIndex,issuer,value,covered,complete,top,concentration,flag:complete?top>=60:null,
  gate:complete?"report":"blocked",fraction:(seconds/6.4)%1,
  phase:"發行人 "+issuer+" · "+(value===null?"缺漏，未補值":value+"% 持倉占比"),
  threshold:60,modelRun:false,externalTrades:0};
}

// Authored impedance samples (milliohms), NOT an RLC/SPICE solver or measurement.
export const SIMOPS_FREQUENCIES=Object.freeze([.1,.3,1,3,10,30]); // MHz
export const SIMOPS_CASES=Object.freeze({
 pass:Object.freeze({name:"示意通過",samples:Object.freeze([42,28,18,24,37,46]),label:"六個示意點皆未超過 50 mΩ",color:"#91dbc3"}),
 fail:Object.freeze({name:"阻抗超限",samples:Object.freeze([55,36,20,44,82,110]),label:"示意峰值 110 mΩ；超過 50 mΩ",color:"#f2a278"}),
 timeout:Object.freeze({name:"工作逾時",samples:null,label:"兩次示意嘗試失敗；沒有有效結果",color:"#e9b86b"})
});
export function simopsAt(time,scenario="pass"){
 const c=Object.hasOwn(SIMOPS_CASES,scenario)?SIMOPS_CASES[scenario]:SIMOPS_CASES.pass;
 const seconds=Math.max(0,Number.isFinite(time)?time:0),step=Math.floor(seconds/1.2)%6;
 const hasResult=c.samples!==null,peak=hasResult?Math.max(...c.samples):null;
 const passed=hasResult?peak<=50:null,status=hasResult?(passed?"PASS":"FAIL"):"NO RESULT";
 const steps=["驗證示意設定","第 1 次派工逾時","第 2 次派工逾時","停止重試","保留失敗紀錄","交由人員處理"];
 return {...c,step,fraction:(seconds/7.2)%1,hasResult,peak,passed,status,
  frequency:hasResult?SIMOPS_FREQUENCIES[step]:null,value:hasResult?c.samples[step]:null,
  phase:hasResult?"示意掃頻 "+SIMOPS_FREQUENCIES[step]+" MHz · "+c.samples[step]+" mΩ":steps[step],
  attempts:hasResult?1:Math.min(step,2),maxAttempts:2,threshold:50,
  solverRun:false,externalJobs:0,signoff:false};
}


// Frozen policy-v2 source snapshot; never replace with newer-contract diagnostics.
// Historical local evaluation figures, not in-browser inference results.
export const FORGE_CASES=Object.freeze({
 nf4:Object.freeze({name:"QLoRA NF4",status:"RELEASED",registry:"已發布",route:"released",color:"#91dbc3",
  eventF1:86.24,severityF1:95.35,rawSchema:99.55,bytes:null,absoluteGate:"pass",
  label:"來源快照：已發布；非即時訓練",contract:"prompt schema + bounded repair",
  runId:"4a5ecea7-5bd0-471f-8b46-b5047939608d"}),
 q8:Object.freeze({name:"GGUF Q8_0",status:"PREVIOUS",registry:"回復備援",route:"previous",color:"#9fc9ed",
  eventF1:85.16,severityF1:85.34,rawSchema:100,bytes:1834426144,absoluteGate:"pass",
  label:"來源快照：previous-good；非目前發布",contract:"json-schema-v2",
  runId:"b9574978-6f58-413d-98d9-de9f970f6554"}),
 q4:Object.freeze({name:"GGUF Q4_K_M",status:"BLOCKED",registry:"阻擋發布",route:"blocked",color:"#f2a278",
  eventF1:74.43,severityF1:91.04,rawSchema:100,bytes:1107408672,absoluteGate:"fail",
  label:"來源快照：絕對與相對門檻皆失敗",contract:"json-schema-v2",
  runId:"dc791d3a-5dcc-4d45-9797-c7b4e0b31eb5"})
});
export function forgeAt(time,scenario="nf4"){
 const c=Object.hasOwn(FORGE_CASES,scenario)?FORGE_CASES[scenario]:FORGE_CASES.nf4;
 const seconds=Math.max(0,Number.isFinite(time)?time:0),step=Math.floor(seconds/1.4)%5;
 const steps=["資料與設定指紋","適配權重快照","量化產物追蹤","完整評測門檻","版本登錄："+c.registry];
 const eventDrop=Number((FORGE_CASES.q8.eventF1-FORGE_CASES.q4.eventF1).toFixed(2));
 return {...c,step,phase:steps[step],fraction:(seconds/7)%1,
  gate:c.route==="blocked"?"closed":"archive",steps,
  eventDrop,relativeLimit:1.5,relativePass:eventDrop<=1.5,
  comparison:c.route==="released"?"NF4 與 GGUF 生成契約不同；只作描述":"Q8 → Q4：event F1 下降 "+eventDrop.toFixed(2)+" 個百分點",
  size:c.bytes===null?"NF4：未列可比 GGUF 大小":(c.bytes/1e9).toFixed(3)+" GB · 十進位檔案大小",
  evidenceKind:"source-snapshot",policy:"policy-v2",records:224,maxTokens:192,
  trainingRun:false,inferenceRun:false,registryWrites:0};
}
