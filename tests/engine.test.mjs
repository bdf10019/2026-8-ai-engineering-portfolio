import test from "node:test";
import assert from "node:assert/strict";
import {
  buildForecast,
  buildIncidentBrief,
  buildPortfolioBrief,
  buildPostmortem,
  buildPostmortemMarkdown,
  buildReleaseManifest,
  buildShiftHandoff,
  buildWorkspaceSnapshot,
  calculatePortfolioRisk,
  evaluateAutonomy,
  evaluateEda,
  evaluateCandidate,
  evaluateSafety,
  evidenceFor,
  getRelatedEntities,
  getCapabilityCatalog,
  getRecoveryPlan,
  inspectSample,
  optimizeRecovery,
  verifyReleaseManifest,
  validateWorkspaceSnapshot,
} from "../engine.js";

test("促銷情境提高需求且受產能上限約束", () => {
  const baseline = buildForecast();
  const scenario = buildForecast({ promo: 20, capacity: 230 });
  assert.ok(scenario.total > baseline.total * 0.9);
  assert.ok(scenario.constrainedDays > 0);
  assert.ok(Math.max(...scenario.forecast) <= 230);
});

test("安全狀態機對力量超限與心跳遺失採安全停機", () => {
  assert.equal(evaluateSafety({ force: 43 }).state, "SAFE_STOP");
  assert.equal(evaluateSafety({ heartbeat: false }).motor, false);
  assert.equal(evaluateSafety({ force: 30 }).state, "DEGRADED");
  assert.equal(evaluateSafety({ force: 12 }).state, "NORMAL");
});

test("AOI 範例具有可重現判定", () => {
  assert.equal(inspectSample("normal").verdict, "OK");
  assert.equal(inspectSample("contamination").verdict, "NG");
});

test("決策模型輸出保持在合理範圍", () => {
  assert.ok(calculatePortfolioRisk(90).riskScore > calculatePortfolioRisk(10).riskScore);
  assert.ok(evaluateEda(95).margin < evaluateEda(40).margin);
});

test("RAG 未命中時明確轉人工", () => {
  assert.equal(evidenceFor("完全不相關的問題").route, "轉人工審核");
  assert.ok(evidenceFor("安全停機條件").sources.length >= 2);
});

test("復原方案具有一致的營運影響與事件摘要", () => {
  const plan = getRecoveryPlan("B");
  assert.equal(plan.duration, 18);
  assert.equal(plan.risk, "LOW");
  const brief = buildIncidentBrief("B", "人工批准測試");
  assert.match(brief, /Plan B/);
  assert.match(brief, /人工批准測試/);
  assert.match(brief, /08:26:40\.118/);
});

test("未知復原方案安全回退且候選評測無阻擋退步", () => {
  assert.equal(getRecoveryPlan("UNKNOWN").id, "B");
  assert.equal(evaluateCandidate("v8").blockingRegressions, 0);
  assert.equal(evaluateCandidate("v7").total, 24);
});

test("多目標最佳化固定探索 240 個候選並回傳 Pareto 邊界", () => {
  const result = optimizeRecovery({ safety: 40, service: 30, speed: 20, energy: 10 });
  assert.equal(result.evaluated, 240);
  assert.equal(result.candidates.length, 240);
  assert.ok(result.pareto.length > 1);
  assert.ok(result.candidates.some((candidate) => candidate.id === result.recommended.id));
  assert.equal(optimizeRecovery({ safety: 40, service: 30, speed: 20, energy: 10 }).recommended.id, result.recommended.id);
});

test("營運知識圖譜可從決策追到證據與下游任務", () => {
  const graph = getRelatedEntities("decision");
  const relatedIds = graph.relations.map((relation) => relation.node.id);
  assert.ok(relatedIds.includes("trace"));
  assert.ok(relatedIds.includes("sop"));
  assert.ok(relatedIds.includes("task"));
});

test("AI 自主權不把執行層級誤當成人工批准", () => {
  assert.equal(evaluateAutonomy("stage_scenario", "stage").allowed, true);
  assert.equal(evaluateAutonomy("restore_motor", "stage").status, "OUT_OF_SCOPE");
  assert.equal(evaluateAutonomy("restore_motor", "execute").status, "WAITING_APPROVAL");
  assert.equal(evaluateAutonomy("restore_motor", "execute", ["safety_owner", "shift_lead"]).allowed, true);
});

test("交班記憶明確保留未解風險、負責人與學到的規則", () => {
  const handoff = buildShiftHandoff({ plan: "B", completedTasks: 2, approved: true });
  assert.match(handoff.summary, /Plan B/);
  assert.match(handoff.progress, /2\/3/);
  assert.match(handoff.nextOwner, /品質工程/);
  assert.match(handoff.learnedRule, /不得直接全線復歸/);
});

test("作品說明書使用新品牌並依觀看視角調整展示路徑", () => {
  const strategy = buildPortfolioBrief("strategy");
  const operations = buildPortfolioBrief("operations");
  assert.match(strategy, /2026_8月合輯/);
  assert.match(strategy, /Surface AOI Inspector/);
  assert.match(strategy, /決策實驗室/);
  assert.match(operations, /交班記憶/);
  assert.notEqual(strategy, operations);
});

test("无责复盘会随批准与行动状态从草稿进入待审", () => {
  const draft = buildPostmortem({ plan: "B", completedTasks: 1, approved: false });
  const ready = buildPostmortem({ plan: "B", completedTasks: 3, approved: true });
  assert.equal(draft.status, "DRAFT");
  assert.equal(ready.status, "READY FOR REVIEW");
  assert.equal(ready.actions.filter((action) => action.status === "DONE").length, 3);
  assert.match(ready.summary, /不歸因於個人/);
});

test("复盘文件保留影响、系统因素、行动与成功指标", () => {
  const markdown = buildPostmortemMarkdown({ plan: "C", completedTasks: 2, approved: true });
  assert.match(markdown, /系統促成因素/);
  assert.match(markdown, /ACT-03/);
  assert.match(markdown, /證據完整率/);
  assert.match(markdown, /合成資料/);
});

test("发布闸门要求六个核心产物都有真实格式的 SHA-256", () => {
  const pending = buildReleaseManifest();
  assert.equal(verifyReleaseManifest(pending).ready, false);
  const digests = Object.fromEntries(pending.artifacts.map((artifact, index) => [artifact.path, String(index).padStart(64, "a").slice(-64)]));
  const verified = buildReleaseManifest({ digests, testCount: 22 });
  const result = verifyReleaseManifest(verified);
  assert.equal(result.ready, true);
  assert.equal(result.passed, result.total);
});

test("能力目录保留八个组件并可依领域筛选责任边界", () => {
  assert.equal(getCapabilityCatalog().length, 8);
  assert.equal(getCapabilityCatalog("governance").length, 2);
  assert.ok(getCapabilityCatalog("physical").every((capability) => capability.owner && capability.provides && capability.consumes && capability.proof && capability.boundary));
});

test("工作台快照会正规化方案、任务与治理状态", () => {
  const snapshot = buildWorkspaceSnapshot({ selectedPlan: "C", recoveryApproved: true, goldenCaseAdded: true, autonomyLevel: "execute", lens: "engineering", tasks: { fixture: true, review: false } });
  assert.equal(snapshot.selectedPlan, "C");
  assert.equal(snapshot.tasks.plan, true);
  assert.equal(snapshot.tasks.review, false);
  assert.equal(snapshot.lens, "engineering");
  assert.equal(validateWorkspaceSnapshot(snapshot).valid, true);
});

test("工作台快照拒绝错误身份与越界权限", () => {
  const snapshot = buildWorkspaceSnapshot();
  const invalid = { ...snapshot, name: "其他作品", autonomyLevel: "root" };
  const result = validateWorkspaceSnapshot(invalid);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["IDENTITY", "AUTONOMY"]);
});
