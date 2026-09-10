# 2026_8月合輯 v5｜外部標竿與設計取捨

本文件記錄第二至第五版的公開資料研究。目的是學習成熟產品的工作流模式，不複製品牌、介面或專有實作。

## 12. W3C Web App Manifest

- 来源：[Web Application Manifest](https://www.w3.org/TR/appmanifest/)、[Manifest App Information](https://www.w3.org/TR/manifest-app-info/)
- 观察：可安装 Web 应用需要以标准化 JSON 描述名称、起始网址、显示模式、范围、图标与应用信息；安装身份不能只靠浏览器分页标题。
- 采用：加入 `manifest.webmanifest`、专属 192／512 图标、应用名称与主题色，并以 Service Worker 缓存核心壳层。
- 边界：是否显示安装提示仍由浏览器与操作系统决定；作品不绕过平台安装政策，也不把离线缓存描述成后台资料同步。

## 13. Google SRE Postmortem Culture

- 来源：[Postmortem Culture: Learning from Failure](https://sre.google/workbook/postmortem-culture/)、[Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- 观察：高质量复盘应保留事件影响、缓解、根因与后续行动，并以无责文化把注意力放在系统条件；行动项目需要正式负责人，才会形成问责与学习。
- 采用：事故中心新增无责复盘对象，记录系统促成因素、有效防护、负责人、期限、证据与复发防护指标，并可汇出 Markdown。
- 边界：这是合成事件的复盘工作流示范，不替代真实组织的值班、事故分级、法务或人事流程。

## 14. SLSA Provenance

- 来源：[SLSA Specification v1.2](https://slsa.dev/spec/v1.2/)
- 观察：发布产物的可信度需要来源、构建与验证信息；provenance 与验证摘要可以让下游判断拿到的产物是否符合预期。
- 采用：发布证据中心对实际载入的六个核心档案计算 SHA-256，结合身份、合成资料边界、测试数量与离线壳层形成五项发布闸门，并可下载 JSON 清单。
- 边界：这是受 SLSA 启发的本机作品证据视图，不宣称达到任何 SLSA build level、认证或供应链合规。

## 15. Backstage Software Catalog

- 来源：[Backstage Software Catalog](https://backstage.io/docs/software-catalog/generated-index/)
- 观察：软件目录通过实体、关系、生命周期与所有权回答“系统里有什么、谁负责、彼此如何连接”；它是维护入口，不只是作品清单。
- 采用：为八个模块建立可筛选能力目录，明确 owner、lifecycle、consumes 与 provides，并提供单项责任边界检查器。
- 边界：目录完全在本地页面内，不使用 Backstage descriptor、组织目录、插件或外部登记服务。

## 6. AWS IoT TwinMaker Knowledge Graph

- 來源：[Knowledge graph for digital twins](https://docs.aws.amazon.com/iot-twinmaker/latest/guide/tm-knowledge-graph.html)、[What is AWS IoT TwinMaker?](https://docs.aws.amazon.com/iot-twinmaker/latest/guide/what-is-twinmaker.html)
- 觀察：數位分身的實用價值不只來自場景，還來自 entity、component 與 relationship；異質資料必須能沿資產與上下文關係查詢。
- 採用：加入 LINE 03、RB-02、VI-03、批次、Trace、配方、政策、SOP、決策、任務與交班記憶的互動圖譜。
- 邊界：圖譜是確定性合成物件，不連接 AWS、真實 IoT 時序庫或公司主資料。

## 7. Microsoft Fabric Operations Agents

- 來源：[Operations agents](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent)
- 觀察：營運代理應有獨立身分、受委派的授權範圍與可檢查規則；高影響動作可在收件人批准後才執行。
- 採用：加入觀測、建議、暫存、執行四級自主權，以及馬達復歸與計畫發布的指定角色批准。
- 邊界：本機作品只模擬政策判定和批准狀態，不會控制真實設備或對外發送動作。

## 8. NIST AI Risk Management Framework

- 來源：[AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)、[AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)、[Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- 觀察：AI 風險需要跨 Govern、Map、Measure、Manage 持續處理；人機監督的角色、責任、驗證、文件與說明不能只存在於口號。
- 採用：把 AI 權限與每個動作的最低層級、缺少的批准、原因、評測資料集和稽核 Trace 放在同一畫面。
- 邊界：這是設計原則示範，不宣稱完成 NIST 合規、風險認證或正式稽核。

## 9. Multi-objective decision design

- 觀察：復原策略通常同時牽涉安全、服務水準、速度與能源，單一總分容易掩蓋代價；Pareto 邊界能保留非支配方案，讓決策者看見「想改善一項，必須犧牲什麼」。
- 採用：用可重現參數網格探索 240 個候選，視覺化復原時間／複發風險邊界，再以可調權重指出目前建議。
- 邊界：候選與分數均為作品用合成模型，不是處方性生產最佳化器；真正上線仍需設備限制、歷史資料與安全驗證。

## 10. Adaptive portfolio narrative

- 觀察：同一套工程成果面对决策者、现场人员与工程评审时，需要回答不同问题；若所有人看到完全相同的首页，重要证据会被功能数量淹没。
- 採用：加入策略、现场、工程三种观看视角，只重排首页主张、成果重点与推荐路径，不改变底层数字或证据。
- 邊界：观看视角不是权限系统，也不会隐藏负面结果；它只改善沟通顺序。

## 11. Outcome ledger and portable brief

- 觀察：作品集若只展示功能，很难快速证明完整性。成果应该能直接回到产生它的 Trace、模型、评测或决策物件，并能带离互动页面继续阅读。
- 採用：新增四项成果证据账本，以及依当前观看视角生成的完整 Markdown 作品说明书。
- 邊界：成果数字来自作品内的确定性案例，不代表真实公司上线后的商业成效。

## 1. NVIDIA Omniverse Digital Twins

- 來源：[Digital Twins Overview](https://docs.omniverse.nvidia.com/digital-twins/latest/overview.html)
- 觀察：活的數位分身需要與現場資料同步，並讓 AI 能在共同場域模型上運作；工業設施參考架構也把幾何、模擬資料與即時營運資料分成互補層。
- 採用：加入 LINE 03 場域圖、設備物件、工件流、健康／流量／能耗圖層與設備上下文。
- 邊界：本作品使用 2D 可重現示意，不宣稱物理精準 3D、OpenUSD 或真實工廠同步。

## 2. Palantir Foundry Ontology / Operational Apps

- 來源：[Ontology overview](https://www.palantir.com/docs/foundry/ontology/overview)、[Operational applications](https://www.palantir.com/docs/foundry/app-building/operational-apps)
- 觀察：成熟營運系統不只展示資料，還要表示物件、關係與受治理的動作；一筆決策必須能寫回共同狀態並留下 action log。
- 採用：新增 A／B／C 復原方案、決策理由、批准條件、決策物件、任務狀態與稽核回寫。
- 邊界：所有動作只更新本機展示狀態，不呼叫外部 ERP、MES 或通知服務。

## 3. Tulip Frontline Operations

- 來源：[Frontline Operations Platform](https://tulip.co/platform/)
- 觀察：Apps、Agents、Automations 與 Analytics 應共用相同營運資料模型；指標應能回到產生它的事件，且前線使用者需要可組合的任務介面。
- 採用：新增前線任務收件匣，以及設備、批次、訊號、證據與任務的同一 Trace 關聯。
- 邊界：作品不是低程式碼建置器，也沒有多站點部署與合規認證。

## 4. Grafana Investigations / Correlations

- 來源：[Assistant Investigations](https://grafana.com/docs/grafana-cloud/platform/grafana-assistant/platform/investigation/)、[Data source correlations](https://grafana.com/docs/grafana/latest/datasources/)
- 觀察：複雜事件需要在同一時間範圍內關聯 metrics、logs、traces 等不同訊號，逐步建立假設、證據與結構化報告。
- 採用：新增事件重播、三層訊號關聯圖、根因候選與信心，以及可下載事件摘要。
- 邊界：圖表使用確定性合成資料，不是 Grafana、OpenTelemetry 或真實時序後端。

## 5. MLflow GenAI Evaluation

- 來源：[Evaluating production traces](https://www.mlflow.org/docs/latest/genai/eval-monitor/running-evaluation/traces/)、[Evaluation datasets](https://mlflow.org/docs/latest/genai/datasets/)
- 觀察：正式 AI 變更需要用固定資料集與相同 scorer 比較版本，並把生產 Trace 中的問題納入黃金題集，阻止品質退步。
- 採用：新增 24 題黃金題集、v7／v8 指標比較、阻擋性退步閘門與版本發布動作。
- 邊界：評測結果為作品用的確定性案例，不代表對任何真實模型做過 MLflow 評測。

## 共同設計原則

1. 從 Dashboard 走向 Decision Loop：每個洞察都要能連到一個受治理的下一步。
2. 每個數字都有上下文：設備、時間、批次、模型、文件、任務與決策共用 Trace。
3. AI 提供假設與證據，人保留批准權。
4. 模擬與真實能力清楚分界，不用漂亮畫面暗示不存在的生產整合。
5. 預設離線、零 API 成本、可重現、無私人資料。
6. 一次事件要能留下可接手的交班記憶，並轉成下一版評測資料，形成真正的學習閉環。
