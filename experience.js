import { journeyState, inspectionAt, signalAt, retailAt, knowledgeAt, opsAt, forgeAt, simopsAt, SIMOPS_FREQUENCIES, riskAt, planningAt, PLANNING_BASELINE, money4, SCENE_STOPS, SCENE_BRIDGES, clamp } from "./experience-state.js";
import { TOUR_ORDER, TOUR_RATES, TOUR_SCRIPT, TOUR_TIMING, tourSelector, easeTour, tourBridgeProgress, captionLines } from "./experience-tour.js";

const $ = selector => document.querySelector(selector), root = document.documentElement;
const journey = $("#journey"), exhibit = $("#exhibit"), dialog = $("#monitorDialog");
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const mobileQuery = matchMedia("(max-width: 760px)"), shortQuery = matchMedia("(max-height: 680px) and (max-width: 760px)");
const fineQuery = matchMedia("(hover: hover) and (pointer: fine)");
let preference = false; try { preference = localStorage.getItem("axis09-scene-reduced") === "true"; } catch {}
let reduced = motionQuery.matches || preference, paused = false, fallback = false, loading = false, renderer = null;
let frame = 0, lastTime = 0, lastMonitor = 0, progress = 0, geometry = { top: 76, travel: 1, bottom: 1000 };
let aoiTime = 1.8, safetyTime = 1.5, retailTime = 1.2, driftTime = 0, aoiCase = "scratch", safeCase = "normal", retailCase = "normal", destination = "aoi";
let previousPhase = "", monitorKey = "", detail = false, pointer = { x: 0, y: 0 }, pageVisible = true;
let frames = 0, slowFrames = 0;
let knowledgeTime=2.2, knowledgeCase="cited";
let opsTime=2.2, opsCase="normal";
let planningTime=.6, planningCase="baseline";
let riskTime=.6, riskCase="equal";
let simopsTime=.4, simopsCase="pass";
let forgeTime=.4, forgeCase="nf4";
let tourActive=false, tourPaused=false, tourRun=0, tourSkipVersion=0, tourRate=1;
const staticMode = () => reduced || fallback || shortQuery.matches;
let previousLayoutStatic = staticMode();
const setText = (id, text) => { const node = $("#" + id); if (node.textContent !== String(text)) node.textContent = text; };
const announce = text => setText("announcement", text);
const SCENES = {
  forge: { eyebrow:"09 / 模型微調、量化與發布實務", title:"比較模型版本，<br><em>掌握品質與發布條件</em>", copy:"依據既有實測紀錄，比較 NF4、Q8 與 Q4 的評測表現及版本狀態。切換不同版本，了解已發布、回復備援與阻擋發布的差異，以及模型縮小後需要檢查的品質變化。", ghost:"FORGE.", monitor:"EVALUATION & REGISTRY", caption:"版本登錄快照", component:"認識模型台", note:"左側運算櫃、中央旋轉權重核心、右側三個登錄出口呈現模型治理。NF4 已發布、Q8 為回復備援、Q4 被阻擋，均來自 policy-v2 來源快照。動畫為原創隱喻，不執行訓練、推論或發布；Q8 通過評測不等於目前已發布。", tag:"ADAPT / QUANTIZE / GOVERN", image:"forgeImage", alt:"運算櫃、旋轉權重核心與已發布、備援、阻擋三個版本出口", dialog:"量化評測與版本登錄" },
  simops: { eyebrow:"08 / 電路模擬與流程自動化實務", title:"追蹤模擬流程，<br><em>保留結果與失敗紀錄</em>", copy:"透過示意阻抗曲線與工作紀錄，了解電路模擬的結果判讀方式。切換通過、超限與逾時情境，觀察探針位置、監看畫面及處理狀態的同步變化。", ghost:"SIMULATE.", monitor:"IMPEDANCE & JOB TRACE", caption:"示意案例結果", component:"認識模擬台", note:"左側工作節點接收案例，中央原創電路板與探針呈現掃頻隱喻，右側保存結果。曲線為固定教學樣本，非 RLC／SPICE 求解或量測；50 mΩ 是本頁示意門檻。逾時不補造曲線，AI 排序也不取代求解結果。", tag:"SWEEP / WORKERS / TRACE", image:"simopsImage", alt:"雙工作節點、電路板與移動探針、結果報告台", dialog:"阻抗曲線與派工軌跡" },
  risk: { eyebrow:"07 / 持倉分析與風險觀測實務", title:"看清持倉分布，<br><em>也辨識資料缺口</em>", copy:"比較均分、集中與資料缺漏三種合成持倉情境，了解占比分布與資料完整性如何影響分析。當資料不足時，保留未知，不直接給出集中度結論。", ghost:"EXPOSURE.", monitor:"HOLDINGS & QUALITY", caption:"資料與集中度", component:"認識觀測台", note:"四座環形柱對應合成發行人 A–D，柱高同步持倉百分比。掃描臂逐一查看，資料不完整時報告閘門關閉；不補值、不把完整資料等同低風險。60% 僅為本頁教學門檻，未執行原專案模型或交易。", tag:"HOLDINGS / QUALITY / REVIEW", image:"riskImage", alt:"申報檔案塔、四座環形持倉柱、旋轉掃描臂與資料品質閘門", dialog:"持倉占比與資料品質" },
  planning: { eyebrow:"06 / 需求預測與情境規劃實務", title:"比較不同假設，<br><em>理解需求變化</em>", copy:"以七日示意需求為基準，觀察上調與下調假設如何改變每日數量及總需求。透過同步圖表與立體柱體，清楚比較基準與情境之間的差異。", ghost:"FORECAST.", monitor:"FORECAST & SCENARIO", caption:"情境假設", component:"認識規劃台", note:"左側是模型候選的視覺隱喻；中央七日柱體與右側規則轉盤同步呈現情境倍率。此處使用原創七日示意序列，不執行模型訓練、回測或補貨最佳化。倍率不代表因果效果，也不會建立訂單。", tag:"BASELINE / ASSUMPTION / COMPARE", image:"planningImage", alt:"模型候選櫃、七日立體需求柱與情境倍率轉盤", dialog:"七日基準與情境比較" },
  ops: { eyebrow:"05 / 營運事件調查實務", title:"串起事件與證據，<br><em>釐清處理方向</em>", copy:"從一則異常事件出發，逐步查看相關訊號、維護紀錄與作業規範。比較證據齊全、高風險與工具失敗時，流程如何交付摘要或轉由人員接手。", ghost:"TRACE.", monitor:"INCIDENT INVESTIGATION", caption:"調查結果", component:"認識調查台", note:"告警進入有界調查流程，串起唯讀遙測、維護與 SOP 證據。高風險或工具重試耗盡時轉人工，不自動執行設備動作。此處為原創離線腳本，非真實調查或核准系統。", tag:"INCIDENT / EVIDENCE / HANDOFF", image:"opsImage", alt:"告警塔、三聯證據牆、調查圓台與人工審核閘門", dialog:"事件證據與接手軌跡" },
  knowledge: { eyebrow:"04 / AI 知識管理實務", title:"回答有來源，<br><em>使用有權限</em>", copy:"透過示意問答，了解文件權限、資料檢索與引用驗證如何配合。比較證據齊全、資料不足與權限拒絕時，不同的回答與處理方式。", ghost:"GROUND.", monitor:"EVIDENCE & REVIEW", caption:"交付結果", component:"認識知識台", note:"文件先經集合權限檢查，再進入檢索與引用驗證。證據不足轉人工；無權限時不讀取文件、不生成回答。此處為固定離線腳本，不是真實 RAG、ACL 或模型推論。", tag:"PERMISSION / EVIDENCE / REVIEW", image:"knowledgeImage", alt:"旋轉文件庫、權限閘門與證據核心，分流到引用回答台或人工審核台", dialog:"知識來源與審核軌跡" },
  aoi: { eyebrow:"01 / 視覺檢測實務", title:"從影像辨識，<br><em>到品質判讀</em>", copy:"跟著工件通過檢測站，了解影像如何轉換成品質判斷。切換正常、刮痕與待複核情境，觀察示意缺陷標記與判定結果。", ghost:"INSPECT.", monitor:"VISION MONITOR", caption:"檢測結果", component:"認識檢測機", note:"門架內的相機取得影像，照明讓表面更清楚；程式標出可疑區域，再由規則或人員確認。此處為同步合成示意。", tag:"OPTICAL INSPECTION CELL", image:"inspectionImage", alt:"工件由輸送帶通過相機檢測門架的示意場景", dialog:"工件檢測畫面" },
  safe: { eyebrow:"02 / 即時感測與安全控制實務", title:"持續監看訊號，<br><em>及時回應異常</em>", copy:"透過互動示意，了解感測訊號如何影響設備運作。切換力量超限或心跳遺失情境，觀察機械臂停止的原因與狀態。", ghost:"PROTECT.", monitor:"SAFETY MONITOR", caption:"安全狀態", component:"認識安全站", note:"機械臂的感測訊號經過安全規則檢查。力量超限或心跳中斷會停止示意運動；這不是實體控制或硬體時限測試。", tag:"SENSING & SAFETY CELL", image:"safetyImage", alt:"RTSafe 機械臂、安全控制箱與感測節點示意", dialog:"安全訊號監看" },
  retail: { eyebrow:"03 / 資料整合與對帳實務", title:"整理多方資料，<br><em>核對每一筆結果</em>", copy:"追蹤資料從匯入、品質檢查到對帳的處理流程。切換金額不符與重跑情境，了解系統如何分流錯誤資料、避免重複入帳。", ghost:"RECONCILE.", monitor:"RECONCILIATION MONITOR", caption:"批次對帳", component:"認識資料站", note:"左側來源卡片經過標準化與品質閘門：合格進倉儲，錯誤隔離，重複鍵略過。再核對來源與倉儲淨額；重跑相同批次新增 0 筆。這是合成批次示意，沒有連線資料庫。", tag:"INGEST / VALIDATE / RECONCILE", image:"retailImage", alt:"CSV、SQL、JSONL 資料進入品質閘門，分流到倉儲、隔離及去重區", dialog:"資料品質與對帳明細" }
};
function restoreFocusIfHidden() {
  const active = document.activeElement;
  if (active && active !== document.body && active.closest("[hidden]")) {
    const link = document.querySelector('[data-stop="' + destination + '"]');
    link?.focus({ preventScroll: true });
  }
}
function applyAppearance(state) {
  const phase = state.phase, nextDestination = state.destination;
  const appearanceKey = phase + "/" + state.bridgeIndex;
  if (appearanceKey === previousPhase && nextDestination === destination) return;
  previousPhase = appearanceKey; destination = nextDestination;
  const isTransition = phase === "transition", safe = destination === "safe", scene = SCENES[destination];
  exhibit.classList.toggle("is-transition", isTransition);
  exhibit.classList.toggle("is-dark", safe || isTransition);
  exhibit.classList.toggle("is-retail", destination === "retail" && !isTransition);
  exhibit.classList.toggle("is-forge", destination === "forge" && !isTransition);
  exhibit.classList.toggle("is-simops", destination === "simops" && !isTransition);
  exhibit.classList.toggle("is-risk", destination === "risk" && !isTransition);
  exhibit.classList.toggle("is-planning", destination === "planning" && !isTransition);
  exhibit.classList.toggle("is-ops", destination === "ops" && !isTransition);
  exhibit.classList.toggle("is-knowledge", destination === "knowledge" && !isTransition);
  exhibit.classList.toggle("wide-monitor", ["retail","knowledge","ops","planning","risk","simops","forge"].includes(destination) && !isTransition);
  $("#liveMonitor").hidden = isTransition; $("#sceneHeading").hidden = isTransition;
  $("#transitionCopy").hidden = !isTransition; $("#sceneTools").hidden = isTransition;
  $("#nextRetailRow").hidden = destination !== "retail";
  $("#nextKnowledgeStep").hidden = destination !== "knowledge";
  $("#nextOpsStep").hidden = destination !== "ops";
  $("#nextForgeStep").hidden = destination !== "forge";
  $("#nextSimopsStep").hidden = destination !== "simops";
  $("#nextRiskIssuer").hidden = destination !== "risk";
  $("#nextPlanningDay").hidden = destination !== "planning";
  for (const [id, config] of Object.entries(SCENES)) {
    $("#" + id + "Controls").hidden = id !== destination;
    $("#" + config.image).toggleAttribute("hidden", id !== destination);
  }
  setText("sceneEyebrow", scene.eyebrow); $("#sceneTitle").innerHTML = scene.title; $("#sceneCopy").innerHTML = scene.copy;
  setText("ghostWord", scene.ghost); setText("monitorTitle", scene.monitor); setText("resultCaption", scene.caption);
  setText("componentButton", (detail ? "− " : "＋ ") + scene.component); setText("componentNote", scene.note);
  $("#modelTag").innerHTML = "<span>FIG. " + scene.eyebrow.slice(0,2) + "</span> " + scene.tag + " <i>程序化 3D · 合成示意</i>";
  $("#modelPoster").src = "assets/immersive-" + destination + ".svg"; $("#modelPoster").alt = scene.alt;
  $("#liveMonitor").setAttribute("aria-label", scene.dialog + (destination==="forge"?"，來源快照":"，合成示意"));
  setText("transitionSubtitle", ["從看見異常，到安全反應。","從設備的安全，到資料的可信。","從可信的資料，到有依據的回答。","從有依據的回答，到可接手的調查。","從眼前的異常，到明天的規劃。","從需求的假設，到曝險的證據。","從風險的線索，到可追查的驗證。","從工程的驗證，到模型的治理。"][state.bridgeIndex]);
  setText("stageNumber", scene.eyebrow.slice(0,2) + " / 09 SCENES · 09 PROJECTS");
  document.querySelectorAll(".site-header [data-stop]").forEach(a => {
    if (!isTransition && a.dataset.stop === destination) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
  });
  restoreFocusIfHidden(); renderer?.resize(); monitorKey = ""; lastMonitor = 0;
}
function refreshGeometry() {
  const box = journey.getBoundingClientRect();
  geometry.top = scrollY + box.top - $(".site-header").offsetHeight;
  geometry.travel = Math.max(1, journey.offsetHeight - exhibit.offsetHeight);
  geometry.bottom = scrollY + box.bottom;
  renderer?.resize(); schedule();
}
function updateProgress() {
  if (!staticMode()) progress = clamp((scrollY - geometry.top) / geometry.travel);
  $("#journeyProgress").style.transform = "scaleX(" + progress + ")";
  return journeyState(progress, staticMode());
}
function updateMonitor() {
  const safe = destination === "safe", retail = destination === "retail", knowledge=destination==="knowledge", ops=destination==="ops", planning=destination==="planning", risk=destination==="risk", simops=destination==="simops", forge=destination==="forge";
  const reading = forge ? forgeAt(forgeTime,forgeCase) : simops ? simopsAt(simopsTime,simopsCase) : risk ? riskAt(riskTime,riskCase) : planning ? planningAt(planningTime,planningCase) : ops ? opsAt(opsTime,opsCase) : knowledge ? knowledgeAt(knowledgeTime,knowledgeCase) : retail ? retailAt(retailTime, retailCase) : safe ? signalAt(safetyTime, safeCase) : inspectionAt(aoiTime, aoiCase);
  const value = safe || retail || knowledge || ops || planning || risk || simops || forge ? reading.status : reading.verdict;
  setText("resultValue", value); $("#resultValue").style.color = reading.color;
  setText("resultReason", reading.label);
  document.querySelector(".simulation-label").textContent = forge ? "來源快照" : "合成示意";
  setText("unitLabel", forge ? "POLICY-V2 · SNAPSHOT" : simops ? "AUTHORED · DEMO" : risk ? "SYNTHETIC · ONLY" : planning ? "7 DAYS · DEMO" : ops ? "OFFLINE · TRACE" : knowledge ? "OFFLINE · DEMO" : retail ? "BATCH 001 · SIM" : safe ? "FORCE " + reading.force + " N · SIM" : "PART " + String(reading.unit).padStart(4,"0"));
  setText("cycleLabel", safe ? "心跳 " + reading.heartbeat : reading.phase);
  if (forge) {
    setText("forgeModel",reading.name+" · "+reading.registry);
    setText("forgeMeta","來源實測快照 · 224 筆 / 192 max tokens");
    for(const [id,value] of [["Event",reading.eventF1],["Severity",reading.severityF1],["Schema",reading.rawSchema]]){
      $("#forge"+id+"Bar").setAttribute("width",String(value*2.7));
      $("#forge"+id+"Bar").setAttribute("fill",reading.color);
      setText("forge"+id+"Value",value.toFixed(2)+"%");
    }
    setText("forgeSize",reading.size);setText("forgeCompare",reading.comparison);
    setText("forgeTrace","解說 "+(reading.step+1)+"/5 · "+reading.phase);
    $("#forgeCursor").setAttribute("x",String(24+reading.step*86));
    setText("forgeTitle",reading.name+"；event F1 "+reading.eventF1+"%；"+reading.label+"。policy-v2 來源快照，不是即時推論。");
  } else if (simops) {
    setText("simopsPeak",reading.hasResult?"示意峰值 "+reading.peak+" mΩ":"無有效求解結果");
    setText("simopsJob",reading.hasResult?"固定教學曲線 · 6 個頻率點":"離線逾時腳本 · 嘗試 "+reading.attempts+"/"+reading.maxAttempts);
    const x=f=>40+400*Math.log10(f/.1)/Math.log10(300),y=z=>174-z*.8;
    $("#simopsCurve").setAttribute("points",reading.hasResult?reading.samples.map((z,i)=>x(SIMOPS_FREQUENCIES[i]).toFixed(2)+","+y(z).toFixed(2)).join(" "):"");
    $("#simopsCurve").setAttribute("stroke",reading.color);
    $("#simopsDot").toggleAttribute("hidden",!reading.hasResult);
    $("#simopsNoResult").toggleAttribute("hidden",reading.hasResult);
    if(reading.hasResult){$("#simopsDot").setAttribute("cx",x(reading.frequency));$("#simopsDot").setAttribute("cy",y(reading.value));}
    setText("simopsTrace","步驟 "+(reading.step+1)+"/6 · "+reading.phase);
    setText("simopsTitle","固定教學樣本："+reading.name+"；"+reading.label+"；"+reading.phase+"。未執行求解器，不是正式 SI/PI 簽核。");
  } else if (risk) {
    setText("riskCoverage","資料涵蓋 "+reading.covered+"%"+(reading.complete?" · 完整":" · 缺漏 10%"));
    setText("riskTop",reading.complete?"最大占比 "+reading.top+"% · 平方和 "+reading.concentration.toFixed(4):"最大占比 — · 平方和 —");
    setText("riskRule",reading.complete?"示意集中門檻 ≥60% · "+(reading.flag?"需進一步研究":"未觸發此單一規則"):"不補值／不重新正規化 · 結論封鎖");
    setText("riskIssuer",reading.phase);
    for(let i=0;i<4;i++){
      const value=reading.weights[i],bar=$("#riskBar"+i);
      bar.setAttribute("width",String((value??0)*3.6));
      bar.setAttribute("fill",value!==null&&value>=60?"#e9b86b":"#b7b1db");
      setText("riskWeight"+i,value===null?"缺漏":value+"%");
    }
    $("#riskCursor").setAttribute("y",String(78+reading.issuerIndex*25));
    setText("riskTitle","合成持倉："+reading.name+"；"+reading.label+"；"+reading.phase+"。不提供買賣建議。");
  } else if (planning) {
    setText("planningTotal","7 日合計 "+reading.total+" 件");
    setText("planningDelta","基準 "+reading.baseTotal+" · 差異 "+(reading.delta>0?"+":"")+reading.delta+" 件");
    setText("planningDay",reading.phase);setText("planningRule","情境 = 基準 × "+(reading.percent/100).toFixed(2)+" · 非因果估計");
    for(let i=0;i<7;i++){
      const bar=$("#planningBar"+i),height=reading.values[i]*.48;
      bar.setAttribute("height",height.toFixed(2));bar.setAttribute("y",(158-height).toFixed(2));bar.setAttribute("fill",reading.color);
      $("#planningBase"+i).setAttribute("height",String(PLANNING_BASELINE[i]*.48));
      $("#planningBase"+i).setAttribute("y",String(158-PLANNING_BASELINE[i]*.48));
    }
    $("#planningDayCursor").setAttribute("x",String(32+reading.dayIndex*61));
    setText("planningTitle","原創七日示意："+reading.name+"；基準 "+reading.baseTotal+" 件，情境 "+reading.total+" 件；"+reading.phase+"。未執行模型回測。");
  } else if (ops) {
    setText("opsIncident",reading.incident);setText("opsEvidence",reading.evidence);
    setText("opsCitation",reading.citation);setText("opsAction",reading.action);
    setText("opsMeta",reading.risk+" · 外部動作 "+reading.externalActions);
    setText("opsTool",reading.tool+" · 嘗試 "+reading.attempts+"/"+reading.maxAttempts);
    setText("opsTrace","步驟 "+(reading.step+1)+"/5 · "+reading.phase);
    $("#opsCursor").setAttribute("x",String(24+reading.step*86));
    $("#opsCitation").setAttribute("fill",reading.color);
    setText("opsTitle","合成事件調查："+reading.name+"；"+reading.label+"；"+reading.phase+"；外部動作 0。固定離線腳本。");
  } else if (knowledge) {
    setText("knowledgeQuestion",reading.question);setText("knowledgeAnswer",reading.answer);
    setText("knowledgeCitation",reading.citation);setText("knowledgeExcerpt",reading.excerpt);
    setText("knowledgeMeta",(reading.authorized?"ACL 通過":"ACL 拒絕")+" · 文件 "+reading.retrieved+" · "+reading.promptVersion);
    setText("knowledgeTrace","步驟 "+(reading.step+1)+"/5  ·  "+reading.phase);
    $("#knowledgeCursor").setAttribute("x",String(24+reading.step*86));
    $("#knowledgeCitation").setAttribute("fill",reading.color);
    setText("knowledgeTitle","合成知識流程："+reading.name+"；"+reading.answer+"；"+reading.citation+"；"+reading.phase+"。離線腳本，非真實模型推論。");
  } else if (retail) {
    setText("retailCounts", reading.received + " 筆輸入  /  " + reading.accepted + " 合格  /  " + reading.rejected + " 隔離  /  " + reading.duplicates + " 去重");
    setText("sourceTotal", money4(reading.sourceCents)); setText("targetTotal", money4(reading.targetCents));
    setText("deltaTotal", "差額 " + money4(reading.deltaCents) + "  ·  " + (reading.publishable ? "對帳通過" : "禁止發布"));
    $("#deltaTotal").setAttribute("fill", reading.color);
    setText("retailRow", "ROW " + String(reading.rowIndex + 1).padStart(2,"0") + " · " + (reading.row.key || "MISSING KEY"));
    setText("retailRoute", reading.phase);
    setText("retailWrites", "本次新增 " + reading.inserted + " 筆  /  未變更 " + reading.unchanged + " 筆");
    $("#retailCursor").setAttribute("x", (24 + reading.fraction * 420).toFixed(1));
    setText("retailTitle", "合成批次：" + reading.name + "；" + reading.received + " 筆輸入、" + reading.accepted + " 合格、" + reading.rejected + " 隔離、" + reading.duplicates + " 去重；來源 " + money4(reading.sourceCents) + "、倉儲 " + money4(reading.targetCents) + "；" + reading.label);
  } else if (!safe) {
    $("#defectPath").setAttribute("visibility", reading.defect ? "visible" : "hidden");
    $("#defectBox").setAttribute("visibility", reading.defect ? "visible" : "hidden");
    $("#defectPath").setAttribute("stroke-width", aoiCase === "review" ? "1.4" : "4");
    $("#defectBox").style.opacity = aoiCase === "review" ? ".65" : "1";
    const scan = 65 + reading.fraction * 350;
    $("#scanLine").setAttribute("d", "M" + scan.toFixed(1) + " 30V220");
    $("#scanLine").setAttribute("opacity", reading.scanning ? ".95" : ".15");
    setText("inspectionTitle", "合成工件 " + reading.unit + "：" + reading.name + "，判定 " + reading.verdict + "；非真實檢測影像");
  } else {
    const force = [], heartbeat = [];
    for (let i = 0; i <= 50; i++) {
      const x = 20 + i * 8.8, t = safetyTime * 1.8 - i * .24;
      const y = safeCase === "force" ? 48 + Math.sin(i * .19) * 2 : 112 + Math.sin(t) * 11 + Math.sin(t * 2) * 3;
      force.push((i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1));
      const pulse = ((i + Math.floor(safetyTime * 5)) % 12);
      const yy = safeCase === "heartbeat" ? 198 : pulse === 6 ? 178 : pulse === 7 ? 215 : 198;
      heartbeat.push((i ? "L" : "M") + x.toFixed(1) + " " + yy);
    }
    $("#forceWave").setAttribute("d", force.join("")); $("#forceWave").setAttribute("stroke", reading.color);
    $("#heartbeatWave").setAttribute("d", heartbeat.join("")); $("#heartbeatWave").setAttribute("stroke", safeCase === "heartbeat" ? "#f2a278" : "#91dbc3");
    setText("safetyTitle", "合成安全訊號：" + reading.name + "，" + reading.status + "，力量 " + reading.force + " N；非硬體量測");
  }
  const key = [destination, aoiCase, safeCase, retailCase, knowledgeCase, opsCase, planningCase, riskCase, simopsCase, forgeCase, value].join("/");
  if (monitorKey !== key) { monitorKey = key; exhibit.dataset.scenario = forge ? forgeCase : simops ? simopsCase : risk ? riskCase : planning ? planningCase : ops ? opsCase : knowledge ? knowledgeCase : retail ? retailCase : safe ? safeCase : aoiCase; exhibit.dataset.verdict = value; }
  if (dialog.open) {
    const source = $("#" + SCENES[destination].image);
    const clone = source.cloneNode(true); clone.removeAttribute("hidden");
    // Prefix IDs and local paint references so the enlarged view has no duplicate IDs.
    clone.querySelectorAll("[id]").forEach(node => { node.id = "zoom-" + node.id; });
    clone.removeAttribute("id"); clone.setAttribute("aria-label", source.querySelector("title").textContent); clone.removeAttribute("aria-labelledby");
    clone.querySelectorAll("[fill]").forEach(node => { const fill = node.getAttribute("fill"); if (fill.startsWith("url(#")) node.setAttribute("fill", fill.replace("url(#", "url(#zoom-")); });
    $("#enlargedFeed").replaceChildren(clone);
    setText("dialogResult", value + " · " + reading.label);
  }
}
function tick(timestamp) {
  frame = 0; const delta = lastTime ? Math.min(.05, (timestamp - lastTime) / 1000) : 0; lastTime = timestamp;
  const state = updateProgress(); applyAppearance(state);
  const visible = !document.hidden && pageVisible;
  const animate = visible && !paused && !reduced && !fallback && !dialog.open;
  if (animate) {
    driftTime += delta;
    if (state.phase === "aoi") aoiTime += delta;
    if (state.phase === "safe" && safeCase === "normal") safetyTime += delta;
    if (state.phase === "retail") retailTime += delta;
    if (state.phase === "knowledge") knowledgeTime += delta;
    if (state.phase === "ops") opsTime += delta;
    if (state.phase === "simops") simopsTime += delta;
    if (state.phase === "forge") forgeTime += delta;
    if (state.phase === "risk") riskTime += delta;
    if (state.phase === "planning") planningTime += delta;
  }
  if (renderer && visible) renderer.render({ journey: state, time: aoiTime, driftTime, safetyTime, retailTime, knowledgeTime, opsTime, planningTime, riskTime, simopsTime, forgeTime, aoiCase, safeCase, retailCase, knowledgeCase, opsCase, planningCase, riskCase, simopsCase, forgeCase, pointer, detail, reduced });
  if (!lastMonitor || timestamp - lastMonitor > 100) { updateMonitor(); lastMonitor = timestamp; }
  setText("motionStatus", fallback ? "靜態示意 · WebGL 不可用" : reduced ? "減少動態 · 靜態關鍵畫面" : paused || dialog.open ? "動畫已暫停 · 仍可滾動切換" : state.phase === "transition" ? "粒子轉場 · 滾動可逆" : "模擬運作中 · 可停留觀看");
  if (visible && delta) { frames++; if (delta > .0334) slowFrames++; }
  exhibit.dataset.phase = state.phase; exhibit.dataset.progress = progress.toFixed(4);
  exhibit.dataset.paused = String(paused); exhibit.dataset.reduced = String(reduced);
  if (frames % 60 === 0) { exhibit.dataset.sampledFrames = String(frames); exhibit.dataset.slowFrames = String(slowFrames); }
  if (animate) schedule();
}
function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
function failRenderer(message) {
  fallback = true; root.classList.add("fallback-view"); root.classList.remove("webgl-ready");
  $("#pauseMotion").disabled = true;
  renderer?.dispose(); renderer = null; previousPhase = ""; refreshGeometry();
  announce(message); setText("motionStatus", message);
}
async function enableRenderer() {
  if (loading || renderer || fallback) return;
  loading = true;
  try {
    const { createExperienceRenderer } = await import("./experience-models.js");
    renderer = await createExperienceRenderer($("#experienceCanvas"), { mobile: mobileQuery.matches, onFailure: failRenderer });
    renderer.render({journey:journeyState(progress,staticMode()),time:aoiTime,driftTime,safetyTime,retailTime,knowledgeTime,opsTime,planningTime,riskTime,simopsTime,forgeTime,aoiCase,safeCase,retailCase,knowledgeCase,opsCase,planningCase,riskCase,simopsCase,forgeCase,pointer,detail,reduced});
    root.classList.add("webgl-ready"); refreshGeometry();
  } catch (error) { failRenderer("3D 無法載入，已保留靜態示意與全部操作。"); console.warn("AXIS-09 scene fallback:", error.message); }
  finally { loading = false; }
}
function applyMotion() {
  reduced = motionQuery.matches || preference;
  root.classList.toggle("reduced-view", reduced);
  $("#motionToggle").setAttribute("aria-pressed", String(reduced));
  setText("motionToggle", reduced ? "動態已減少" : "減少動態");
  $("#pauseMotion").disabled = reduced || fallback;
  lastTime = 0; previousPhase = ""; refreshGeometry(); schedule();
}
function goToStop(stop, replace = false, instant = false) {
  if (!Object.hasOwn(SCENE_STOPS, stop)) return;
  const target = SCENE_STOPS[stop];
  if (staticMode()) { progress = target; previousPhase = ""; exhibit.scrollIntoView({behavior:"auto",block:"start"}); }
  else scrollTo({ top: geometry.top + geometry.travel * target, behavior: reduced || instant ? "instant" : "smooth" });
  const hash = "#" + stop;
  if (location.hash !== hash) history[replace ? "replaceState" : "pushState"](null,"",hash);
  schedule();
}
function clearTourTarget(){document.querySelectorAll(".tour-target").forEach(node=>node.classList.remove("tour-target"));}
function setTourPaused(value){if(!tourActive)return;tourPaused=value;$("#tourPause").setAttribute("aria-pressed",String(value));setText("tourPause",value?"▷ 繼續":"Ⅱ 暫停");}
function stopTour(hide=true){
  tourRun++;tourActive=false;tourPaused=false;root.classList.remove("tour-running");clearTourTarget();
  $("#tourComplete").hidden=true;$("#tourSpeed").hidden=false;
  $("#tourGuide").classList.remove("is-fading");
  $("#tourPause").hidden=false;$("#tourSkip").hidden=false;$("#tourPause").setAttribute("aria-pressed","false");setText("tourPause","Ⅱ 暫停");setText("tourExit","退出");
  $("#tourSubtitleWindow").classList.remove("is-rolling");$("#tourSubtitleWindow").dataset.typing="false";
  if(hide){$("#tourGuide").hidden=true;$("#tourControls").hidden=true;setText("tourSubtitleOld","");setText("tourSubtitleCurrent","");}
}
const waitFrame=duration=>new Promise(resolve=>setTimeout(resolve,duration));
async function tourDelay(duration,run){
  let remaining=duration/tourRate,last=performance.now(),skip=tourSkipVersion;
  while(remaining>0&&run===tourRun){
    await waitFrame(tourPaused?80:Math.min(80,Math.max(16,remaining)));const now=performance.now();
    if(skip!==tourSkipVersion)return true;
    if(!tourPaused)remaining-=now-last;
    last=now;
  }
  return run===tourRun;
}
async function tourScrollTo(target,duration,run,bridge=null){
  const startY=scrollY,distance=target-startY,skip=tourSkipVersion;
  if(Math.abs(distance)<2){scrollTo({top:target,behavior:"instant"});return true;}
  const total=(reduced?Math.min(420,duration):duration)/tourRate;
  let elapsed=0,last=performance.now();
  while(elapsed<total&&run===tourRun){
    await new Promise(resolve=>requestAnimationFrame(resolve));const now=performance.now();
    if(skip!==tourSkipVersion){scrollTo({top:target,behavior:"instant"});schedule();return true;}
    if(!tourPaused)elapsed+=now-last;
    last=now;
    const position=bridge&&!staticMode()
      ? geometry.top+geometry.travel*tourBridgeProgress(elapsed/total,SCENE_STOPS[bridge.from],SCENE_STOPS[bridge.to],bridge)
      : startY+distance*easeTour(elapsed/total);
    scrollTo({top:position,behavior:"instant"});schedule();
  }
  if(run!==tourRun)return false;scrollTo({top:target,behavior:"instant"});schedule();return true;
}
const punctuated=text=>/[。！？!?]$/.test(text)?text:text+"。";
const characterDelay=character=>TOUR_TIMING.typing+(/[，、；：]/.test(character)?150:/[。！？!?]/.test(character)?500:0);
const captionMeasure=document.createElement("canvas").getContext("2d");
function fittedCaptionLines(text){
  const line=$("#tourSubtitleCurrent"),style=getComputedStyle(line);
  captionMeasure.font=style.font;
  const spacing=parseFloat(style.letterSpacing)||0;
  return captionLines(text,Math.max(80,line.clientWidth-24),value=>captionMeasure.measureText(value).width+Math.max(0,Array.from(value).length-1)*spacing);
}
async function rollTourCaption(run){
  const windowNode=$("#tourSubtitleWindow"),currentLine=$("#tourSubtitleCurrent");
  if(!currentLine.textContent)return true;
  windowNode.dataset.typing="false";windowNode.classList.add("is-rolling");
  if(!await tourDelay(TOUR_TIMING.lineShift,run))return false;
  // Only the outgoing line moves; reset while empty to avoid a reverse slide.
  windowNode.classList.add("is-resetting");currentLine.textContent="";
  setText("tourSubtitleOld","");windowNode.classList.remove("is-rolling");
  void currentLine.offsetHeight;windowNode.classList.remove("is-resetting");
  return run===tourRun;
}
async function showTourCaption(text,progressLabel,run){
  const guide=$("#tourGuide"),controls=$("#tourControls"),windowNode=$("#tourSubtitleWindow"),currentLine=$("#tourSubtitleCurrent");
  guide.hidden=false;controls.hidden=false;setText("tourGuideProgress",progressLabel);
  if(!await rollTourCaption(run))return false;
  const caption=punctuated(text),skip=tourSkipVersion;
  let remaining=caption;
  while(remaining){
    const line=fittedCaptionLines(remaining)[0];
    remaining=remaining.slice(line.length);
    windowNode.dataset.typing=String(!reduced);
    for(const character of line){
      if(run!==tourRun)return false;
      currentLine.textContent+=character;
      if(!reduced&&!await tourDelay(characterDelay(character),run))return false;
      if(skip!==tourSkipVersion){currentLine.textContent=line;break;}
    }
    windowNode.dataset.typing="false";
    if(skip!==tourSkipVersion)break;
    if(remaining){
      if(!await tourDelay(reduced?1100:TOUR_TIMING.lineHold,run))return false;
      if(!await rollTourCaption(run))return false;
    }
    if(skip!==tourSkipVersion)break;
  }
  windowNode.dataset.typing="false";announce(caption);return run===tourRun;
}
function selectStaticTourScene(id){
  if(!staticMode())return;
  progress=SCENE_STOPS[id];previousPhase="";const state=journeyState(progress,true);applyAppearance(state);updateMonitor();$("#journeyProgress").style.transform="scaleX("+progress+")";schedule();
}
async function startGuidedTour(){
  stopTour();const run=tourRun;tourActive=true;root.classList.add("tour-running");
  $("#tourGuide").dataset.tone="event";
  $("#tourPause").hidden=false;$("#tourSkip").hidden=false;
  if(!await showTourCaption("準備開始九站自動導覽","00 / 09",run))return;
  refreshGeometry();
  if(!await tourDelay(TOUR_TIMING.explain,run))return;
  if(!await tourScrollTo(geometry.top+geometry.travel*SCENE_STOPS.aoi,TOUR_TIMING.curtain,run))return;
  history.replaceState(null,"","#aoi");
  for(let sceneIndex=0;sceneIndex<TOUR_SCRIPT.length;sceneIndex++){
    const sceneConfig=TOUR_SCRIPT[sceneIndex];
    if(sceneIndex>0){
      const previous=TOUR_SCRIPT[sceneIndex-1];
      $("#tourGuide").dataset.tone="event";
      if(!await showTourCaption("從"+previous.name+"，前往"+sceneConfig.name,String(sceneIndex+1).padStart(2,"0")+" / 09",run))return;
      if(!await tourDelay(TOUR_TIMING.transitionLead,run))return;
      refreshGeometry();
      if(!await tourScrollTo(geometry.top+geometry.travel*SCENE_STOPS[sceneConfig.id],TOUR_TIMING.transition,run,SCENE_BRIDGES[sceneIndex-1]))return;
      history.replaceState(null,"","#"+sceneConfig.id);
    }
    selectStaticTourScene(sceneConfig.id);
    if(!await tourDelay(TOUR_TIMING.arrival,run))return;
    for(let stepIndex=0;stepIndex<sceneConfig.steps.length;stepIndex++){
      const current=sceneConfig.steps[stepIndex],selector=tourSelector(sceneConfig,current);
      $("#tourGuide").dataset.tone="event";
      if(!await showTourCaption(current.title,String(sceneIndex+1).padStart(2,"0")+" / 09",run))return;
      if(!await tourDelay(TOUR_TIMING.explain,run))return;
      const target=$(selector);clearTourTarget();target?.classList.add("tour-target");
      if(!await tourDelay(TOUR_TIMING.focus,run))return;
      target?.click();
      // Show the result only after the shared model/monitor state has changed.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(run!==tourRun)return;
      $("#tourGuide").dataset.tone=current.tone;
      if(!await showTourCaption(current.body,String(sceneIndex+1).padStart(2,"0")+" / 09",run))return;
      if(!await tourDelay(TOUR_TIMING.observe,run))return;
      clearTourTarget();
    }
  }
  $("#tourGuide").dataset.tone="event";
  if(!await showTourCaption("九站完成，前往全部作品","09 / 09",run))return;
  if(!await tourDelay(TOUR_TIMING.explain,run))return;
  const collection=$("#collection"),target=scrollY+collection.getBoundingClientRect().top-$(".site-header").offsetHeight;
  if(!await tourScrollTo(target,TOUR_TIMING.collection,run))return;
  if(run!==tourRun)return;
  if(!await showTourCaption("已抵達全部作品","COMPLETE",run))return;
  if(!await tourDelay(1200,run))return;
  $("#tourGuide").classList.add("is-fading");
  if(!await tourDelay(400,run))return;
  $("#tourGuide").hidden=true;$("#tourControls").hidden=true;
  tourActive=false;root.classList.remove("tour-running");
  $("#tourComplete").hidden=false;$("#tourReplay").focus({preventScroll:true});
  announce("自動導覽完成，可重新播放、自由探索或查看專案內容。");
}
document.addEventListener("click", event => {
  if(tourActive&&event.isTrusted&&!event.target.closest("#tourGuide")&&!event.target.closest("#tourControls")&&!event.target.closest("#startAutoTour"))setTourPaused(true);
  const stop = event.target.closest("[data-stop]");
  if (stop) { event.preventDefault(); goToStop(stop.dataset.stop); return; }
  const aoi = event.target.closest("[data-aoi]"), safe = event.target.closest("[data-safe]"), retail = event.target.closest("[data-retail]");
  if (aoi) {
    aoiCase = aoi.dataset.aoi;
    document.querySelectorAll("[data-aoi]").forEach(b => b.setAttribute("aria-pressed", String(b === aoi)));
    announce("AOI 模擬情境：" + aoi.textContent); updateMonitor(); lastMonitor = 0; schedule();
  }
  if (safe) {
    safeCase = safe.dataset.safe;
    document.querySelectorAll("[data-safe]").forEach(b => b.setAttribute("aria-pressed", String(b === safe)));
    announce("RTSafe 模擬情境：" + safe.textContent + (safeCase === "normal" ? "，恢復示意運動。" : "，機械臂已安全停止。")); updateMonitor(); lastMonitor = 0; schedule();
  }
  if (retail) {
    retailCase = retail.dataset.retail;
    document.querySelectorAll("[data-retail]").forEach(b => b.setAttribute("aria-pressed", String(b === retail)));
    announce("Retail 模擬情境：" + retail.textContent + "，" + retailAt(retailTime, retailCase).label);
    updateMonitor(); lastMonitor = 0; schedule();
  }
  const forge=event.target.closest("[data-forge]");
  if(forge){
    forgeCase=forge.dataset.forge;
    document.querySelectorAll("[data-forge]").forEach(b=>b.setAttribute("aria-pressed",String(b===forge)));
    announce("ModelForge："+forgeAt(forgeTime,forgeCase).label);updateMonitor();schedule();
  }
  const simops=event.target.closest("[data-simops]");
  if(simops){
    simopsCase=simops.dataset.simops;
    document.querySelectorAll("[data-simops]").forEach(b=>b.setAttribute("aria-pressed",String(b===simops)));
    announce("模擬教學："+simopsAt(simopsTime,simopsCase).label);updateMonitor();schedule();
  }
  const risk=event.target.closest("[data-risk]");
  if(risk){
    riskCase=risk.dataset.risk;
    document.querySelectorAll("[data-risk]").forEach(b=>b.setAttribute("aria-pressed",String(b===risk)));
    announce("持倉示意："+riskAt(riskTime,riskCase).label);updateMonitor();schedule();
  }
  const planning=event.target.closest("[data-planning]");
  if(planning){
    planningCase=planning.dataset.planning;
    document.querySelectorAll("[data-planning]").forEach(b=>b.setAttribute("aria-pressed",String(b===planning)));
    const result=planningAt(planningTime,planningCase);
    announce("需求示意："+planning.textContent+"，7 日合計 "+result.total+" 件；非因果估計。");
    updateMonitor();lastMonitor=0;schedule();
  }
  const ops=event.target.closest("[data-ops]");
  if(ops){
    opsCase=ops.dataset.ops;opsTime=2.2;
    document.querySelectorAll("[data-ops]").forEach(b=>b.setAttribute("aria-pressed",String(b===ops)));
    announce("OpsFlow 示意："+ops.textContent+"，"+opsAt(opsTime,opsCase).label);
    updateMonitor();lastMonitor=0;schedule();
  }
  const knowledge=event.target.closest("[data-knowledge]");
  if(knowledge){
    knowledgeCase=knowledge.dataset.knowledge;knowledgeTime=2.2;
    document.querySelectorAll("[data-knowledge]").forEach(b=>b.setAttribute("aria-pressed",String(b===knowledge)));
    announce("KnowledgeOps 示意："+knowledge.textContent+"，"+knowledgeAt(knowledgeTime,knowledgeCase).label);
    updateMonitor();lastMonitor=0;schedule();
  }
});
$("#startAutoTour").addEventListener("click",()=>{startGuidedTour();});
$("#tourReplay").addEventListener("click",()=>{startGuidedTour();});
$("#tourExplore").addEventListener("click",()=>{stopTour();refreshGeometry();goToStop("aoi",true);});
$("#tourProjects").addEventListener("click",()=>{stopTour();$("#story").scrollIntoView({behavior:reduced?"instant":"smooth"});});
$("#startManualTour").addEventListener("click",()=>{stopTour();refreshGeometry();goToStop("aoi",true);announce("已進入手動遊覽，可自由捲動或選擇章節。");});
$("#tourSpeed").addEventListener("click",()=>{
  const current=TOUR_RATES.indexOf(tourRate);
  tourRate=TOUR_RATES[(current+1)%TOUR_RATES.length];
  setText("tourSpeed","速度 "+tourRate+"×");announce("自動導覽速度 "+tourRate+" 倍。");
});
$("#tourPause").addEventListener("click",()=>setTourPaused(!tourPaused));
$("#tourSkip").addEventListener("click",()=>{tourSkipVersion++;setTourPaused(false);});
$("#tourExit").addEventListener("click",()=>{stopTour();announce("已退出自動導覽，可自由操作目前場景。");});
addEventListener("wheel",()=>{if(tourActive)setTourPaused(true);},{passive:true});
addEventListener("touchstart",event=>{if(tourActive&&!event.target.closest("#tourGuide")&&!event.target.closest("#tourControls"))setTourPaused(true);},{passive:true});
addEventListener("keydown",event=>{if(tourActive&&["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," "].includes(event.key)&&!event.target.closest("#tourControls"))setTourPaused(true);});
$("#pauseMotion").addEventListener("click", () => { paused = !paused; $("#pauseMotion").setAttribute("aria-pressed",String(paused)); setText("pauseMotion", paused ? "▷ 繼續運作" : "Ⅱ 暫停運作"); lastTime = 0; schedule(); });
$("#nextRetailRow").addEventListener("click", () => {
  const current = retailAt(retailTime,retailCase);
  const next = (current.rowIndex + 1) % current.received;
  retailTime = next * 2.4 + 1.8;
  const row = retailAt(retailTime,retailCase).row;
  announce("第 " + (next + 1) + " 筆：" + row.reason);
  updateMonitor(); lastMonitor = 0; schedule();
});
$("#motionToggle").addEventListener("click", () => {
  if (motionQuery.matches) { announce("目前依照裝置設定減少動態。"); return; }
  preference = !preference; try { localStorage.setItem("axis09-scene-reduced",String(preference)); } catch {}
  const previousDestination = destination; applyMotion(); goToStop(previousDestination, true, true);
});
$("#nextForgeStep").addEventListener("click",()=>{
  const next=(forgeAt(forgeTime,forgeCase).step+1)%5;forgeTime=next*1.4+.4;
  announce(forgeAt(forgeTime,forgeCase).phase);updateMonitor();lastMonitor=0;schedule();
});
$("#nextSimopsStep").addEventListener("click",()=>{
  const next=(simopsAt(simopsTime,simopsCase).step+1)%6;simopsTime=next*1.2+.4;
  announce(simopsAt(simopsTime,simopsCase).phase);updateMonitor();lastMonitor=0;schedule();
});
$("#nextRiskIssuer").addEventListener("click",()=>{
  const next=(riskAt(riskTime,riskCase).issuerIndex+1)%4;riskTime=next*1.6+.6;
  announce(riskAt(riskTime,riskCase).phase);updateMonitor();lastMonitor=0;schedule();
});
$("#nextPlanningDay").addEventListener("click",()=>{
  const next=(planningAt(planningTime,planningCase).dayIndex+1)%7;planningTime=next*1.5+.6;
  announce(planningAt(planningTime,planningCase).phase);updateMonitor();lastMonitor=0;schedule();
});
$("#nextOpsStep").addEventListener("click",()=>{
  const next=(opsAt(opsTime,opsCase).step+1)%5;opsTime=next+.4;
  announce("調查步驟 "+(next+1)+"："+opsAt(opsTime,opsCase).phase);
  updateMonitor();lastMonitor=0;schedule();
});
$("#nextKnowledgeStep").addEventListener("click",()=>{
  const next=(knowledgeAt(knowledgeTime,knowledgeCase).step+1)%5;
  knowledgeTime=next+.4;
  announce("流程步驟 "+(next+1)+"："+knowledgeAt(knowledgeTime,knowledgeCase).phase);
  updateMonitor();lastMonitor=0;schedule();
});
$("#componentButton").addEventListener("click", () => {
  detail = !detail; $("#componentNote").hidden = !detail; $("#componentButton").setAttribute("aria-expanded",String(detail));
  setText("componentButton",(detail?"− ":"＋ ")+SCENES[destination].component); schedule();
});
$("#enlargeMonitor").addEventListener("click", () => {
  setText("dialogTitle", SCENES[destination].dialog);
  $("#monitorDialog .overline").textContent=destination==="forge"?"ARCHIVED EVALUATION":"SIMULATED OBSERVATION";
  dialog.showModal(); updateMonitor(); $("#closeMonitor").focus(); schedule();
});
$("#closeMonitor").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => { $("#enlargeMonitor").focus({preventScroll:true}); lastTime=0; schedule(); });
dialog.addEventListener("click", event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); } });
$("#modelHost").addEventListener("pointermove", event => {
  if (!fineQuery.matches || reduced || paused) return;
  const rect = $("#modelHost").getBoundingClientRect(); pointer = {x:clamp((event.clientX-rect.left)/rect.width,0,1)-.5,y:clamp((event.clientY-rect.top)/rect.height,0,1)-.5}; schedule();
},{passive:true});
$("#modelHost").addEventListener("pointerleave", () => { pointer={x:0,y:0};schedule(); });
addEventListener("scroll",schedule,{passive:true});
addEventListener("resize",()=>{
  const nextStatic=staticMode(),changedMode=nextStatic!==previousLayoutStatic;
  const activeScene=destination;
  const wasInside=previousLayoutStatic?pageVisible:scrollY>=geometry.top&&scrollY<=geometry.top+geometry.travel;
  const savedProgress=progress;
  previousLayoutStatic=nextStatic;
  refreshGeometry();
  if(changedMode&&wasInside)goToStop(activeScene,true,true);
  else if(wasInside&&!nextStatic)scrollTo({top:geometry.top+geometry.travel*savedProgress,behavior:"instant"});
});
addEventListener("pageshow",refreshGeometry); motionQuery.addEventListener("change",applyMotion);
shortQuery.addEventListener("change",()=>{previousPhase="";refreshGeometry();});
document.addEventListener("visibilitychange",()=>{lastTime=0;if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();});
new IntersectionObserver(entries=>{pageVisible=entries[0].isIntersecting;lastTime=0;schedule();},{threshold:0}).observe(exhibit);
// Native history restoration must not race our authored chapter positions.
history.scrollRestoration = "manual";
addEventListener("popstate",()=>requestAnimationFrame(()=>{
  const hash=location.hash.slice(1);
  if(!hash||Object.hasOwn(SCENE_STOPS,hash))goToStop(hash||"aoi",true,true);
  else document.getElementById(hash)?.scrollIntoView({behavior:"instant",block:"start"});
}));
root.classList.add("motion-ready");
document.querySelectorAll("button[disabled]").forEach(b=>{b.disabled=false;});
applyMotion(); enableRenderer(); document.fonts.ready.then(refreshGeometry);
if(Object.hasOwn(SCENE_STOPS,location.hash.slice(1)))requestAnimationFrame(()=>goToStop(location.hash.slice(1),true,true));
schedule();
