export const baseForecast = [184, 191, 188, 203, 211, 207, 219, 228, 224, 236, 242, 239, 251, 258];

export function buildForecast({ promo = 0, price = 0, capacity = 330 } = {}) {
  const uncapped = baseForecast.map((value, index) => {
    const weekdayPulse = [0.98, 1.01, 1.03, 1, 1.05, 0.97, 0.96][index % 7];
    const multiplier = 1 + (promo / 100) * 0.62 - (price / 100) * 0.38;
    return Math.round(value * weekdayPulse * multiplier);
  });
  const forecast = uncapped.map((value) => Math.min(value, capacity));
  const constrainedDays = uncapped.filter((value) => value > capacity).length;
  const total = forecast.reduce((sum, value) => sum + value, 0);
  const baselineTotal = baseForecast.reduce((sum, value) => sum + value, 0);
  return {
    forecast,
    lower: forecast.map((value) => Math.round(value * 0.88)),
    upper: forecast.map((value) => Math.round(value * 1.12)),
    total,
    delta: Math.round(((total - baselineTotal) / baselineTotal) * 1000) / 10,
    constrainedDays,
  };
}

export function inspectSample(sample = "micro-crack") {
  const results = {
    normal: { verdict: "OK", defects: 0, area: 0, confidence: 98.7, latency: 8.4, reason: "表面紋理位於允收帶內" },
    "micro-crack": { verdict: "REVIEW", defects: 2, area: 1.84, confidence: 91.6, latency: 9.8, reason: "AI 與規則在邊界區域出現分歧" },
    contamination: { verdict: "NG", defects: 4, area: 6.32, confidence: 97.1, latency: 9.2, reason: "瑕疵面積超過配方上限 4.00 mm²" },
  };
  return results[sample] || results["micro-crack"];
}

export function evaluateSafety({ force = 14, heartbeat = true, deadline = 0 } = {}) {
  if (!heartbeat || force >= 42) {
    return { state: "SAFE_STOP", motor: false, pwm: 0, reason: !heartbeat ? "心跳逾時" : "力量瞬間超限" };
  }
  if (force >= 28 || deadline >= 3) {
    return { state: "DEGRADED", motor: true, pwm: 35, reason: force >= 28 ? "負載接近上限" : "連續時限未達標" };
  }
  return { state: "NORMAL", motor: true, pwm: 100, reason: "所有訊號均在安全範圍" };
}

export function calculatePortfolioRisk(stress = 35) {
  const bounded = Math.max(0, Math.min(100, Number(stress)));
  return {
    var95: (2.1 + bounded * 0.031).toFixed(2),
    drawdown: (4.8 + bounded * 0.096).toFixed(1),
    riskScore: Math.round(31 + bounded * 0.57),
    action: bounded > 68 ? "降低股票曝險並提高現金緩衝" : bounded > 42 ? "縮短再平衡週期" : "維持配置，持續監測漂移",
  };
}

export function evaluateEda(load = 62) {
  const bounded = Math.max(20, Math.min(100, Number(load)));
  const voltage = 1.02 - Math.max(0, bounded - 50) * 0.0016;
  const temperature = 43 + bounded * 0.34;
  const margin = Math.max(0, 100 - Math.max(0, bounded - 58) * 2.1);
  return {
    voltage: voltage.toFixed(3),
    temperature: temperature.toFixed(1),
    margin: Math.round(margin),
    verdict: margin < 35 ? "需重新佈局" : margin < 70 ? "建議複核" : "設計穩定",
  };
}

export function evidenceFor(query = "") {
  const normalized = query.trim();
  const isCalibration = /校正|量測|尺度/.test(normalized);
  const isStop = /停機|安全|力量|心跳/.test(normalized);
  if (isCalibration) {
    return {
      answer: "量產前必須使用實際鏡頭、工作距離與標定板重新完成兩點尺度校正；展示配方中的 12.5 μm/px 只能作為起始值，不能視為量測認證。",
      confidence: 96,
      sources: ["AOI 生產導入規範 §2.1", "尺度校正紀錄 CAL-0826"],
      route: "直接回答",
    };
  }
  if (isStop) {
    return {
      answer: "力量值達 42 N 或心跳逾時會在同一控制週期進入 SAFE_STOP，馬達使能關閉、PWM 上限歸零，並把原因與 CRC 驗證結果寫入稽核軌跡。",
      confidence: 94,
      sources: ["RTSafe 安全狀態機 §4.2", "遙測協定 v1.0 §3"],
      route: "直接回答",
    };
  }
  return {
    answer: "目前證據不足以對這個問題做出可靠結論。系統已保留查詢內容與檢索結果，並轉交工程審核，避免把推測當成正式答案。",
    confidence: 42,
    sources: ["文件治理政策 §5.3"],
    route: "轉人工審核",
  };
}

export const incidentSteps = [
  { module: "EDGE", title: "力量訊號突升", detail: "42.8 N · sequence 08421", tone: "alert" },
  { module: "SAFE", title: "同週期安全停機", detail: "motor off · PWM 0%", tone: "alert" },
  { module: "AOI", title: "工件觸發複檢", detail: "2 個邊界缺陷 · 1.84 mm²", tone: "review" },
  { module: "RAG", title: "SOP 證據已核對", detail: "2 份來源 · 信心 94%", tone: "good" },
  { module: "PLAN", title: "排程情境已重算", detail: "交期風險 +1.8%", tone: "good" },
];

export const incidentFrames = [
  { time: "08:26:40.118", type: "OBSERVATION", title: "力量值在 3 ms 內由 28.4 N 升至 42.8 N", detail: "同一序號的 IMU 與編碼器資料保持有效，可排除整體通訊中斷。", state: "NORMAL" },
  { time: "08:26:40.121", type: "PROTECTION", title: "安全狀態機在同一控制週期進入 SAFE_STOP", detail: "馬達使能已關閉、PWM 上限歸零，CRC 與序號連續性驗證通過。", state: "SAFE_STOP" },
  { time: "08:26:42.806", type: "CORRELATION", title: "同一工件出現 2 個 AOI 邊界缺陷", detail: "AI 信心 91.6%，規則與模型判定分歧；瑕疵面積為 1.84 mm²。", state: "REVIEW" },
  { time: "08:26:51.284", type: "EVIDENCE", title: "兩份安全與校正文件支持隔離後復歸", detail: "引用白名單、ACL 與文件版本皆通過，證據信心為 94%。", state: "VERIFIED" },
  { time: "08:27:04.882", type: "DECISION", title: "停機復原情境使交期風險增加 1.8%", detail: "Plan B 在風險、復原時間與待複檢數量之間取得最佳平衡。", state: "READY" },
];

export const recoveryPlans = {
  A: { name: "立即全線復歸", delay: "+0.6%", risk: "HIGH", review: 2, duration: 6 },
  B: { name: "校正治具後降速復歸", delay: "+1.8%", risk: "LOW", review: 12, duration: 18 },
  C: { name: "隔離批次並全面複檢", delay: "+4.9%", risk: "VERY LOW", review: 46, duration: 46 },
};

export function getRecoveryPlan(plan = "B") {
  return { id: plan in recoveryPlans ? plan : "B", ...(recoveryPlans[plan] || recoveryPlans.B) };
}

export function buildIncidentBrief(plan = "B", reason = "") {
  const selected = getRecoveryPlan(plan);
  return [
    "# 2026_8月合輯｜事件摘要 INC-0826-0421",
    "",
    "- 事件：力量突波造成品質邊界事件",
    "- 場域：LINE 03",
    "- 根因信心：94%",
    "- Trace：AUG-0826-0421",
    "",
    "## 已選復原方案",
    "",
    `Plan ${selected.id} — ${selected.name}`,
    `預估復原：${selected.duration} 分鐘；交期影響：${selected.delay}；複發風險：${selected.risk}；待複檢：${selected.review} 件。`,
    "",
    "## 決策理由",
    "",
    reason.trim() || "已核對安全狀態、AOI 邊界樣本與 SOP；採用風險與交期平衡方案。",
    "",
    "## 證據鏈",
    "",
    ...incidentFrames.map((frame, index) => `${index + 1}. ${frame.time} — ${frame.title}`),
    "",
    "> 本摘要使用確定性合成資料產生，僅供作品展示。",
  ].join("\n");
}

export function buildPortfolioBrief(lens = "strategy") {
  const narratives = {
    strategy: "從八個作品看見一套可降低停機、品質、交期與 AI 風險的完整營運能力。",
    operations: "從異常發現、即時防護、跨訊號調查，到前線任務與交班記憶，形成可接手的處置流程。",
    engineering: "從資料契約、1 kHz 控制、視覺量測到模型評測，每個數字都能回到版本、測試與驗證邊界。",
  };
  const modules = [
    ["Surface AOI Inspector", "像素級瑕疵、尺度換算與融合判定"],
    ["RTSafe Sensor Hub", "1 kHz 感測、安全狀態機與故障降級"],
    ["Demand Planning Workbench", "回測選模、預測區間與情境規劃"],
    ["KnowledgeOps Studio", "模型路由、PromptOps、權限與評測"],
    ["SimOps Studio", "PCB／PDN／SPICE 模擬與設計驗證"],
    ["OpenFund Risk Workbench", "金融風險評分、壓力測試與監控"],
    ["OpsFlow Agent", "有引用、可拒答、可人工接手的知識工作流"],
    ["Retail Data Hub", "資料契約、ETL、品質閘門與血緣"],
  ];
  const resolvedLens = lens in narratives ? lens : "strategy";
  return [
    "# 2026_8月合輯｜作品說明書",
    "",
    `> ${narratives[resolvedLens]}`,
    "",
    "## 核心主張",
    "",
    "八種工程能力，不是八個孤島；它們共同組成「觀測 → 理解 → 決策 → 治理 → 執行 → 交班 → 學習」的可信決策鏈。",
    "",
    "## 可驗證成果",
    "",
    "- 營運韌性：24.7 秒跨訊號事件窗口，可重播並回到同一筆 Trace。",
    "- 品質可解釋：AOI 測試準確率 97.1%，保留規則、模型、尺度與人工複核邊界。",
    "- 決策空間：探索 240 個復原候選，並以 Pareto 邊界呈現取捨。",
    "- 學習閉環：24 題基準評測可吸收事件規則，擴充為第 25 題黃金案例。",
    "- AI 治理：四級自主權、專屬代理身分與不可繞過的角色批准。",
    "",
    "## 八個整合模組",
    "",
    ...modules.map(([name, role], index) => `${index + 1}. **${name}** — ${role}`),
    "",
    "## v5 系統學習與責任閉環",
    "",
    "- 交班記憶保留未解風險、任務進度、下一位負責人和可重用判斷規則。",
    "- 無責事故復盤記錄影響、偵測、緩解、系統促成因素、有效防護和復發防護指標。",
    "- 每個改善行動都有 owner、due date 和 evidence，而不是停留在會議結論。",
    "- 八項能力目錄分別聲明 lifecycle、consumes、provides 與維護責任。",
    "",
    "## v5 發布與可攜帶性",
    "",
    "- Web App Manifest、專屬圖示與 Service Worker 讓作品可安裝並保留離線核心殼層。",
    "- 發布中心在瀏覽器內讀取六個實際核心檔案並計算 SHA-256。",
    "- 五道發布閘門檢查作品身份、合成資料邊界、22 項測試、內容指紋與離線能力。",
    "- 這是本地、受 SLSA 啟發的證據展示，不宣稱認證、簽章或供應鏈合規等級。",
    "",
    "## 推薦展示路徑",
    "",
    resolvedLens === "operations"
      ? "營運總覽 → 場域分身 → 事件中心 → 交班記憶"
      : resolvedLens === "engineering"
        ? "作品圖譜 → 場域分身 → 證據中樞 → AI 自主權控制"
        : "營運總覽 → 事件中心 → 決策實驗室 → 證據中樞",
    "",
    "## 作品邊界",
    "",
    "本作品使用確定性合成資料，預設離線、零外部 API 成本，不宣稱連接真實公司系統、設備或生產資料。",
  ].join("\n");
}

export function evaluateCandidate(version = "v8") {
  if (version !== "v8") return { score: 92.1, passed: 21, total: 24, blockingRegressions: 1 };
  return { score: 95.8, passed: 24, total: 24, blockingRegressions: 0 };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function optimizeRecovery(weights = {}) {
  const resolvedWeights = {
    service: Number(weights.service ?? 34),
    safety: Number(weights.safety ?? 36),
    speed: Number(weights.speed ?? 20),
    energy: Number(weights.energy ?? 10),
  };
  const weightTotal = Object.values(resolvedWeights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  const candidates = [];
  let index = 0;

  for (const pace of [55, 60, 65, 70, 75, 80, 85, 90, 95, 100]) {
    for (const inspection of [20, 35, 50, 65, 80, 95]) {
      for (const buffer of [4, 8, 12, 16]) {
        index += 1;
        const duration = Math.round(33 - (pace - 55) * 0.38 + inspection * 0.08 + buffer * 0.25);
        const risk = clamp(Math.round(31 - inspection * 0.25 + (pace - 55) * 0.31 - buffer * 0.55), 2, 39);
        const service = clamp(Math.round(91 - duration * 0.24 + pace * 0.12 - inspection * 0.045), 66, 98);
        const energy = Math.round(48 + pace * 0.34 + inspection * 0.055 - buffer * 0.22);
        const scores = {
          service,
          safety: clamp(100 - risk * 2.15, 0, 100),
          speed: clamp(108 - duration * 2.05, 0, 100),
          energy: clamp(100 - (energy - 60) * 2.7, 0, 100),
        };
        const score = Object.entries(scores).reduce(
          (sum, [key, value]) => sum + value * (Math.max(0, resolvedWeights[key]) / weightTotal),
          0,
        );
        candidates.push({
          id: `R-${String(index).padStart(3, "0")}`,
          pace,
          inspection,
          buffer,
          duration,
          risk,
          service,
          energy,
          score: Math.round(score * 10) / 10,
        });
      }
    }
  }

  const pareto = candidates.filter((candidate) => !candidates.some((other) => (
    other.id !== candidate.id
    && other.duration <= candidate.duration
    && other.risk <= candidate.risk
    && (other.duration < candidate.duration || other.risk < candidate.risk)
  ))).sort((left, right) => left.duration - right.duration || left.risk - right.risk);

  const recommended = [...candidates].sort((left, right) => right.score - left.score || left.risk - right.risk)[0];
  return { evaluated: candidates.length, weights: resolvedWeights, candidates, pareto, recommended };
}

export const operationalGraph = {
  nodes: [
    { id: "line03", label: "LINE 03", kind: "asset", x: 82, y: 155, meta: "生產場域 · health 93%" },
    { id: "rb02", label: "RB-02", kind: "asset", x: 220, y: 82, meta: "取放機械臂 · 1 kHz" },
    { id: "vi03", label: "VI-03", kind: "asset", x: 220, y: 230, meta: "視覺檢測站 · 9.8 ms" },
    { id: "lot", label: "LOT-A0826", kind: "data", x: 390, y: 44, meta: "批次 · 12 件待複檢" },
    { id: "trace", label: "TRACE-0421", kind: "data", x: 390, y: 155, meta: "跨訊號事件 · 24.7 s" },
    { id: "recipe", label: "RECIPE-v4", kind: "model", x: 390, y: 266, meta: "配方 · hash 4f8a…c21" },
    { id: "policy", label: "POLICY-v8", kind: "model", x: 560, y: 78, meta: "AI 政策 · score 95.8" },
    { id: "sop", label: "SOP-v7.2", kind: "data", x: 560, y: 232, meta: "作業規範 · ACL granted" },
    { id: "decision", label: "DECISION-B", kind: "decision", x: 716, y: 155, meta: "復原方案 · 人工批准" },
    { id: "task", label: "TASK-018", kind: "decision", x: 850, y: 88, meta: "治具校正 · 設備工程" },
    { id: "handoff", label: "MEMORY-09", kind: "decision", x: 850, y: 230, meta: "交班記憶 · 下一班" },
  ],
  edges: [
    { source: "line03", target: "rb02", label: "contains" },
    { source: "line03", target: "vi03", label: "contains" },
    { source: "rb02", target: "trace", label: "emitted" },
    { source: "vi03", target: "trace", label: "observed" },
    { source: "lot", target: "trace", label: "affected" },
    { source: "recipe", target: "vi03", label: "configures" },
    { source: "policy", target: "decision", label: "recommended" },
    { source: "sop", target: "decision", label: "supports" },
    { source: "trace", target: "decision", label: "evidence for" },
    { source: "decision", target: "task", label: "created" },
    { source: "decision", target: "handoff", label: "recorded in" },
    { source: "task", target: "handoff", label: "status in" },
  ],
};

export function getRelatedEntities(nodeId = "decision", kind = "all") {
  const selected = operationalGraph.nodes.find((node) => node.id === nodeId) || operationalGraph.nodes.find((node) => node.id === "decision");
  const visibleNodes = operationalGraph.nodes.filter((node) => kind === "all" || node.kind === kind || node.id === selected.id);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const edges = operationalGraph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const relations = operationalGraph.edges
    .filter((edge) => edge.source === selected.id || edge.target === selected.id)
    .map((edge) => {
      const direction = edge.source === selected.id ? "outgoing" : "incoming";
      const relatedId = direction === "outgoing" ? edge.target : edge.source;
      return { ...edge, direction, node: operationalGraph.nodes.find((item) => item.id === relatedId) };
    });
  return { selected, nodes: visibleNodes, edges, relations };
}

const autonomyLevels = { observe: 0, recommend: 1, stage: 2, execute: 3 };
const governedActions = {
  inspect_signal: { label: "讀取跨訊號狀態", minimum: "observe", approvals: [] },
  recommend_plan: { label: "提出復原建議", minimum: "recommend", approvals: [] },
  stage_scenario: { label: "暫存排程情境", minimum: "stage", approvals: [] },
  restore_motor: { label: "復歸馬達使能", minimum: "execute", approvals: ["safety_owner", "shift_lead"] },
  publish_plan: { label: "發布生產計畫", minimum: "execute", approvals: ["planner"] },
};

export function evaluateAutonomy(action = "recommend_plan", level = "stage", approvals = []) {
  const rule = governedActions[action] || governedActions.recommend_plan;
  const resolvedLevel = level in autonomyLevels ? level : "stage";
  if (autonomyLevels[resolvedLevel] < autonomyLevels[rule.minimum]) {
    return { action, label: rule.label, allowed: false, status: "OUT_OF_SCOPE", reason: `需要 ${rule.minimum.toUpperCase()} 權限；目前僅為 ${resolvedLevel.toUpperCase()}` };
  }
  const missing = rule.approvals.filter((approval) => !approvals.includes(approval));
  if (missing.length) {
    return { action, label: rule.label, allowed: false, status: "WAITING_APPROVAL", reason: `仍需人工批准：${missing.join(" + ")}`, missing };
  }
  return { action, label: rule.label, allowed: true, status: resolvedLevel === "execute" ? "EXECUTABLE" : "IN_SCOPE", reason: "符合委派範圍與政策條件" };
}

export function buildShiftHandoff({ plan = "B", completedTasks = 0, approved = false } = {}) {
  const selected = getRecoveryPlan(plan);
  return {
    id: "MEMORY-0827-09",
    summary: `LINE 03 因進料偏移觸發力量突波與 AOI 邊界事件；採 Plan ${selected.id}「${selected.name}」，目前 ${approved ? "已批准" : "等待批准"}。`,
    openRisk: approved ? "復歸後前 30 件仍需監測力量 P95 與瑕疵面積" : "未取得復原批准，不得重新使能馬達",
    progress: `${completedTasks}/3 個前線任務完成`,
    nextOwner: approved ? "品質工程 · Lin / 09:00 前複核" : "值班主管 · Chen / 立即批准或退回",
    learnedRule: "若力量 ≥ 42 N 且同序號 AOI 為 REVIEW，先隔離批次，再校正治具；不得直接全線復歸。",
  };
}

export function buildPostmortem({ plan = "B", completedTasks = 0, approved = false } = {}) {
  const selected = getRecoveryPlan(plan);
  const boundedTasks = Math.max(0, Math.min(3, Number(completedTasks) || 0));
  const ready = approved && boundedTasks === 3;
  return {
    id: "POST-0827-01",
    incidentId: "INC-0826-0421",
    traceId: "AUG-0826-0421",
    status: ready ? "READY FOR REVIEW" : "DRAFT",
    posture: "BLAMELESS / SYSTEM LEARNING",
    summary: `LINE 03 的治具定位漂移引發力量突波，安全狀態機及時停機；團隊採用 Plan ${selected.id}「${selected.name}」復原。復盤聚焦系統條件與防護能力，不歸因於個人。`,
    impact: {
      duration: `${selected.duration} 分鐘預計復原`,
      quality: `${selected.review} 件進入複檢邊界`,
      delivery: `${selected.delay} 交期影響`,
    },
    detection: "力量訊號在 3 ms 內跨越 42 N，安全狀態機於同一控制週期進入 SAFE_STOP；2.7 秒後 AOI 關聯出同序號邊界缺陷。",
    mitigation: approved
      ? `Plan ${selected.id} 已由人工批准，復原條件、回滾規則與前 30 件加嚴監測均已記錄。`
      : `Plan ${selected.id} 尚待人工批准；系統保持馬達禁能，不自動擴大 AI 權限。`,
    contributingFactors: [
      "治具定位漂移尚未納入每班首件的自動閾值檢查。",
      "力量訊號與 AOI 邊界結果原先分屬兩個操作畫面，關聯判斷依賴人工切換。",
      "復原程序已有安全條件，但尚未把『前 30 件加嚴監測』設為強制完成證據。",
    ],
    whatWorked: [
      "1 kHz 安全狀態機在同一控制週期切斷馬達使能。",
      "Trace 保留力量、序號、AOI、SOP 與決策的共同時間軸。",
      "高風險的立即全線復歸沒有被系統自動執行。",
    ],
    actions: [
      { id: "ACT-01", title: "將治具偏移檢查加入每班首件閘門", owner: "設備工程 · Chen", due: "2026-08-28 09:00", evidence: "FIXTURE-GATE-v2", status: boundedTasks >= 1 ? "DONE" : "OPEN" },
      { id: "ACT-02", title: "完成 12 件邊界樣本人工複核", owner: "品質工程 · Lin", due: "2026-08-27 09:00", evidence: "REVIEW-LOT-A0826", status: boundedTasks >= 2 ? "DONE" : "OPEN" },
      { id: "ACT-03", title: "把復歸規則納入第 25 題黃金案例", owner: "AI 治理 · Wu", due: "2026-08-29 17:00", evidence: "august-golden-v4", status: boundedTasks === 3 ? "DONE" : "OPEN" },
    ],
    successMetric: "連續 10 個班次無同類力量 + AOI 聯合告警；復歸後前 30 件的證據完整率必須為 100%。",
  };
}

export function buildPostmortemMarkdown(input = {}) {
  const postmortem = buildPostmortem(input);
  return [
    `# 2026_8月合輯｜無責事故復盤 ${postmortem.id}`,
    "",
    `- 事件：${postmortem.incidentId}`,
    `- Trace：${postmortem.traceId}`,
    `- 狀態：${postmortem.status}`,
    `- 原則：${postmortem.posture}`,
    "",
    "## 摘要",
    "",
    postmortem.summary,
    "",
    "## 影響",
    "",
    `- 復原：${postmortem.impact.duration}`,
    `- 品質：${postmortem.impact.quality}`,
    `- 交期：${postmortem.impact.delivery}`,
    "",
    "## 偵測與緩解",
    "",
    postmortem.detection,
    "",
    postmortem.mitigation,
    "",
    "## 系統促成因素",
    "",
    ...postmortem.contributingFactors.map((item) => `- ${item}`),
    "",
    "## 有效防護",
    "",
    ...postmortem.whatWorked.map((item) => `- ${item}`),
    "",
    "## 後續行動",
    "",
    ...postmortem.actions.map((action) => `- [${action.status === "DONE" ? "x" : " "}] ${action.id}｜${action.title}｜${action.owner}｜${action.due}｜證據：${action.evidence}`),
    "",
    "## 成功指標",
    "",
    postmortem.successMetric,
    "",
    "> 本復盤使用確定性合成資料；內容聚焦系統學習，不用於評價個人績效。",
  ].join("\n");
}

const releaseArtifacts = [
  { id: "APP", path: "index.html", kind: "experience" },
  { id: "STYLE", path: "styles.css", kind: "interface" },
  { id: "UI", path: "app.js", kind: "interaction" },
  { id: "ENGINE", path: "engine.js", kind: "decision-logic" },
  { id: "MANIFEST", path: "manifest.webmanifest", kind: "app-identity" },
  { id: "OFFLINE", path: "sw.js", kind: "resilience" },
];

export function buildReleaseManifest({ digests = {}, testCount = 22 } = {}) {
  const artifacts = releaseArtifacts.map((artifact) => ({
    ...artifact,
    digest: digests[artifact.path] || "PENDING",
  }));
  return {
    schema: "collection.release/v1",
    releaseId: "RC-2026-08-27.5",
    name: "2026_8月合輯",
    version: "5.0.0",
    scope: "LOCAL DETERMINISTIC DEMO",
    claim: "SLSA-inspired provenance view; not a SLSA compliance claim",
    source: { workspace: "2026_8月合輯", revision: "local-workspace", syntheticData: true },
    build: { runtime: "zero-dependency static web app", networkRequired: false },
    verification: { tests: testCount, policy: "POLICY-v8", dataset: "august-golden-v4" },
    artifacts,
  };
}

export function verifyReleaseManifest(manifest = {}) {
  const checks = [
    { id: "IDENTITY", label: "作品身份固定", pass: manifest.name === "2026_8月合輯" && /^5\./.test(manifest.version || "") },
    { id: "SCOPE", label: "合成資料邊界已聲明", pass: manifest.source?.syntheticData === true && /LOCAL/.test(manifest.scope || "") },
    { id: "TEST", label: "確定性測試已通過", pass: Number(manifest.verification?.tests) >= 22 },
    { id: "PROVENANCE", label: "核心產物具 SHA-256 指紋", pass: Array.isArray(manifest.artifacts) && manifest.artifacts.length >= 6 && manifest.artifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.digest || "")) },
    { id: "OFFLINE", label: "離線殼層納入發布", pass: manifest.artifacts?.some((artifact) => artifact.path === "sw.js") === true },
  ];
  return {
    ready: checks.every((check) => check.pass),
    passed: checks.filter((check) => check.pass).length,
    total: checks.length,
    checks,
  };
}

export const capabilityCatalog = [
  { id: "CAP-01", module: "Surface AOI Inspector", domain: "physical", owner: "品質智慧", lifecycle: "PROVEN", provides: "缺陷判定與量測證據", consumes: "工件影像、配方、尺度校正", proof: "97.11% 測試準確率 · 9.85 ms 中位推論", boundary: "量產前仍須用實際鏡頭、工作距離與標定板重新校正。" },
  { id: "CAP-02", module: "RTSafe Sensor Hub", domain: "physical", owner: "邊緣安全", lifecycle: "PROVEN", provides: "1 kHz 安全狀態與遙測", consumes: "力量、IMU、編碼器、心跳", proof: "1 ms 控制週期 · 4 / 4 主機測試", boundary: "展示不連接真實馬達或 PLC；硬體時限仍需目標板驗證。" },
  { id: "CAP-03", module: "Demand Planning Workbench", domain: "intelligence", owner: "營運規劃", lifecycle: "VALIDATED", provides: "需求區間與版本化情境", consumes: "歷史需求、促銷、產能", proof: "14 日區間 · rolling backtest · 產能約束", boundary: "預測使用確定性樣本，不代表真實商品或客戶需求。" },
  { id: "CAP-04", module: "KnowledgeOps Studio", domain: "governance", owner: "AI 平台", lifecycle: "VALIDATED", provides: "模型路由、權限與評測閘門", consumes: "提示詞、模型、ACL、題集", proof: "22 項作品測試 · POLICY-v8 · 0 阻擋退步", boundary: "本機不呼叫外部模型，也不宣稱正式 AI 風險認證。" },
  { id: "CAP-05", module: "SimOps Studio", domain: "physical", owner: "設計驗證", lifecycle: "PROTOTYPE", provides: "PDN 餘裕與風險摘要", consumes: "PCB、負載、模擬器", proof: "負載、電壓、溫度與餘裕的可重現情境", boundary: "不是簽核級 SI／PI 分析；仍需實際板檔、模型與工具鏈。" },
  { id: "CAP-06", module: "OpenFund Risk Workbench", domain: "intelligence", owner: "風險工程", lifecycle: "PROTOTYPE", provides: "VaR、回撤與漂移訊號", consumes: "公開市場資料、特徵快照", proof: "VaR、最大回撤與壓力強度的單調測試", boundary: "僅供風險工程展示，不構成投資建議或實盤績效。" },
  { id: "CAP-07", module: "OpsFlow Agent", domain: "governance", owner: "知識營運", lifecycle: "VALIDATED", provides: "有引用的答案與人工分流", consumes: "SOP、Trace、文件權限", proof: "引用白名單 · 未命中拒答 · 四級自主權", boundary: "文件與回答皆為合成內容，不替代現場 SOP 或專業判斷。" },
  { id: "CAP-08", module: "Retail Data Hub", domain: "foundation", owner: "資料平台", lifecycle: "PROVEN", provides: "資料契約、品質與血緣", consumes: "CSV、JSON、資料庫來源", proof: "8 個來源 · 0 阻擋項目 · SHA-256 稽核", boundary: "展示未連接公司主資料、雲端倉儲或真實個人資料。" },
];

export function getCapabilityCatalog(domain = "all") {
  return capabilityCatalog.filter((capability) => domain === "all" || capability.domain === domain);
}

export function buildWorkspaceSnapshot({
  selectedPlan = "B",
  recoveryApproved = false,
  goldenCaseAdded = false,
  autonomyLevel = "stage",
  lens = "strategy",
  tasks = {},
} = {}) {
  const resolvedPlan = ["A", "B", "C"].includes(selectedPlan) ? selectedPlan : "B";
  const resolvedAutonomy = ["observe", "recommend", "stage", "execute"].includes(autonomyLevel) ? autonomyLevel : "stage";
  const resolvedLens = ["strategy", "operations", "engineering"].includes(lens) ? lens : "strategy";
  return {
    schema: "collection.session/v1",
    name: "2026_8月合輯",
    version: "5.0.0",
    selectedPlan: resolvedPlan,
    recoveryApproved: Boolean(recoveryApproved),
    goldenCaseAdded: Boolean(goldenCaseAdded),
    autonomyLevel: resolvedAutonomy,
    lens: resolvedLens,
    tasks: {
      fixture: Boolean(tasks.fixture),
      review: Boolean(tasks.review),
      plan: Boolean(tasks.plan || recoveryApproved),
    },
  };
}

export function validateWorkspaceSnapshot(snapshot = {}) {
  const errors = [];
  if (snapshot.schema !== "collection.session/v1") errors.push("SCHEMA");
  if (snapshot.name !== "2026_8月合輯") errors.push("IDENTITY");
  if (!["A", "B", "C"].includes(snapshot.selectedPlan)) errors.push("PLAN");
  if (!["observe", "recommend", "stage", "execute"].includes(snapshot.autonomyLevel)) errors.push("AUTONOMY");
  if (!["strategy", "operations", "engineering"].includes(snapshot.lens)) errors.push("LENS");
  if (!snapshot.tasks || ["fixture", "review", "plan"].some((key) => typeof snapshot.tasks[key] !== "boolean")) errors.push("TASKS");
  return { valid: errors.length === 0, errors };
}
