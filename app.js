import {
  baseForecast,
  buildPortfolioBrief,
  buildPostmortem,
  buildPostmortemMarkdown,
  buildReleaseManifest,
  buildShiftHandoff,
  buildWorkspaceSnapshot,
  buildIncidentBrief,
  buildForecast,
  calculatePortfolioRisk,
  evaluateAutonomy,
  evaluateEda,
  evaluateSafety,
  evidenceFor,
  evaluateCandidate,
  getRelatedEntities,
  getCapabilityCatalog,
  getRecoveryPlan,
  incidentFrames,
  incidentSteps,
  inspectSample,
  optimizeRecovery,
  verifyReleaseManifest,
  validateWorkspaceSnapshot,
} from "./engine.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const viewMeta = {
  overview: ["2026 / AUGUST INTELLIGENCE ATLAS", "營運總覽"],
  line: ["DIGITAL TWIN / PERCEPTION / SAFETY", "場域分身"],
  incident: ["INVESTIGATION / ACTION / RECOVERY", "事件中心"],
  decisions: ["FORECAST / RISK / SIMULATION", "決策實驗室"],
  evidence: ["RAG / GOVERNANCE / TRACE", "證據中樞"],
  collection: ["THE 2026 AUGUST COLLECTION", "作品圖譜"],
};

const moduleData = {
  aoi: {
    index: "01 / PHYSICAL INTELLIGENCE",
    title: "Surface AOI Inspector",
    lead: "把影像中的表面異常轉成可量測、可追溯、可人工複核的品質判定。",
    metrics: [["測試準確率", "97.11%"], ["像素 Dice", "73.38%"], ["推論中位數", "9.85 ms"]],
    role: "在整合系統中，它接收產線工件影像與配方，輸出 OK／NG／REVIEW、缺陷遮罩、面積與判定原因；邊界案例會送往證據工作流與人工複核。",
    skills: ["傳統影像與 ONNX AI 融合判定", "ROI、兩點尺度校正與 mm² 換算", "批次 CSV、配方雜湊與全程追溯"],
  },
  edge: {
    index: "02 / PHYSICAL INTELLIGENCE",
    title: "RTSafe Sensor Hub",
    lead: "以 1 kHz 週期處理感測、時限與故障降級，讓系統在異常時先安全停下來。",
    metrics: [["控制週期", "1 ms"], ["遙測封包", "52 bytes"], ["主機測試", "4 / 4"]],
    role: "它是整條故事線的最前端：力量、IMU、編碼器與心跳先經過合法性檢查、濾波與安全狀態機，再把含 CRC 的遙測交給上層。",
    skills: ["無動態配置的可移植 C11 核心", "NORMAL／DEGRADED／SAFE_STOP", "Zephyr、Linux supervisor 與故障注入"],
  },
  forecast: {
    index: "03 / DECISION INTELLIGENCE",
    title: "Demand Planning Workbench",
    lead: "用回測選模、預測區間與版本化規則，把未來需求變成可討論的營運情境。",
    metrics: [["預測週期", "14 days"], ["模型候選", "4"], ["回測", "Rolling"]],
    role: "當產線停機或品質事件影響供應，它會重算產能限制下的需求情境，顯示總量、受限天數與區間，而不是假裝預測是確定值。",
    skills: ["Seasonal Naive、Croston、趨勢與移動平均", "WAPE／MASE／Bias 回測證據", "multiplier、additive、override 情境規則"],
  },
  aiops: {
    index: "04 / AI GOVERNANCE",
    title: "KnowledgeOps Studio",
    lead: "把多模型串接、Prompt 版本、文件權限與品質評測整合成可治理的 AI 產品。",
    metrics: [["模型路由", "3 + mock"], ["品質閘門", "4 layers"], ["預設成本", "$0"]],
    role: "它提供整個合輯共用的模型閘道、PromptOps、ACL 與評測機制，確保 AI 輸出能追溯到模型、提示詞、文件與審核版本。",
    skills: ["OpenAI／Claude／Gemini／mock Gateway", "引用白名單與結構化輸出驗證", "評測題集、背景 worker 與人工審核"],
  },
  eda: {
    index: "05 / ENGINEERING SIMULATION",
    title: "SimOps Studio",
    lead: "把 PCB、SPICE、PDN 模擬與 AI 風險摘要串成可重現的設計驗證工作流。",
    metrics: [["電源軌", "1.0 V"], ["目前餘裕", "92%"], ["模式", "Offline"]],
    role: "它補上製造前的設計視角：讓工程師先觀察負載對電壓、接面溫度與安全餘裕的影響，再把模擬結果帶入審核與排程。",
    skills: ["KiCad PCB 解析與 PDN 模擬", "內建／ngspice／外部 EDA adapter", "排程、雜湊與 AI 風險摘要"],
  },
  finance: {
    index: "06 / DECISION INTELLIGENCE",
    title: "OpenFund Risk Workbench",
    lead: "以公開資料、時間序列特徵與模型監控，將投資風險轉成有治理邊界的決策輔助。",
    metrics: [["風險指標", "VaR"], ["模型監控", "Active"], ["資料模式", "Public"]],
    role: "金融模組在合輯裡展示相同的工程原則如何跨領域重用：特徵、模型、監控與報告都必須留證據，壓力測試只提供行動參考。",
    skills: ["可重現特徵工程與 ML pipeline", "風險分數、VaR 與回撤情境", "漂移監控、資料快照與模型治理"],
  },
  rag: {
    index: "07 / VERIFIED AGENT",
    title: "OpsFlow Agent",
    lead: "只在證據足夠時回答；沒有可靠來源，就拒答並把工作轉給人。",
    metrics: [["引用驗證", "Required"], ["失敗路由", "Human"], ["工作流", "Traceable"]],
    role: "它接住跨模組的『為什麼』：查詢安全規範、校正要求與作業 SOP，回傳來源、證據分數、模型版本與完整 trace。",
    skills: ["檢索、工具呼叫與狀態編排", "證據門檻、引用驗證與拒答", "離線評測、Kubernetes 與 API"],
  },
  etl: {
    index: "08 / DATA FOUNDATION",
    title: "Retail Data Hub",
    lead: "用資料契約、品質規則與跨資料庫報表層，守住所有模型之前的資料入口。",
    metrics: [["資料庫", "3 types"], ["品質規則", "Strict"], ["稽核", "SHA-256"]],
    role: "它是合輯的共同地基：檢查 CSV／JSON、合併重複資料、保留拒絕原因，並以 PostgreSQL、SQL Server 與 MongoDB 相容定義輸出。",
    skills: ["驗證、正規化、去重與品質評分", "PostgreSQL／MSSQL／MongoDB 方言", "ETL 稽核、報表層與資料字典"],
  },
};

const stationData = {
  inbound: { title: "ST-01 · 原料進站", description: "批次與來源資料正在通過 Retail Data Hub 的進站契約。", health: 98, utilization: "64%", cycle: "2.4s", signalA: ["Reader link", "ONLINE"], signalB: ["Batch", "LOT-A0826"], tasks: "00" },
  robot: { title: "RB-02 · 取放機械臂", description: "RTSafe Sensor Hub 正以 1 kHz 監測力量、IMU、編碼器與心跳。", health: 89, utilization: "84%", cycle: "1.8s", signalA: ["Safety", "NORMAL"], signalB: ["Force", "14.2 N"], tasks: "01" },
  aoi: { title: "VI-03 · 視覺檢測站", description: "Surface AOI Inspector 正在使用配方 precision-metal-v4。", health: 92, utilization: "78%", cycle: "9.8ms", signalA: ["Camera link", "ONLINE"], signalB: ["Recipe hash", "4f8a…c21"], tasks: "02" },
  buffer: { title: "BF-04 · 品質緩衝", description: "邊界樣本與正常工件分流保存，等待品質工程師處理。", health: 96, utilization: "52%", cycle: "12 WIP", signalA: ["Queue", "STABLE"], signalB: ["Oldest", "4m 12s"], tasks: "02" },
  pack: { title: "PK-05 · 包裝出站", description: "完成品標籤、批次血緣與報表雜湊已同步到出站紀錄。", health: 99, utilization: "71%", cycle: "2.1s", signalA: ["Labeler", "ONLINE"], signalB: ["Rate", "96%"], tasks: "00" },
};

let activeView = "overview";
let storyRunning = false;
let replayRunning = false;
let selectedPlan = "B";
let candidatePromoted = false;
let recoveryApproved = false;
let goldenCaseAdded = false;
let optimizedCandidate = null;
let autonomyLevel = "stage";
let activeGraphNode = "decision";
let activeGraphFilter = "all";
let activeTourStep = 0;
let activeLens = "strategy";
let pendingLens = "strategy";
let currentPostmortem = null;
let currentReleaseManifest = buildReleaseManifest();
let activeCapability = "CAP-01";
let simulatedSeconds = 8 * 3600 + 26 * 60 + 40;
let forceValues = Array.from({ length: 44 }, (_, index) => 13 + Math.sin(index / 3) * 2 + (index % 5) * 0.18);
let vibrationValues = Array.from({ length: 44 }, (_, index) => 7 + Math.cos(index / 4) * 1.6 + (index % 3) * 0.12);
let auditEntries = [
  ["08:26:40", "資料品質檢查完成", "8 個來源 · 0 個阻擋項目"],
  ["08:26:18", "預測情境 v12 已發布", "planner@local · SHA 7c9a…4d2"],
  ["08:25:56", "邊界樣本等待複核", "LOT-A0826 · frame 0421"],
];

function showView(view) {
  if (!viewMeta[view]) return;
  activeView = view;
  $$("[data-view-panel]").forEach((panel) => {
    const isActive = panel.dataset.viewPanel === view;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
  $$(".nav-item").forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("is-active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  $("#viewEyebrow").textContent = viewMeta[view][0];
  $("#viewTitle").textContent = viewMeta[view][1];
  if (location.hash !== `#${view}`) history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
$$("[data-jump]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.jump)));
window.addEventListener("hashchange", () => {
  const view = location.hash.slice(1);
  if (viewMeta[view] && view !== activeView) showView(view);
});
const initialView = location.hash.slice(1);
if (viewMeta[initialView]) showView(initialView);

const lensNarratives = {
  strategy: {
    label: "策略視角",
    tag: "STRATEGY LENS",
    index: "01 / STRATEGY",
    kicker: "2026 PORTFOLIO / VALUE LENS",
    title: "八種工程能力，<br /><em>一條可驗證的成果鏈。</em>",
    lead: "把感知、安全、品質、預測與 AI 治理收束成一套可衡量、可批准、也能持續學習的營運系統。",
    proof: [["8", "個整合模組"], ["240", "個決策候選"], ["100%", "證據可回溯"]],
    briefTitle: "從八個作品，看見一套完整的營運能力",
    briefCopy: "重點不是功能數量，而是每個模組如何降低停機、品質、交期與 AI 風險，並在同一條決策鏈上留下證據。",
    route: "總覽 → 事件中心 → 決策實驗室 → 證據中樞",
    emphasis: ["resilience", "decision"],
  },
  operations: {
    label: "現場視角",
    tag: "OPERATIONS LENS",
    index: "02 / OPERATIONS",
    kicker: "LIVE OPERATIONS / RESPONSE LENS",
    title: "異常發生時，<br /><em>每一秒都有下一步。</em>",
    lead: "從 1 kHz 安全防護、AOI 複檢到任務派送與交班，把一次事件轉成現場可以執行、下一班可以接手的動作。",
    proof: [["24.7s", "事件窗口"], ["3", "個前線任務"], ["1", "個交班物件"]],
    briefTitle: "從異常發生，到安全復原與完整交班",
    briefCopy: "優先看現場現在發生什麼、誰要負責、哪些動作可以執行，以及復原後還要持續監測哪些風險。",
    route: "總覽 → 場域分身 → 事件中心 → 交班記憶",
    emphasis: ["resilience", "quality"],
  },
  engineering: {
    label: "工程視角",
    tag: "ENGINEERING LENS",
    index: "03 / ENGINEERING",
    kicker: "SYSTEM EVIDENCE / ENGINEERING LENS",
    title: "每一個數字，<br /><em>都能回到版本與證據。</em>",
    lead: "資料契約、控制週期、視覺量測、模型評測與 AI 權限全部保留測試結果、版本、Trace 與明確驗證邊界。",
    proof: [["11", "個關聯物件"], ["25", "題黃金案例"], ["0", "阻擋性退步"]],
    briefTitle: "從實作細節，看見可驗證的工程方法",
    briefCopy: "優先檢查資料與訊號如何流動、模型如何驗證、動作如何授權，以及展示資料與真實生產能力之間的邊界。",
    route: "作品圖譜 → 場域分身 → 證據中樞 → AI 自主權",
    emphasis: ["quality", "learning"],
  },
};

function renderLens() {
  const lens = lensNarratives[activeLens];
  document.body.dataset.lens = activeLens;
  $("#activeLensLabel").textContent = lens.label;
  $("#openLens").setAttribute("aria-label", `切換觀看視角，目前為${lens.label}`);
  $("#heroKicker").innerHTML = `<span></span> ${lens.kicker}`;
  $("#heroTitle").innerHTML = lens.title;
  $("#heroLead").textContent = lens.lead;
  $("#heroProof").innerHTML = lens.proof.map(([value, label]) => `<span><b>${value}</b> ${label}</span>`).join("");
  $("#ledgerLensTag").textContent = lens.tag;
  $("#lensBriefIndex").textContent = lens.index;
  $("#lensBriefTitle").textContent = lens.briefTitle;
  $("#lensBriefCopy").textContent = lens.briefCopy;
  $("#lensRoute").textContent = lens.route;
  $$(".ledger-row").forEach((row) => row.classList.toggle("is-emphasized", lens.emphasis.includes(row.dataset.ledgerKey)));
}

function openLensDialog() {
  pendingLens = activeLens;
  $$("[data-lens]").forEach((button) => {
    const active = button.dataset.lens === pendingLens;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-checked", String(active));
  });
  $("#applyLens").textContent = `套用${lensNarratives[pendingLens].label}`;
  $("#lensBackdrop").hidden = false;
  requestAnimationFrame(() => $("[data-lens=\"" + pendingLens + "\"]").focus());
}

function closeLensDialog() { $("#lensBackdrop").hidden = true; }

$("#openLens").addEventListener("click", openLensDialog);
$("#openLensFromLedger").addEventListener("click", openLensDialog);
$("#closeLens").addEventListener("click", closeLensDialog);
$("#lensBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeLensDialog(); });
$$("[data-lens]").forEach((button) => button.addEventListener("click", () => {
  pendingLens = button.dataset.lens;
  $$("[data-lens]").forEach((item) => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-checked", String(active));
  });
  $("#applyLens").textContent = `套用${lensNarratives[pendingLens].label}`;
}));
$("#applyLens").addEventListener("click", () => {
  activeLens = pendingLens;
  renderLens();
  closeLensDialog();
  try { localStorage.setItem("2026-august-view-lens", activeLens); } catch { /* 偏好储存不可用时仍保留本次状态 */ }
  addAudit("作品觀看視角已切換", lensNarratives[activeLens].tag, "cyan");
  toast(`已套用${lensNarratives[activeLens].label}`, "核心能力與證據保持不變，首頁敘事與推薦路徑已重新排序。");
});

$$("[data-ledger-jump]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.ledgerJump)));

function exportPortfolioBrief() {
  const content = buildPortfolioBrief(activeLens);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `2026_8月合輯_${lensNarratives[activeLens].label}_作品說明書.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  addAudit("完整作品說明書已匯出", `${lensNarratives[activeLens].label} · 8 modules · Markdown`, "cyan");
  toast("作品說明書已建立", "包含核心主張、可驗證成果、八個模組、推薦展示路徑與作品邊界。");
}
$("#exportPortfolio").addEventListener("click", exportPortfolioBrief);

try {
  const savedLens = localStorage.getItem("2026-august-view-lens");
  if (savedLens && lensNarratives[savedLens]) activeLens = savedLens;
} catch { /* 忽略不可用的装置偏好 */ }
renderLens();

function updateClock() {
  simulatedSeconds = (simulatedSeconds + 1) % 86400;
  const hours = String(Math.floor(simulatedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((simulatedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(simulatedSeconds % 60).padStart(2, "0");
  $("#clock").textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);

function timestamp() {
  return $("#clock").textContent;
}

function addAudit(title, detail, tone = "cyan") {
  const entry = [timestamp(), title, detail, tone];
  auditEntries.unshift(entry);
  const item = document.createElement("div");
  item.className = "activity-item";
  item.innerHTML = `<i class="activity-dot ${tone}"></i><time>${entry[0]}</time><div><b>${title}</b><small>${detail}</small></div>`;
  $("#activityList").prepend(item);
}

function toast(title, detail) {
  const element = document.createElement("div");
  element.className = "toast";
  element.innerHTML = `<i></i><div><b>${title}</b><small>${detail}</small></div>`;
  $("#toastRegion").append(element);
  setTimeout(() => element.remove(), 3600);
}

$("#clearAudit").addEventListener("click", () => {
  $("#activityList").innerHTML = "";
  auditEntries = [];
  toast("畫面已清除", "封存的稽核資料不受影響。此動作只清除目前展示清單。");
});

function setOverviewSafety(result) {
  $("#overviewStatus").textContent = result.state;
  $("#overviewStatusReason").textContent = result.reason;
  $("#motorState").textContent = result.motor ? "ON" : "OFF";
  $("#pwmState").textContent = `${result.pwm}%`;
  $("#overviewStatusCard").classList.toggle("is-alert", result.state === "SAFE_STOP");
}

async function runStory() {
  if (storyRunning) return;
  storyRunning = true;
  const button = $("#runStory");
  button.disabled = true;
  button.innerHTML = '<span class="play-icon">●</span>演練進行中';
  $$(".pipeline-step").forEach((step) => step.classList.remove("is-active"));
  $("#pipelineProgress").style.width = "0%";
  $("#storyResult").classList.add("is-active");

  for (let index = 0; index < incidentSteps.length; index += 1) {
    const step = incidentSteps[index];
    $(`[data-pipeline-step="${index}"]`).classList.add("is-active");
    $("#pipelineProgress").style.width = `${index * 25}%`;
    $("#storyResult").innerHTML = `<span class="story-icon">${index === 4 ? "✓" : "↳"}</span><div><b>${step.title}</b><p>${step.module} · ${step.detail}</p></div>`;
    addAudit(step.title, step.detail, step.tone === "alert" ? "alert" : step.tone === "good" ? "good" : "amber");
    if (index === 0) setOverviewSafety(evaluateSafety({ force: 42.8 }));
    await sleep(760);
  }
  $("#pipelineProgress").style.width = "100%";
  $("#storyResult").innerHTML = '<span class="story-icon">✓</span><div><b>演練完成：事件已被安全收斂</b><p>停機原因、AOI 複檢、SOP 引用與排程影響已寫入同一筆可驗證 Trace。</p></div>';
  toast("整線演練完成", "五個環節皆已回寫稽核；你可以前往產線脈動查看細節。");
  await sleep(900);
  setOverviewSafety(evaluateSafety());
  button.disabled = false;
  button.innerHTML = '<span class="play-icon">▶</span>再次演練';
  storyRunning = false;
}
$("#runStory").addEventListener("click", runStory);

function selectStation(station) {
  const data = stationData[station] || stationData.aoi;
  $$("[data-station]").forEach((button) => button.classList.toggle("is-selected", button.dataset.station === station));
  $("#stationInspector").innerHTML = `
    <div class="station-inspector-head"><span>SELECTED ASSET</span><em>LIVE</em></div>
    <h4>${data.title}</h4>
    <p>${data.description}</p>
    <div class="station-stats"><span><small>HEALTH</small><b>${data.health}</b></span><span><small>UTIL.</small><b>${data.utilization}</b></span><span><small>LAST CYCLE</small><b>${data.cycle}</b></span></div>
    <div class="station-signals"><div><span>${data.signalA[0]}</span><b>${data.signalA[1]}</b></div><div><span>${data.signalB[0]}</span><b>${data.signalB[1]}</b></div><div><span>Open tasks</span><b class="amber-text">${data.tasks}</b></div></div>
    <button class="button button-ghost" id="inspectSelected">開啟設備上下文 <span>↗</span></button>`;
  $("#inspectSelected").addEventListener("click", () => {
    if (station === "aoi") $(".inspection-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    else if (station === "robot") $(".telemetry-panel").scrollIntoView({ behavior: "smooth", block: "center" });
    else openDrawer({ index: `ASSET / ${station.toUpperCase()}`, title: data.title, lead: data.description, metrics: [["健康度", data.health], ["使用率", data.utilization], ["週期", data.cycle]], role: "設備物件已與即時訊號、任務、批次與決策 Trace 建立關聯。", skills: [data.signalA.join("："), data.signalB.join("："), `待處理任務：${data.tasks}`] });
  });
}

$$("[data-station]").forEach((button) => button.addEventListener("click", () => selectStation(button.dataset.station)));
$$("[data-twin-mode]").forEach((button) => button.addEventListener("click", () => {
  $$("[data-twin-mode]").forEach((item) => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
  $("#factoryMap").dataset.mode = button.dataset.twinMode;
  toast("數位分身圖層已切換", `${button.textContent.trim()}圖層已套用至 LINE 03。`);
}));
$$("[data-twin-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button.classList.contains("is-active"))));
$("#inspectSelected").addEventListener("click", () => $(".inspection-panel").scrollIntoView({ behavior: "smooth", block: "start" }));

function seededNoise(x, y, seed = 4) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 19.19) * 43758.5453;
  return value - Math.floor(value);
}

function drawInspection(sample = "micro-crack") {
  const canvas = $("#inspectionCanvas");
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#3d403c");
  gradient.addColorStop(.45, "#242826");
  gradient.addColorStop(1, "#333633");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = .14;
  for (let y = 0; y < height; y += 3) {
    const shade = 95 + Math.round(seededNoise(1, y, sample.length) * 55);
    ctx.strokeStyle = `rgb(${shade},${shade + 3},${shade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y / 15) * 2);
    ctx.bezierCurveTo(width * .3, y - 4, width * .62, y + 5, width, y - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * .66);
  vignette.addColorStop(0, "rgba(255,255,255,.035)");
  vignette.addColorStop(1, "rgba(0,0,0,.44)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (sample === "micro-crack") {
    ctx.strokeStyle = "rgba(8,10,9,.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * .4, height * .34);
    ctx.bezierCurveTo(width * .42, height * .4, width * .405, height * .45, width * .43, height * .5);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * .6, height * .6);
    ctx.lineTo(width * .625, height * .65);
    ctx.stroke();
  } else if (sample === "contamination") {
    ctx.fillStyle = "rgba(31,28,20,.66)";
    ctx.beginPath(); ctx.ellipse(width * .33, height * .38, 50, 28, -.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(width * .68, height * .61, 34, 22, .18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(155,126,65,.17)";
    ctx.beginPath(); ctx.arc(width * .35, height * .36, 20, 0, Math.PI * 2); ctx.fill();
  }
}

function selectSample(sample) {
  const result = inspectSample(sample);
  $$("[data-sample]").forEach((button) => button.classList.toggle("is-active", button.dataset.sample === sample));
  $("#inspectionStage").dataset.sample = sample;
  drawInspection(sample);
  const verdict = $("#inspectionVerdict");
  verdict.className = `verdict ${result.verdict.toLowerCase()}`;
  verdict.innerHTML = `<span>AI + RULE</span><strong>${result.verdict}</strong>`;
  $("#defectCount").textContent = result.defects;
  $("#defectArea").innerHTML = `${result.area.toFixed(2)} <i>mm²</i>`;
  $("#inspectionConfidence").textContent = `${result.confidence}%`;
  $("#inspectionLatency").innerHTML = `${result.latency} <i>ms</i>`;
  $("#inspectionReason").textContent = result.reason;
  addAudit(`AOI 判定：${result.verdict}`, `${result.defects} 個瑕疵 · ${result.area.toFixed(2)} mm²`, result.verdict === "NG" ? "alert" : result.verdict === "OK" ? "good" : "amber");
}
$$("[data-sample]").forEach((button) => button.addEventListener("click", () => selectSample(button.dataset.sample)));
drawInspection();

function chartPath(values, width, height, max = 50, min = 0) {
  return values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * height;
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function updateTelemetry() {
  if (activeView !== "line") return;
  const nextForce = 13.5 + Math.sin(Date.now() / 1450) * 1.7 + ((simulatedSeconds % 7) * .13);
  const nextVibration = 7.2 + Math.cos(Date.now() / 1800) * 1.3;
  forceValues = [...forceValues.slice(1), nextForce];
  vibrationValues = [...vibrationValues.slice(1), nextVibration];
  renderTelemetry();
}

function renderTelemetry() {
  const width = 620;
  const height = 170;
  const forcePath = chartPath(forceValues, width, height, 50);
  const vibrationPath = chartPath(vibrationValues, width, height, 50);
  $("#forceLine").setAttribute("d", forcePath);
  $("#vibrationLine").setAttribute("d", vibrationPath);
  $("#telemetryArea").setAttribute("d", `${forcePath} L${width} ${height} L0 ${height}Z`);
  $("#telemetryNow").textContent = `${forceValues.at(-1).toFixed(1)} N`;
}
renderTelemetry();
setInterval(updateTelemetry, 900);

function applySafety(result) {
  const card = $("#safetyStateCard");
  card.classList.toggle("is-alert", result.state === "SAFE_STOP");
  card.classList.toggle("is-warn", result.state === "DEGRADED");
  $("#safetyState").textContent = result.state;
  $("#safetyReason").textContent = result.reason;
  $("#lineMotor").textContent = result.motor ? "ON" : "OFF";
  $("#linePwm").textContent = `${result.pwm}%`;
  $("#safetyTag").textContent = result.state;
  $("#safetyTag").className = `tag ${result.state === "NORMAL" ? "tag-good" : "tag-amber"}`;
  card.querySelector(".safety-glyph").textContent = result.state === "NORMAL" ? "✓" : "!";
  setOverviewSafety(result);
}

async function injectFault(type) {
  if (type === "reset") {
    forceValues = forceValues.map((value) => Math.min(value, 17));
    const result = evaluateSafety();
    applySafety(result);
    addAudit("安全狀態已復歸", "狀態機回到 NORMAL · 馬達重新使能", "good");
    toast("復歸完成", "訊號已恢復允收範圍，馬達使能重新開啟。");
    renderTelemetry();
    return;
  }
  const result = type === "force" ? evaluateSafety({ force: 42.8 }) : evaluateSafety({ heartbeat: false });
  if (type === "force") {
    forceValues = [...forceValues.slice(4), 18, 24, 42.8, 46, 39];
    renderTelemetry();
  }
  applySafety(result);
  addAudit(`觸發 ${result.state}`, result.reason, "alert");
  toast("安全防護已介入", `${result.reason}；輸出已在同一控制週期切換為安全狀態。`);
}
$$("[data-fault]").forEach((button) => button.addEventListener("click", () => injectFault(button.dataset.fault)));

function renderReplay(index = 0) {
  const safeIndex = Math.max(0, Math.min(incidentFrames.length - 1, Number(index)));
  const frame = incidentFrames[safeIndex];
  $$("[data-replay]").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.replay) <= safeIndex));
  $("#replayProgress").style.width = `${safeIndex * 25}%`;
  $("#correlationCursor").style.left = `calc(12px + ${safeIndex * 23.5}%)`;
  $("#replayInput").value = safeIndex;
  updateRangeFill($("#replayInput"));
  $("#replayTime").textContent = frame.time;
  $("#replayFinding").innerHTML = `<span>0${safeIndex + 1}</span><div><small>${frame.type}</small><b>${frame.title}</b><p>${frame.detail}</p></div>`;
}

$$("[data-replay]").forEach((button) => button.addEventListener("click", () => renderReplay(button.dataset.replay)));
$("#replayInput").addEventListener("input", (event) => renderReplay(event.currentTarget.value));

$("#playReplay").addEventListener("click", async () => {
  if (replayRunning) return;
  replayRunning = true;
  $("#playReplay").innerHTML = "<span>●</span>播放中";
  for (let index = 0; index < incidentFrames.length; index += 1) {
    renderReplay(index);
    await sleep(620);
  }
  $("#playReplay").innerHTML = "<span>↺</span>重播";
  replayRunning = false;
  addAudit("事件重播完成", "5 個跨訊號節點 · 根因信心 94%", "cyan");
});

function selectRecoveryPlan(planId) {
  selectedPlan = getRecoveryPlan(planId).id;
  const plan = getRecoveryPlan(selectedPlan);
  $$("[data-plan]").forEach((button) => { const selected = button.dataset.plan === selectedPlan; button.classList.toggle("is-selected", selected); button.setAttribute("aria-checked", String(selected)); });
  $("#selectedPlanBadge").textContent = `PLAN ${selectedPlan}`;
  $("#planDelay").textContent = plan.delay;
  $("#planRisk").textContent = plan.risk;
  $("#planReview").textContent = plan.review;
  $("#decisionPlanTitle").textContent = `PLAN ${selectedPlan} · ${plan.name}`;
  syncPostmortemIfOpen();
}
$$("[data-plan]").forEach((button) => button.addEventListener("click", () => { selectRecoveryPlan(button.dataset.plan); saveOperationalState(); }));

function openDecision() {
  const plan = getRecoveryPlan(selectedPlan);
  $("#decisionPlanTitle").textContent = `PLAN ${selectedPlan} · ${plan.name}`;
  $("#decisionDrawer").classList.add("is-open");
  $("#decisionDrawer").setAttribute("aria-hidden", "false");
  $("#decisionReason").focus();
}

function closeDecision() {
  $("#decisionDrawer").classList.remove("is-open");
  $("#decisionDrawer").setAttribute("aria-hidden", "true");
}

$("#stageRecovery").addEventListener("click", openDecision);
$("#closeDecision").addEventListener("click", closeDecision);
$("#cancelDecision").addEventListener("click", closeDecision);
$("#approveDecision").addEventListener("click", () => {
  const plan = getRecoveryPlan(selectedPlan);
  recoveryApproved = true;
  $("#incidentStatus").textContent = "方案已批准";
  $("#stageRecovery").textContent = `PLAN ${selectedPlan} 已批准`;
  $("#stageRecovery").disabled = true;
  const planTask = $('[data-task="plan"]');
  planTask.classList.add("is-done");
  $("mark", planTask).textContent = "已完成";
  closeDecision();
  addAudit(`復原方案 Plan ${selectedPlan} 已批准`, `${plan.name} · 預估 ${plan.duration} 分鐘`, "good");
  syncPostmortemIfOpen();
  saveOperationalState();
  toast("決策已寫入稽核", `Plan ${selectedPlan} 已成為共享的營運決策物件，所有下游畫面同步更新。`);
});

$$(".task-action").forEach((button) => button.addEventListener("click", () => {
  const row = button.closest(".action-row");
  if (row.dataset.task === "plan") { openDecision(); return; }
  const alreadyDone = row.classList.contains("is-done");
  row.classList.toggle("is-done", !alreadyDone);
  $("mark", row).textContent = alreadyDone ? "待處理" : "已完成";
  button.textContent = alreadyDone ? "完成" : "復原";
  addAudit(alreadyDone ? "任務已重新開啟" : "前線任務已完成", $("b", row).textContent, alreadyDone ? "amber" : "good");
  syncPostmortemIfOpen();
  saveOperationalState();
}));

$("#completeAllTasks").addEventListener("click", () => {
  $$(".action-row[data-task]").filter((row) => row.dataset.task !== "plan").forEach((row) => {
    row.classList.add("is-done");
    $("mark", row).textContent = "已完成";
    $(".task-action", row).textContent = "復原";
  });
  addAudit("可執行前線任務已完成", "2 個任務 · 1 個批准項目仍待處理", "good");
  syncPostmortemIfOpen();
  saveOperationalState();
  toast("任務已更新", "設備檢查與品質複核已完成；復原方案仍需批准。" );
});

function exportIncidentBrief() {
  const content = buildIncidentBrief(selectedPlan, $("#decisionReason").value);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "2026_8月合輯_INC-0826-0421_事件摘要.md";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  addAudit("事件摘要已匯出", `Plan ${selectedPlan} · Markdown`, "cyan");
  toast("事件摘要已建立", "包含根因、方案、決策理由與五階段證據鏈。" );
}
$("#exportBrief").addEventListener("click", exportIncidentBrief);
renderReplay(0);

function renderHandoff(memory) {
  $("#handoffId").textContent = memory.id;
  $("#handoffSummary").textContent = memory.summary;
  $("#handoffRisk").textContent = memory.openRisk;
  $("#handoffProgress").textContent = memory.progress;
  $("#handoffOwner").textContent = memory.nextOwner;
  $("#learnedRule").textContent = `「${memory.learnedRule}」`;
  $("#handoffTag").textContent = "MEMORY SAVED";
  $("#handoffTag").className = "tag tag-good";
  $("#captureGoldenCase").disabled = goldenCaseAdded;
  $("#generateHandoff").textContent = "更新交班記憶";
}

function generateHandoff() {
  const completedTasks = $$(".action-row[data-task].is-done").length;
  const memory = buildShiftHandoff({ plan: selectedPlan, completedTasks, approved: recoveryApproved });
  renderHandoff(memory);
  try { localStorage.setItem("august-shift-handoff", JSON.stringify(memory)); } catch { /* 離線儲存不可用時仍保留本次畫面狀態 */ }
  addAudit("交班記憶已更新", `${memory.id} · ${memory.progress}`, "cyan");
  toast("下一班已能直接接手", "事件、風險、任務與學到的規則已綁定為同一個營運記憶物件。");
}

$("#generateHandoff").addEventListener("click", generateHandoff);
$("#captureGoldenCase").addEventListener("click", () => {
  if (goldenCaseAdded) return;
  goldenCaseAdded = true;
  $("#captureGoldenCase").disabled = true;
  $("#captureGoldenCase").textContent = "已收錄為第 25 題黃金案例 ✓";
  $("#evalQuestionCount").textContent = "25";
  const caseRow = document.createElement("div");
  caseRow.className = "learned-golden-case";
  caseRow.innerHTML = "<span><i>OPS</i>力量突波 + AOI 邊界的復歸規則</span><em>NEW</em><em>PASS</em>";
  $(".golden-cases").append(caseRow);
  addAudit("營運記憶已收錄為黃金案例", "august-golden-v4 · case 25", "good");
  saveOperationalState();
  toast("學習閉環已完成", "這次事件會在下一個 AI 版本評測中阻止相同錯誤再次出現。");
});

try {
  const savedHandoff = JSON.parse(localStorage.getItem("august-shift-handoff") || "null");
  if (savedHandoff?.id) renderHandoff(savedHandoff);
} catch { /* 忽略不完整的本機展示資料 */ }

function renderPostmortem(postmortem) {
  currentPostmortem = postmortem;
  $("#postmortemId").textContent = postmortem.id;
  $("#postmortemTrace").textContent = `${postmortem.incidentId} / ${postmortem.traceId} / DECISION-${selectedPlan}`;
  $("#postmortemSummary").textContent = postmortem.summary;
  $("#postmortemDuration").textContent = postmortem.impact.duration;
  $("#postmortemQuality").textContent = postmortem.impact.quality;
  $("#postmortemDelivery").textContent = postmortem.impact.delivery;
  $("#postmortemDetection").textContent = postmortem.detection;
  $("#postmortemMitigation").textContent = postmortem.mitigation;
  $("#postmortemFactors").innerHTML = postmortem.contributingFactors.map((item) => `<li>${item}</li>`).join("");
  $("#postmortemWorked").innerHTML = postmortem.whatWorked.map((item) => `<li>${item}</li>`).join("");
  $("#postmortemActionList").innerHTML = postmortem.actions.map((action) => `
    <div class="postmortem-action ${action.status === "DONE" ? "is-done" : ""}">
      <span><i>${action.id}</i><b>${action.title}</b><small>${action.evidence}</small></span>
      <span><small>OWNER</small><b>${action.owner}</b></span>
      <span><small>DUE</small><b>${action.due}</b></span>
      <em>${action.status}</em>
    </div>`).join("");
  $("#postmortemSuccess").textContent = postmortem.successMetric;
  $("#postmortemTag").textContent = postmortem.status;
  $("#postmortemTag").className = `tag ${postmortem.status === "READY FOR REVIEW" ? "tag-good" : "tag-amber"}`;
  $("#generatePostmortem").textContent = "更新無責復盤";
  $("#exportPostmortem").disabled = false;
}

function syncPostmortemIfOpen() {
  if (!currentPostmortem) return;
  const completedTasks = $$(".action-row[data-task].is-done").length;
  const postmortem = buildPostmortem({ plan: selectedPlan, completedTasks, approved: recoveryApproved });
  renderPostmortem(postmortem);
  try { localStorage.setItem("august-postmortem", JSON.stringify(postmortem)); } catch { /* 本機儲存不可用時略過 */ }
}

function generatePostmortem() {
  const completedTasks = $$(".action-row[data-task].is-done").length;
  const postmortem = buildPostmortem({ plan: selectedPlan, completedTasks, approved: recoveryApproved });
  renderPostmortem(postmortem);
  try { localStorage.setItem("august-postmortem", JSON.stringify(postmortem)); } catch { /* 裝置儲存不可用時仍保留畫面 */ }
  addAudit("無責事故復盤已更新", `${postmortem.id} · ${postmortem.status} · ${completedTasks}/3 actions`, "cyan");
  toast("系統學習物件已建立", "影響、防護、促成因素、行動負責人、期限與成功指標已綁定到同一事件。" );
}

$("#generatePostmortem").addEventListener("click", generatePostmortem);
$("#exportPostmortem").addEventListener("click", () => {
  const completedTasks = $$(".action-row[data-task].is-done").length;
  const content = buildPostmortemMarkdown({ plan: selectedPlan, completedTasks, approved: recoveryApproved });
  downloadArtifact(content, "2026_8月合輯_POST-0827-01_無責事故復盤.md", "text/markdown;charset=utf-8");
  addAudit("無責事故復盤已匯出", `${currentPostmortem?.status || "DRAFT"} · Markdown`, "cyan");
  toast("復盤文件已建立", "包含影響、偵測、系統促成因素、有效防護、後續行動與成功指標。" );
});

try {
  const savedPostmortem = JSON.parse(localStorage.getItem("august-postmortem") || "null");
  if (savedPostmortem?.id) renderPostmortem(savedPostmortem);
} catch { /* 忽略不完整的本機展示資料 */ }

function svgLine(values, width = 760, height = 273, max = 340) {
  return chartPath(values, width, height, max);
}

function updateRangeFill(input) {
  const percent = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  input.style.setProperty("--range", `${percent}%`);
}

function renderForecast() {
  const promo = Number($("#promoInput").value);
  const price = Number($("#priceInput").value);
  const capacity = Number($("#capacityInput").value);
  const result = buildForecast({ promo, price, capacity });
  const baseline = buildForecast();
  $("#promoOutput").textContent = `+${promo}%`;
  $("#priceOutput").textContent = `${price >= 0 ? "+" : ""}${price}%`;
  $("#capacityOutput").textContent = capacity;
  $("#forecastTotal").textContent = result.total.toLocaleString("zh-TW");
  $("#forecastDelta").textContent = `${result.delta >= 0 ? "+" : ""}${result.delta.toFixed(1)}%`;
  $("#forecastDelta").style.color = result.delta < 0 ? "var(--red)" : "var(--cyan)";
  $("#baselinePath").setAttribute("d", svgLine(baseForecast));
  $("#scenarioPath").setAttribute("d", svgLine(result.forecast));
  const upperPoints = result.upper.map((value, index) => `${(index / 13) * 760},${273 - (value / 340) * 273}`).join(" L");
  const lowerPoints = [...result.lower].reverse().map((value, reverseIndex) => {
    const index = 13 - reverseIndex;
    return `${(index / 13) * 760},${273 - (value / 340) * 273}`;
  }).join(" L");
  $("#forecastBandPath").setAttribute("d", `M${upperPoints} L${lowerPoints} Z`);
  $("#scenarioDots").innerHTML = result.forecast.map((value, index) => `<circle cx="${(index / 13) * 760}" cy="${273 - (value / 340) * 273}" r="2.6"/>`).join("");
  $("#forecastNote").textContent = result.constrainedDays
    ? `${result.constrainedDays} 天需求高於每日產能，已截斷為可供應量；建議建立缺貨與延後交付情境。`
    : "目前情境未觸發產能限制；預測為規劃輔助，不代表因果效果。";
  [$("#promoInput"), $("#priceInput"), $("#capacityInput")].forEach(updateRangeFill);
}

[$("#promoInput"), $("#priceInput"), $("#capacityInput")].forEach((input) => input.addEventListener("input", () => {
  $$("[data-scenario]").forEach((button) => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
  renderForecast();
}));
$$("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
  const scenarios = {
    baseline: { promo: 0, price: 0, capacity: 330 },
    campaign: { promo: 18, price: -3, capacity: 310 },
    recovery: { promo: 4, price: 0, capacity: 230 },
  };
  const scenario = scenarios[button.dataset.scenario];
  $("#promoInput").value = scenario.promo;
  $("#priceInput").value = scenario.price;
  $("#capacityInput").value = scenario.capacity;
  $$("[data-scenario]").forEach((item) => item.classList.toggle("is-active", item === button));
  $$("[data-scenario]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  renderForecast();
  addAudit(`需求情境已套用：${$("b", button).textContent}`, `Promo ${scenario.promo}% · Capacity ${scenario.capacity}`, "cyan");
}));
$$("[data-scenario]").forEach((button) => button.setAttribute("aria-pressed", String(button.classList.contains("is-active"))));
renderForecast();

function renderRisk() {
  const stress = Number($("#stressInput").value);
  const result = calculatePortfolioRisk(stress);
  $("#stressOutput").textContent = stress;
  $("#riskScore").textContent = result.riskScore;
  $("#riskRing").style.setProperty("--risk", result.riskScore);
  $("#var95").textContent = `${result.var95}%`;
  $("#drawdown").textContent = `${result.drawdown}%`;
  $("#riskAction").textContent = result.action;
  updateRangeFill($("#stressInput"));
}
$("#stressInput").addEventListener("input", renderRisk);
renderRisk();

function renderEda() {
  const load = Number($("#loadInput").value);
  const result = evaluateEda(load);
  $("#loadOutput").textContent = `${load}%`;
  $("#edaVoltage").textContent = `${result.voltage} V`;
  $("#edaTemperature").textContent = `${result.temperature} °C`;
  $("#edaMargin").textContent = `${result.margin}%`;
  $("#edaVerdict").textContent = result.verdict;
  $("#edaHeat").style.setProperty("--heat", Math.min(.52, .08 + load / 190));
  $("#edaTag").textContent = result.margin < 35 ? "RISK" : result.margin < 70 ? "REVIEW" : "STABLE";
  $("#edaTag").className = `tag ${result.margin < 35 ? "tag-amber" : "tag-good"}`;
  updateRangeFill($("#loadInput"));
}
$("#loadInput").addEventListener("input", renderEda);
renderEda();

$("#resetDecisions").addEventListener("click", () => {
  $("#promoInput").value = 0;
  $("#priceInput").value = 0;
  $("#capacityInput").value = 330;
  $("#stressInput").value = 35;
  $("#loadInput").value = 62;
  $$("[data-scenario]").forEach((button) => { const selected = button.dataset.scenario === "baseline"; button.classList.toggle("is-active", selected); button.setAttribute("aria-pressed", String(selected)); });
  renderForecast(); renderRisk(); renderEda();
  toast("情境已重設", "需求、投資風險與 EDA 參數已恢復為基準值。");
});

const objectiveInputs = {
  safety: $("#safetyWeight"),
  service: $("#serviceWeight"),
  speed: $("#speedWeight"),
  energy: $("#energyWeight"),
};

function optimizerCoordinates(candidate) {
  const x = 54 + ((candidate.duration - 16) / 32) * 688;
  const y = 260 - (candidate.risk / 40) * 242;
  return { x: Math.max(54, Math.min(742, x)), y: Math.max(18, Math.min(260, y)) };
}

function selectOptimizedCandidate(candidate, result) {
  optimizedCandidate = candidate;
  $$(".pareto-point").forEach((point) => point.classList.toggle("is-selected", point.dataset.candidate === candidate.id));
  $("#optimizerId").textContent = candidate.id;
  $("#optimizerScore").textContent = candidate.score.toFixed(1);
  $("#optimizerDuration").textContent = `${candidate.duration} min`;
  $("#optimizerRisk").textContent = `${candidate.risk}%`;
  $("#optimizerService").textContent = `${candidate.service}%`;
  $("#optimizerEnergy").textContent = `${candidate.energy} kWh`;
  $("#optimizerPace").textContent = `${candidate.pace}%`;
  $("#optimizerInspection").textContent = `${candidate.inspection}%`;
  $("#optimizerBuffer").textContent = `${candidate.buffer} 件`;
  const onFrontier = result.pareto.some((item) => item.id === candidate.id);
  $("#optimizerReason").textContent = onFrontier
    ? "這個方案位於 Pareto 邊界：若想再縮短復原時間，就必須接受更高複發風險；反之亦然。"
    : "這是依照目前四項權重得到的高分方案；你仍可點選邊界上的其他方案比較取捨。";
}

function renderOptimizer() {
  const weights = Object.fromEntries(Object.entries(objectiveInputs).map(([key, input]) => [key, Number(input.value)]));
  Object.entries(objectiveInputs).forEach(([key, input]) => {
    $(`#${key}WeightOutput`).textContent = input.value;
    updateRangeFill(input);
  });
  const result = optimizeRecovery(weights);
  const frontierIds = new Set(result.pareto.map((candidate) => candidate.id));
  $("#paretoPoints").innerHTML = result.candidates.map((candidate) => {
    const { x, y } = optimizerCoordinates(candidate);
    const classes = ["pareto-point", frontierIds.has(candidate.id) ? "is-frontier" : "", candidate.id === result.recommended.id ? "is-recommended" : ""].filter(Boolean).join(" ");
    const interactive = frontierIds.has(candidate.id) || candidate.id === result.recommended.id;
    return `<circle class="${classes}" data-candidate="${candidate.id}" ${interactive ? `tabindex="0" role="button" aria-label="${candidate.id}：${candidate.duration} 分鐘、風險 ${candidate.risk}%"` : "aria-hidden=\"true\""} cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${frontierIds.has(candidate.id) ? 4 : 2.2}" />`;
  }).join("");
  $("#paretoFrontier").setAttribute("d", result.pareto.map((candidate, index) => {
    const { x, y } = optimizerCoordinates(candidate);
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" "));
  const candidateMap = new Map(result.candidates.map((candidate) => [candidate.id, candidate]));
  $$(".pareto-point").forEach((point) => {
    const choose = () => selectOptimizedCandidate(candidateMap.get(point.dataset.candidate), result);
    point.addEventListener("click", choose);
    point.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
  });
  selectOptimizedCandidate(result.recommended, result);
  $("#optimizerStatus").textContent = `${result.evaluated} EVALUATED · ${result.pareto.length} PARETO`;
  return result;
}

Object.values(objectiveInputs).forEach((input) => input.addEventListener("input", renderOptimizer));
$("#runOptimizer").addEventListener("click", async () => {
  const button = $("#runOptimizer");
  button.disabled = true;
  button.textContent = "探索中…";
  $("#optimizerStatus").textContent = "SEARCHING DESIGN SPACE";
  await sleep(520);
  const result = renderOptimizer();
  button.disabled = false;
  button.textContent = "重新探索 240 個方案";
  addAudit("多目標復原探索完成", `${result.evaluated} 個方案 · ${result.pareto.length} 個非支配解`, "cyan");
  toast("取捨邊界已更新", `目前建議 ${result.recommended.id}；可直接點選圖上的方案比較。`);
});
$("#stageOptimizedPlan").addEventListener("click", () => {
  if (!optimizedCandidate) return;
  addAudit("最佳化方案已暫存", `${optimizedCandidate.id} · ${optimizedCandidate.duration} min · risk ${optimizedCandidate.risk}%`, "amber");
  toast("候選方案已暫存，尚未執行", "AI 只建立了可審核的決策物件；馬達復歸與計畫發布仍需指定角色批准。" );
});
renderOptimizer();

function answerQuery(query) {
  const result = evidenceFor(query);
  const chat = $("#chatThread");
  chat.classList.add("has-answer");
  chat.innerHTML = `
    <div class="query-message">${escapeHtml(query)}</div>
    <div class="answer-card">
      <div class="answer-head"><span>VERIFIED RESPONSE</span><b>${result.route} · 信心 ${result.confidence}%</b></div>
      <p>${result.answer}</p>
      <div class="answer-sources">${result.sources.map((source, index) => `<button type="button" data-source="${index}">[${index + 1}] ${source}<span>開啟來源摘要 ↗</span></button>`).join("")}</div>
    </div>`;
  $("#evidenceScore").textContent = result.confidence;
  $("#evidenceGauge").style.setProperty("--score", result.confidence);
  $("#evidenceTag").textContent = result.route === "直接回答" ? "VERIFIED" : "HUMAN REVIEW";
  $("#evidenceTag").className = `tag ${result.route === "直接回答" ? "tag-good" : "tag-amber"}`;
  $("#traceList").innerHTML = `
    <li class="done"><i></i><div><b>權限檢查</b><small>3 ms</small></div></li>
    <li class="done"><i></i><div><b>混合檢索</b><small>18 ms</small></div></li>
    <li class="done"><i></i><div><b>引用驗證</b><small>${result.sources.length} sources</small></div></li>
    <li class="done"><i></i><div><b>${result.route}</b><small>${result.confidence}%</small></div></li>`;
  $$('[data-source]', chat).forEach((button, index) => button.addEventListener("click", () => {
    openDrawer({
      index: `SOURCE / 0${index + 1}`,
      title: result.sources[index],
      lead: "這是離線展示中的合成來源摘要，用來示範引用定位、權限與版本追溯，不代表外部正式規範。",
      metrics: [["ACL", "Granted"], ["版本", "v7.2"], ["雜湊", "7c9a…4d2"]],
      role: result.answer,
      skills: ["來源存在且位於使用者可存取的集合", "答案陳述可回指到這份文件的特定段落", "文件版本與查詢 Trace 皆已保留"],
    });
  }));
  addAudit(`知識查詢：${result.route}`, `${result.sources.length} 份來源 · 信心 ${result.confidence}%`, result.route === "直接回答" ? "good" : "amber");
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

$("#queryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#queryInput");
  const query = input.value.trim();
  if (!query) { toast("請先輸入問題", "系統會從有權限的文件中尋找可驗證答案。"); return; }
  answerQuery(query);
  input.value = "";
});
$$("[data-query]").forEach((button) => button.addEventListener("click", () => answerQuery(button.dataset.query)));

$("#toggleLineage").addEventListener("click", (event) => {
  const rows = $$(".extra-row");
  const isHidden = rows[0].hidden;
  rows.forEach((row) => { row.hidden = !isHidden; });
  event.currentTarget.textContent = isHidden ? "收合" : "顯示全部";
});

$("#runEvaluation").addEventListener("click", async () => {
  const button = $("#runEvaluation");
  const progress = $("#evalProgress");
  button.disabled = true;
  button.textContent = "評測進行中…";
  $("#evalGateTag").textContent = "RUNNING";
  $("#evalGateTag").className = "tag tag-cyan";
  progress.classList.remove("is-running");
  void progress.offsetWidth;
  progress.classList.add("is-running");
  for (const score of [89.4, 91.2, 93.7, 95.1, 95.8]) {
    $("#candidateScore").textContent = score.toFixed(1);
    await sleep(420);
  }
  const result = evaluateCandidate("v8");
  const total = result.total + (goldenCaseAdded ? 1 : 0);
  const passed = result.passed + (goldenCaseAdded ? 1 : 0);
  $("#candidateScore").textContent = result.score;
  $("#evalGateTag").textContent = result.blockingRegressions ? "BLOCKED" : "CANDIDATE READY";
  $("#evalGateTag").className = `tag ${result.blockingRegressions ? "tag-amber" : "tag-good"}`;
  $("#evalLog").innerHTML = `<span class="live-dot"></span><p><b>剛剛完成：</b>${total} 題、5 個 scorer、${result.blockingRegressions} 個阻擋性退步 · <time>${timestamp()}</time></p><small>dataset / august-golden-${goldenCaseAdded ? "v4" : "v3"} · sha 62bc…91a</small>`;
  button.disabled = false;
  button.innerHTML = `重新評測 <span id="evalQuestionCount">${total}</span> 題`;
  addAudit("AI 候選版本評測完成", `${passed}/${total} 通過 · score ${result.score}`, "good");
  toast("評測閘門通過", "policy-v8 未出現阻擋性退步，已可發布。" );
});

$("#promoteCandidate").addEventListener("click", () => {
  if (candidatePromoted) return;
  candidatePromoted = true;
  $("#promoteCandidate").textContent = "v8 已發布";
  $("#promoteCandidate").disabled = true;
  $("#evalGateTag").textContent = "RELEASED";
  addAudit("AI 政策版本 v8 已發布", `golden-set ${goldenCaseAdded ? "25/25" : "24/24"} · zero blocking regression`, "good");
  toast("policy-v8 已發布", "提示詞、評測、資料集與批准紀錄已綁定為不可變版本。" );
});

function graphEdgeGeometry(edge, nodesById) {
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);
  return { source, target, midX: (source.x + target.x) / 2, midY: (source.y + target.y) / 2 };
}

function renderKnowledgeGraph() {
  const result = getRelatedEntities(activeGraphNode, activeGraphFilter);
  const nodesById = new Map(result.nodes.map((node) => [node.id, node]));
  $("#graphEdges").innerHTML = result.edges.map((edge) => {
    const { source, target, midX, midY } = graphEdgeGeometry(edge, nodesById);
    const related = edge.source === result.selected.id || edge.target === result.selected.id;
    return `<g><line class="graph-edge${related ? " is-related" : ""}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"/><text class="graph-edge-label" x="${midX}" y="${midY - 5}">${edge.label}</text></g>`;
  }).join("");
  $("#graphNodes").innerHTML = result.nodes.map((node) => `
    <g class="graph-node${node.id === result.selected.id ? " is-selected" : ""}" data-node-id="${node.id}" data-kind="${node.kind}" tabindex="0" role="button" aria-label="${node.label}，${node.meta}">
      <rect x="${node.x - 42}" y="${node.y - 18}" width="84" height="36" rx="2"/><text x="${node.x}" y="${node.y - 1}">${node.label}</text><text class="node-kind" x="${node.x}" y="${node.y + 10}">${node.kind.toUpperCase()}</text>
    </g>`).join("");
  $("#graphKind").textContent = `${result.selected.kind.toUpperCase()} OBJECT`;
  $("#graphTitle").textContent = result.selected.label;
  $("#graphMeta").textContent = result.selected.meta;
  $("#graphRelations").innerHTML = result.relations.map((relation) => `<button data-related-node="${relation.node.id}"><b>${relation.node.label}</b><i>${relation.direction === "outgoing" ? "→" : "←"} ${relation.label}</i><small>${relation.node.meta}</small></button>`).join("") || "<small>目前篩選下沒有相鄰關係。</small>";
  const selectNode = (id) => { activeGraphNode = id; renderKnowledgeGraph(); };
  $$(".graph-node").forEach((node) => {
    node.addEventListener("click", () => selectNode(node.dataset.nodeId));
    node.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(node.dataset.nodeId); } });
  });
  $$("[data-related-node]").forEach((button) => button.addEventListener("click", () => selectNode(button.dataset.relatedNode)));
}

$$("[data-graph-filter]").forEach((button) => button.addEventListener("click", () => {
  activeGraphFilter = button.dataset.graphFilter;
  $$("[data-graph-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
  renderKnowledgeGraph();
}));
$$("[data-graph-query]").forEach((button) => button.addEventListener("click", () => {
  activeGraphFilter = "all";
  activeGraphNode = button.dataset.graphQuery;
  $$("[data-graph-filter]").forEach((item) => item.classList.toggle("is-active", item.dataset.graphFilter === "all"));
  renderKnowledgeGraph();
  addAudit("營運圖譜關係已查詢", `${button.textContent} · ${activeGraphNode}`, "cyan");
}));
renderKnowledgeGraph();

const autonomyActions = ["inspect_signal", "recommend_plan", "stage_scenario", "restore_motor", "publish_plan"];
function renderAutonomy() {
  const results = autonomyActions.map((action) => evaluateAutonomy(action, autonomyLevel));
  $("#autonomyMatrix").innerHTML = results.map((result) => {
    const className = result.allowed ? "allowed" : result.status === "WAITING_APPROVAL" ? "staged" : "blocked";
    const statusLabel = result.allowed ? "IN SCOPE" : result.status === "WAITING_APPROVAL" ? "NEEDS HUMAN" : "BLOCKED";
    return `<div class="autonomy-row"><span><b>${result.label}</b><small>${result.reason}</small></span><em class="${className}">${statusLabel}</em></div>`;
  }).join("");
  $("#autonomyTag").textContent = autonomyLevel === "execute" ? "HUMAN-GATED" : `${autonomyLevel.toUpperCase()} ONLY`;
  $("#autonomyTag").className = `tag ${autonomyLevel === "execute" ? "tag-amber" : "tag-cyan"}`;
}
$$("[data-autonomy-level]").forEach((button) => button.addEventListener("click", () => {
  autonomyLevel = button.dataset.autonomyLevel;
  $$("[data-autonomy-level]").forEach((item) => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-checked", String(active)); });
  renderAutonomy();
  addAudit("AI 自主權範圍已檢視", `${autonomyLevel.toUpperCase()} · 政策仍要求指定批准`, "amber");
  saveOperationalState();
}));
renderAutonomy();

function downloadArtifact(content, filename, type = "application/octet-stream") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderRelease(manifest = currentReleaseManifest) {
  currentReleaseManifest = manifest;
  const result = verifyReleaseManifest(manifest);
  $("#artifactRows").innerHTML = manifest.artifacts.map((artifact) => `
    <div class="artifact-row">
      <span><i>${artifact.id}</i><b>${artifact.path}</b><small>${artifact.kind}</small></span>
      <code title="${artifact.digest}">${artifact.digest === "PENDING" ? "等待瀏覽器計算" : `${artifact.digest.slice(0, 12)}…${artifact.digest.slice(-8)}`}</code>
    </div>`).join("");
  $("#releaseChecks").innerHTML = result.checks.map((check) => `<div class="release-check ${check.pass ? "is-pass" : ""}"><i>${check.pass ? "✓" : "○"}</i><span><b>${check.label}</b><small>${check.id}</small></span><em>${check.pass ? "PASS" : "WAIT"}</em></div>`).join("");
  $("#releaseCheckSummary").textContent = `${result.passed} / ${result.total} checks`;
  $("#releaseTag").textContent = result.ready ? "VERIFIED RC" : "UNVERIFIED";
  $("#releaseTag").className = `tag ${result.ready ? "tag-good" : "tag-amber"}`;
  $("#releaseVerifyStage").classList.toggle("is-ready", result.passed >= 4);
  $("#releaseReadyStage").classList.toggle("is-ready", result.ready);
  $("#exportRelease").disabled = !result.ready;
}

async function digestAsset(path) {
  const response = await fetch(`./${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await response.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

$("#verifyRelease").addEventListener("click", async () => {
  const button = $("#verifyRelease");
  button.disabled = true;
  button.textContent = "計算 6 個指紋…";
  try {
    if (!globalThis.crypto?.subtle) throw new Error("瀏覽器不支援 Web Crypto");
    const paths = currentReleaseManifest.artifacts.map((artifact) => artifact.path);
    const values = await Promise.all(paths.map((path) => digestAsset(path)));
    const digests = Object.fromEntries(paths.map((path, index) => [path, values[index]]));
    currentReleaseManifest = buildReleaseManifest({ digests, testCount: 22 });
    renderRelease(currentReleaseManifest);
    const result = verifyReleaseManifest(currentReleaseManifest);
    addAudit("發布候選證據已驗證", `${result.passed}/${result.total} checks · 6 SHA-256`, result.ready ? "good" : "amber");
    toast(result.ready ? "發布候選已驗證" : "發布候選仍有缺口", result.ready ? "身份、邊界、測試、核心產物指紋與離線殼層全部通過。" : "請查看發布閘門中仍在等待的項目。" );
  } catch (error) {
    toast("無法完成發布驗證", error.message || "讀取核心檔案失敗。" );
  } finally {
    button.disabled = false;
    button.textContent = "重新驗證發布候選";
  }
});

$("#exportRelease").addEventListener("click", () => {
  downloadArtifact(`${JSON.stringify(currentReleaseManifest, null, 2)}\n`, "2026_8月合輯_RC-2026-08-27.5_發布證據清單.json", "application/json;charset=utf-8");
  addAudit("發布證據清單已匯出", "RC-2026-08-27.5 · JSON", "cyan");
  toast("證據清單已建立", "包含範圍聲明、測試版本、核心產物與瀏覽器實算 SHA-256。" );
});
renderRelease();

$$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  const filter = button.dataset.filter;
  $$("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
  $$(".module-card").forEach((card) => { card.hidden = filter !== "all" && card.dataset.category !== filter; });
}));

function selectCapability(id) {
  const capability = getCapabilityCatalog().find((item) => item.id === id) || getCapabilityCatalog()[0];
  activeCapability = capability.id;
  $$(".catalog-row[data-capability]").forEach((row) => row.classList.toggle("is-selected", row.dataset.capability === activeCapability));
  $("#catalogInspector").innerHTML = `
    <span>SELECTED CAPABILITY / ${capability.domain.toUpperCase()}</span>
    <h4>${capability.id}</h4>
    <b>${capability.module}</b>
    <div><small>OWNER</small><strong>${capability.owner}</strong></div>
    <div><small>CONSUMES</small><p>${capability.consumes}</p></div>
    <div><small>PROVIDES</small><p>${capability.provides}</p></div>
    <div><small>VERIFIABLE PROOF</small><p>${capability.proof}</p></div>
    <div><small>CLAIM BOUNDARY</small><p>${capability.boundary}</p></div>
    <em>${capability.lifecycle}</em>`;
}

function renderCapabilityCatalog(domain = "all") {
  const catalog = getCapabilityCatalog(domain);
  $("#catalogRows").innerHTML = catalog.map((capability) => `
    <button class="catalog-row" role="row" data-capability="${capability.id}">
      <span><i>${capability.id}</i><b>${capability.module}</b></span>
      <span>${capability.owner}</span>
      <span><em>${capability.lifecycle}</em></span>
      <span>${capability.provides}</span>
    </button>`).join("");
  $("#catalogCount").textContent = `${String(catalog.length).padStart(2, "0")} CAPABILITIES`;
  $$(".catalog-row[data-capability]").forEach((row) => row.addEventListener("click", () => selectCapability(row.dataset.capability)));
  selectCapability(catalog.some((item) => item.id === activeCapability) ? activeCapability : catalog[0]?.id);
}

$$('[data-catalog-filter]').forEach((button) => button.addEventListener("click", () => {
  $$('[data-catalog-filter]').forEach((item) => item.classList.toggle("is-active", item === button));
  renderCapabilityCatalog(button.dataset.catalogFilter);
}));
renderCapabilityCatalog();

function openDrawer(data) {
  $("#drawerContent").innerHTML = `
    <p class="drawer-kicker">${data.index}</p>
    <h2 id="drawerTitle">${data.title}</h2>
    <p class="drawer-lead">${data.lead}</p>
    <div class="drawer-metrics">${data.metrics.map(([label, value]) => `<span><small>${label}</small><b>${value}</b></span>`).join("")}</div>
    <div class="drawer-section"><h3>在「2026_8月合輯」裡的角色</h3><p>${data.role}</p></div>
    <div class="drawer-section"><h3>融合的功能與技巧</h3><ul>${data.skills.map((skill) => `<li>${skill}</li>`).join("")}</ul></div>`;
  $("#drawerBackdrop").hidden = false;
  $("#drawer").classList.add("is-open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#closeDrawer").focus();
}

function closeDrawer() {
  $("#drawer").classList.remove("is-open");
  $("#drawer").setAttribute("aria-hidden", "true");
  setTimeout(() => { $("#drawerBackdrop").hidden = true; }, 300);
}

$("#closeDrawer").addEventListener("click", closeDrawer);
$("#drawerBackdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
$$("[data-module]").forEach((button) => button.addEventListener("click", () => openDrawer(moduleData[button.dataset.module])));

$("#openAudit").addEventListener("click", () => {
  $("#drawerContent").innerHTML = `
    <p class="drawer-kicker">IMMUTABLE / LOCAL DEMO</p>
    <h2 id="drawerTitle">稽核紀錄</h2>
    <p class="drawer-lead">所有跨模組事件以同一個 Trace 串聯。畫面使用合成資料，不包含帳號、客戶或真實設備資料。</p>
    <div class="audit-drawer-list">${auditEntries.map(([time, title, detail]) => `<div class="audit-drawer-item"><time>${time}</time><div><b>${title}</b><small>${detail}</small></div></div>`).join("") || "<p class='drawer-lead'>目前畫面沒有事件。</p>"}</div>`;
  $("#drawerBackdrop").hidden = false;
  $("#drawer").classList.add("is-open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#closeDrawer").focus();
});

$("#openAbout").addEventListener("click", () => openDrawer({
  index: "ABOUT / 2026 · AUGUST / V5",
  title: "2026_8月合輯 · 可驗證發行版",
  lead: "八個公司實務型作品組成一套可安裝、可離線、可追溯的工業智慧營運中樞。第五版新增無責事故復盤、能力目錄與瀏覽器實算 SHA-256 的發布證據鏈。",
  metrics: [["模組", "08"], ["測試", "22 PASS"], ["執行", "Offline"]],
  role: "合輯以共同物件、即時訊號與決策 Trace 串起各模組；每次處置能沉澱為交班記憶、黃金案例與具責任人的系統改善行動。",
  skills: ["觀測 → 理解 → 決策 → 治理 → 執行 → 交班 → 學習", "策略／現場／工程三種自適應觀看視角", "可安裝離線應用、無責復盤、能力目錄與發布證據"],
}));

const tourChapters = [
  { view: "overview", kicker: "OBSERVE / 觀測", title: "先看見整條系統，<br />而不是一個孤立指標。", copy: "2026_8月合輯讓八個作品共用同一條 Trace：資料進站、即時感測、視覺品質、模型與營運決策彼此可追溯。", proof: ["8 個模組", "3 種觀看視角", "1 條決策鏈"], next: "下一章：理解事件" },
  { view: "incident", kicker: "UNDERSTAND / 理解", title: "把 24.7 秒的異常，<br />還原成可驗證因果鏈。", copy: "力量、安全狀態、AOI 與排程在同一時間軸重播；假設有信心分數，證據能回到來源與版本。", proof: ["5 個訊號節點", "94% 根因信心", "1 個事件 Trace"], next: "下一章：比較決策" },
  { view: "decisions", kicker: "DECIDE / 決策", title: "答案不是一個點，<br />而是一條取捨邊界。", copy: "系統探索 240 個復原候選，把安全、服務、速度與能源的衝突畫成 Pareto 邊界，再由人選擇願意承擔的取捨。", proof: ["240 個候選", "4 個目標", "可調整權重"], next: "下一章：治理 AI" },
  { view: "evidence", kicker: "GOVERN / 治理", title: "AI 有能力，<br />也必須有清楚邊界。", copy: "專屬代理身分、委派範圍與人工批准共同決定動作是否可執行；知識圖譜則回答每個決策依賴了哪些物件。", proof: ["4 級自主權", "11 個營運物件", "角色批准"], next: "下一章：累積記憶" },
  { view: "incident", kicker: "LEARN / 學習", title: "事件結束之後，<br />系統才真正開始變聰明。", copy: "處置結果會變成交班記憶與無責事故復盤：保留未解風險、系統促成因素、負責人、期限與復發防護指標。", proof: ["1 個交班物件", "3 個改善行動", "第 25 題案例"], next: "下一章：證明版本" },
  { view: "evidence", kicker: "PROVE / 證明", title: "一個版本值得相信，<br />因為它留下可重算的證據。", copy: "發布中心在瀏覽器內讀取六個實際核心檔案、計算 SHA-256，並以身份、資料邊界、測試與離線殼層共同決定候選版本是否可發布。", proof: ["6 個檔案指紋", "22 項測試", "5 道發布閘門"], next: "完成並自由探索" },
];

function renderTourStep() {
  const chapter = tourChapters[activeTourStep];
  showView(chapter.view);
  $("#tourStep").textContent = `CHAPTER ${String(activeTourStep + 1).padStart(2, "0")} / ${String(tourChapters.length).padStart(2, "0")}`;
  $("#tourKicker").textContent = chapter.kicker;
  $("#tourTitle").innerHTML = chapter.title;
  $("#tourCopy").textContent = chapter.copy;
  $("#tourProof").innerHTML = chapter.proof.map((item) => `<span>${item}</span>`).join("");
  $("#tourProgress").style.width = `${((activeTourStep + 1) / tourChapters.length) * 100}%`;
  $("#tourPrev").disabled = activeTourStep === 0;
  $("#tourNext").textContent = chapter.next;
  $$(".tour-rail span").forEach((dot, index) => dot.classList.toggle("is-active", index === activeTourStep));
}

function openTour() {
  activeTourStep = 0;
  $("#tourBackdrop").hidden = false;
  renderTourStep();
  requestAnimationFrame(() => $("#tourNext").focus());
}
function closeTour() { $("#tourBackdrop").hidden = true; }
$("#openTour").addEventListener("click", openTour);
$("#closeTour").addEventListener("click", closeTour);
$("#tourPrev").addEventListener("click", () => { if (activeTourStep > 0) { activeTourStep -= 1; renderTourStep(); } });
$("#tourNext").addEventListener("click", () => {
  if (activeTourStep === tourChapters.length - 1) { closeTour(); toast("導覽完成", "你現在可以自由探索、改權重、查關係或把事件收錄成黃金案例。" ); return; }
  activeTourStep += 1;
  renderTourStep();
});

let commandHighlight = -1;

function visibleCommands() {
  return $$(".command-body button").filter((button) => !button.hidden);
}

function highlightCommand(index) {
  const commands = visibleCommands();
  if (!commands.length) return;
  commandHighlight = (index + commands.length) % commands.length;
  $$(".command-body button").forEach((button) => button.classList.remove("is-highlighted"));
  commands[commandHighlight].classList.add("is-highlighted");
  commands[commandHighlight].scrollIntoView({ block: "nearest" });
}

function openCommandPalette() {
  $("#commandBackdrop").hidden = false;
  $("#commandInput").value = "";
  commandHighlight = -1;
  $$(".command-body button").forEach((button) => { button.hidden = false; button.classList.remove("is-highlighted"); });
  requestAnimationFrame(() => $("#commandInput").focus());
}

function closeCommandPalette() {
  $("#commandBackdrop").hidden = true;
}

$("#openCommand").addEventListener("click", openCommandPalette);
$("#commandBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeCommandPalette(); });
$("#commandInput").addEventListener("input", (event) => {
  const query = event.currentTarget.value.trim().toLowerCase();
  $$(".command-body button").forEach((button) => { button.hidden = query && !button.innerText.toLowerCase().includes(query); });
  commandHighlight = -1;
  $$(".command-body button").forEach((button) => button.classList.remove("is-highlighted"));
});
$$("[data-command-view]").forEach((button) => button.addEventListener("click", () => {
  closeCommandPalette();
  showView(button.dataset.commandView);
}));
$$("[data-command-action]").forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.commandAction;
  closeCommandPalette();
  if (action === "story") { showView("overview"); setTimeout(runStory, 350); }
  if (action === "tour") openTour();
  if (action === "portfolio") exportPortfolioBrief();
  if (action === "brief") { showView("incident"); setTimeout(exportIncidentBrief, 250); }
  if (action === "postmortem") { showView("incident"); setTimeout(() => { generatePostmortem(); $("#postmortemTag").scrollIntoView({ behavior: "smooth", block: "center" }); }, 250); }
  if (action === "release") { showView("evidence"); setTimeout(() => { $("#verifyRelease").click(); $("#releaseTag").scrollIntoView({ behavior: "smooth", block: "center" }); }, 250); }
  if (action === "snapshot-export") exportWorkspaceSnapshot();
  if (action === "snapshot-import") $("#snapshotFile").click();
}));
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommandPalette(); }
  if (!$("#commandBackdrop").hidden && event.key === "ArrowDown") { event.preventDefault(); highlightCommand(commandHighlight + 1); }
  if (!$("#commandBackdrop").hidden && event.key === "ArrowUp") { event.preventDefault(); highlightCommand(commandHighlight <= 0 ? visibleCommands().length - 1 : commandHighlight - 1); }
  if (!$("#commandBackdrop").hidden && event.key === "Enter" && document.activeElement === $("#commandInput")) {
    event.preventDefault();
    const commands = visibleCommands();
    if (commands.length) commands[commandHighlight >= 0 ? commandHighlight : 0].click();
  }
  if (event.key === "Escape" && !$("#commandBackdrop").hidden) closeCommandPalette();
  if (event.key === "Escape" && !$("#tourBackdrop").hidden) closeTour();
  if (event.key === "Escape" && !$("#lensBackdrop").hidden) closeLensDialog();
});

window.addEventListener("resize", () => drawInspection($("#inspectionStage").dataset.sample));

function saveOperationalState() {
  try {
    const tasks = Object.fromEntries($$(".action-row[data-task]").map((row) => [row.dataset.task, row.classList.contains("is-done")]));
    localStorage.setItem("august-operational-state", JSON.stringify({
      schema: "collection.session/v1",
      selectedPlan,
      recoveryApproved,
      goldenCaseAdded,
      autonomyLevel,
      tasks,
    }));
  } catch { /* 裝置儲存不可用時保留目前記憶體狀態 */ }
}

function restoreOperationalState() {
  try {
    const saved = JSON.parse(localStorage.getItem("august-operational-state") || "null");
    if (!saved || saved.schema !== "collection.session/v1") return;
    if (["A", "B", "C"].includes(saved.selectedPlan)) selectRecoveryPlan(saved.selectedPlan);
    const openLabels = { fixture: "進行中", review: "待處理", plan: "待批准" };
    const buttonLabels = { fixture: "完成", review: "開始", plan: "檢視" };
    $$(".action-row[data-task]").forEach((row) => {
      const done = Boolean(saved.tasks?.[row.dataset.task]);
      row.classList.toggle("is-done", done);
      $("mark", row).textContent = done ? "已完成" : openLabels[row.dataset.task];
      const action = $(".task-action", row);
      if (action) action.textContent = done && row.dataset.task !== "plan" ? "復原" : buttonLabels[row.dataset.task];
    });
    recoveryApproved = Boolean(saved.recoveryApproved);
    if (recoveryApproved) {
      const planTask = $('[data-task="plan"]');
      planTask.classList.add("is-done");
      $("mark", planTask).textContent = "已完成";
      $("#incidentStatus").textContent = "方案已批准";
      $("#stageRecovery").textContent = `PLAN ${selectedPlan} 已批准`;
      $("#stageRecovery").disabled = true;
    }
    goldenCaseAdded = Boolean(saved.goldenCaseAdded);
    if (goldenCaseAdded) {
      $("#captureGoldenCase").disabled = true;
      $("#captureGoldenCase").textContent = "已收錄為第 25 題黃金案例 ✓";
      $("#evalQuestionCount").textContent = "25";
      if (!$(".learned-golden-case")) {
        const caseRow = document.createElement("div");
        caseRow.className = "learned-golden-case";
        caseRow.innerHTML = "<span><i>OPS</i>力量突波 + AOI 邊界的復歸規則</span><em>NEW</em><em>PASS</em>";
        $(".golden-cases").append(caseRow);
      }
    }
    if (["observe", "recommend", "stage", "execute"].includes(saved.autonomyLevel)) autonomyLevel = saved.autonomyLevel;
    $$("[data-autonomy-level]").forEach((button) => {
      const active = button.dataset.autonomyLevel === autonomyLevel;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
    });
    renderAutonomy();
    syncPostmortemIfOpen();
  } catch { /* 忽略舊版或不完整的裝置狀態 */ }
}

function exportWorkspaceSnapshot() {
  const tasks = Object.fromEntries($$(".action-row[data-task]").map((row) => [row.dataset.task, row.classList.contains("is-done")]));
  const snapshot = buildWorkspaceSnapshot({ selectedPlan, recoveryApproved, goldenCaseAdded, autonomyLevel, lens: activeLens, tasks });
  downloadArtifact(`${JSON.stringify(snapshot, null, 2)}\n`, "2026_8月合輯_工作台快照.json", "application/json;charset=utf-8");
  addAudit("工作台快照已匯出", `Plan ${snapshot.selectedPlan} · ${snapshot.autonomyLevel.toUpperCase()} · ${snapshot.lens}`, "cyan");
  toast("工作台快照已建立", "方案、批准、任務、黃金案例、觀看視角與 AI 自主權範圍都已封裝。" );
}

function applyWorkspaceSnapshot(snapshot) {
  const result = validateWorkspaceSnapshot(snapshot);
  if (!result.valid) throw new Error(`快照驗證失敗：${result.errors.join(" / ")}`);
  localStorage.setItem("august-operational-state", JSON.stringify(snapshot));
  localStorage.setItem("2026-august-view-lens", snapshot.lens);
  activeLens = snapshot.lens;
  pendingLens = snapshot.lens;
  renderLens();
  restoreOperationalState();
  addAudit("工作台快照已恢復", `Plan ${snapshot.selectedPlan} · ${snapshot.autonomyLevel.toUpperCase()} · ${snapshot.lens}`, "good");
  toast("工作台狀態已恢復", "方案、任務、黃金案例與治理範圍已安全套用到本機展示。" );
}

$("#snapshotFile").addEventListener("change", async (event) => {
  const [file] = event.currentTarget.files;
  if (!file) return;
  try {
    applyWorkspaceSnapshot(JSON.parse(await file.text()));
  } catch (error) {
    toast("無法匯入工作台快照", error.message || "JSON 格式無效。" );
  } finally {
    event.currentTarget.value = "";
  }
});

restoreOperationalState();

function updateNetworkStatus() {
  const offline = !navigator.onLine;
  $("#networkStatus").textContent = offline ? "OFFLINE" : "ONLINE";
  $("#networkStatus").closest(".install-state").classList.toggle("is-offline", offline);
}
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
updateNetworkStatus();

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("#installApp").disabled = false;
  $("#pwaStatus").textContent = "可安裝 · 離線核心已就緒";
});
$("#installApp").addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  addAudit("應用安裝提示已完成", choice.outcome === "accepted" ? "使用者接受安裝" : "使用者保留瀏覽器模式", choice.outcome === "accepted" ? "good" : "amber");
  installPrompt = null;
  $("#installApp").disabled = true;
});
window.addEventListener("appinstalled", () => {
  $("#pwaStatus").textContent = "已安裝 · 離線核心可用";
  toast("2026_8月合輯已安裝", "現在可以從系統應用程式清單獨立開啟。" );
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      document.documentElement.dataset.offlineReady = "true";
      if ($("#pwaStatus") && !installPrompt) $("#pwaStatus").textContent = "離線核心已就緒 · 瀏覽器管理安裝資格";
    } catch {
      document.documentElement.dataset.offlineReady = "false";
      if ($("#pwaStatus")) $("#pwaStatus").textContent = "目前僅線上模式";
    }
  });
}
