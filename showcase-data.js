export const projects = [
{id:"aoi",name:"Surface AOI Inspector",subtitle:"視覺檢測",kind:"原專案實測",copy:"表面瑕疵檢測、AI 與規則融合、檢測框與人工複核，將判斷留在影像上。",flow:["影像","ONNX 推論","規則融合","人工複核"],facts:[["測試集","KSDD2 官方測試影像 1,004 張"],["桌面整合","97.11% 準確率；84.55% 瑕疵召回"],["效能邊界","9.85 ms 為 AI v1 ONNX 本機 CPU 中位純推論，與桌面整合準確率分屬不同報告。"]],boundary:"需要依量產光源、鏡頭與產品重新校正；不把展示掃描圖冒充原始測試影像。",source:"aoi-integration.md",view:"line"},
{id:"safe",name:"RTSafe Sensor Hub",subtitle:"即時安全",kind:"主機測試／硬體待驗證",copy:"以 1 kHz 控制週期串起感測、狀態機、心跳與安全停機，故障必須能被追蹤與復歸。",flow:["感測訊號","狀態判斷","安全輸出","遙測"],facts:[["設計週期","1 ms / 1 kHz"],["測試邊界","主機邏輯測試與目標板實時驗證分開"],["互動","工作台提供力量突波與心跳遺失的合成故障注入"]],boundary:"不宣稱已完成目標板硬體時限、安全認證或設備驗收。",source:"safe.md",view:"line"},
{id:"data",name:"Retail Data Hub",subtitle:"SQL / ETL",kind:"展示資料",copy:"資料由来源進入契約與品質閘門，輸出標準化資料，保留血緣與稽核紀錄。",flow:["來源表","資料契約","品質閘門","血緣輸出"],facts:[["合輯來源","8 個展示來源"],["追溯","來源、處理批次、資料品質與 SHA-256 稽核"],["責任","資料進入模型前先被驗證"]],boundary:"未連接公司主資料；本頁流程為視覺摘要。",source:"data.md",view:"evidence"},
{id:"knowledge",name:"KnowledgeOps Studio",subtitle:"模型治理",kind:"本機治理示範",copy:"多模型 Gateway 與 PromptOps 將版本、題集、評分及退步閘門放在同一條發布流程。",flow:["版本","題集評測","退步檢查","治理發布"],facts:[["合輯题集","24 題黃金案例，交班學習可追加第 25 題"],["治理","版本比較、政策與角色批准"],["行為","發布前檢查退步，而非只看平均分數"]],boundary:"合輯使用確定性示範，不代表外部模型服務實測。",source:"knowledge.md",view:"evidence"},
{id:"rag",name:"OpsFlow Agent",subtitle:"引用與工作流",kind:"合成文件與回答",copy:"以引用白名單、資訊不足拒答與人工分流，限制代理的行動範圍，讓每個回答能追到文件。",flow:["問題","檢索與引用","政策檢查","回答／接手"],facts:[["引用","回答片段連到可辨識的文件來源"],["邊界","未命中來源時拒答"],["自主權","觀測、建議、暫存、執行四級"]],boundary:"展示內容是合成文件；不宣稱連接企業知識庫。",source:"rag.md",view:"evidence"},
{id:"planning",name:"Demand Planning Workbench",subtitle:"情境預測",kind:"確定性展示情境",copy:"將歷史、預測區間、rolling backtest 與產能約束組合，提供基準、促銷與停機復原的比較。",flow:["歷史資料","回測","14 日區間","產能決策"],facts:[["視窗","14 日預測區間"],["情境","基準、促銷、停機復原"],["本頁圖表","需求指數為敘事用合成數值，非原專案實測"]],boundary:"不保證實際需求，也不將示意區間當成經校準的置信區間。",source:"planning.md",view:"decisions"},
{id:"risk",name:"OpenFund Risk Workbench",subtitle:"風險分析",kind:"工程展示",copy:"將 VaR、最大回撤與壓力強度轉為可閱讀的風險視圖，用來暴露情境中的不確定性。",flow:["行情資料","因子分析","風險量測","壓力比較"],facts:[["分析","VaR、回撤、壓力情境"],["本頁狀態","低／中／高為合成敘事標示"],["展示","工作台可調整金融壓力情境"]],boundary:"此處展示工程方法，不提供即時行情或投資建議。",source:"risk.md",view:"decisions"},
{id:"eda",name:"SimOps Studio",subtitle:"工程模擬",kind:"原型",copy:"PCB、PDN 與 SPICE 的工程流程，把負載、電壓、溫度與餘裕放入可重現的設計情境。",flow:["設計參數","負載與電路","模擬分析","餘裕檢查"],facts:[["情境","負載、電壓、溫度與工程餘裕"],["本頁表達","以板層與路徑表達模擬能力"],["用途","理解設計取捨與重現流程"]],boundary:"原型而非簽核級分析；熱區示意不是實際電磁或熱仿真結果。",source:"eda.md",view:"decisions"},
{id:"forge",name:"ModelForge-TW",subtitle:"微調與量化",kind:"本機真實推論／合成事件",copy:"繁中設備事件適配、量化與推論發布平台，以封存評測集比較品質、延遲與發布門檻。",flow:["QLoRA v5","量化","224 筆評測","Registry"],facts:[["NF4","Event F1 86.24%；平均延遲 8.333 s；released"],["Q8_0","Event F1 85.16%；平均延遲 1.060 s；retired / previous-good"],["Q4_K_M","Event F1 74.43%；平均延遲 0.825 s；blocked"]],boundary:"NF4 與 llama.cpp 是跨引擎描述性比較。Q8→Q4 的七項契約一致才可作相對品質 gate；合成事件成績不等同真实工廠表現。",source:"forge-evaluation.md",view:null}
];
export const models={
nf4:{title:"品質基準通過。",quality:86.24,latency:"8.333",status:"RELEASED",size:"NF4：無對應 GGUF 檔案",reason:"QLoRA v5 通過完整品質與安全門檻，保留為正式發布版本。NF4 與 llama.cpp 使用不同生成契約，僅作描述性比較。",layers:6},
q8:{title:"更低延遲，保留回滾選項。",quality:85.16,latency:"1.060",status:"PREVIOUS-GOOD",size:"GGUF 1.834 GB",reason:"Q8 通過絕對門檻，受控回滾後為 retired，並保留為 previous-good。Severity F1 85.34%，低於 NF4 的 95.35%，因此保留較保守的 NF4 正式發布。",layers:4},
q4:{title:"更快，但未通過品質門檻。",quality:74.43,latency:"0.825",status:"BLOCKED",size:"GGUF 1.107 GB",reason:"Q4 相對 Q8 的 Event F1 下降 10.73 個百分點，超過 1.5 點相對上限，也未達 85% 絕對門檻。速度提升不足以支持發布。",layers:2}
};
const byId=Object.fromEntries(projects.map(p=>[p.id,p]));
export const evidence={
aoi:byId.aoi,safe:byId.safe,lineage:byId.data,knowledge:byId.knowledge,citation:byId.rag,planning:byId.planning,risk:byId.risk,eda:byId.eda,
training:{name:"訓練不是黑盒：QLoRA v5",kind:"原始訓練紀錄",copy:"所有模型操作鎖定同一個 Qwen3-1.7B revision，資料、設定與 adapter 分別保留指紋。",facts:[["訓練時間","1,467.509 秒"],["Base revision","70d244cc86ccca08cf5af4e1e306ecf908b1ad5e"],["Adapter SHA-256","07ce2d7ee13a1f8a9cdd3f3c4509caa99e349c502a14449157601cb77ab61a6b"]],boundary:"本頁不重新訓練、不下載權重；展示的是原始專案封存結果。",source:"forge-evidence.md"},
quantization:{name:"壓縮之後，保留了什麼？",kind:"量化產物實測",copy:"同一合併權重轉為不同精度，檔案大小與品質分開判讀。GB 使用十進位 10⁹ bytes。",facts:[["F16","3,447,349,024 bytes / 3.447 GB"],["Q8_0","1,834,426,144 bytes / 1.834 GB"],["Q4_K_M","1,107,408,672 bytes / 1.107 GB"],["工具","llama.cpp b10665，量化報告記錄 artifact SHA-256"]],boundary:"F16 GGUF 是量化來源，不是 Transformers NF4 的檔案大小。",source:"forge-evidence.md"},
release:{name:"發布，是一個可檢查的決定。",kind:"policy-v2 正式評測",copy:"品質、格式、安全與證據必須共同通過。Q4 在資料、gate、prompt、tokens、結構化輸出、安全政策與評分契約一致時，仍明確退步。",facts:[["Event / severity F1","兩者絕對門檻均 ≥ 85%"],["相對退步","Q4 相對 Q8，Event / severity F1 各不超過 1.5 個百分點"],["高風險召回","門檻 ≥ 98%；三版本實測均 100%"],["證據精度","門檻 100%，與必要欄位、注入抵抗一同檢查"]],boundary:"安全政策修正後的通過不能冒充模型原始能力；不降低門檻來發布。",source:"forge-evaluation.md"},
external:{name:"外部高分，也可能不能發布。",kind:"第三方合成外部校準",copy:"UCI AI4I 校準揭露跨來源缺口。專用 v5 在首次 98 筆 holdout 得到 98/98 系統通過，回到內部卻嚴重退步，因此不發布。",facts:[["內部 Event F1","v5 僅 69.72%"],["安全層介入","16.33% holdout 案例"],["原始證據精度","84.85%，不得把系統通過當成原始模型精度"],["Registry","保持原狀；外部版本 v5、v6 不發布"]],boundary:"來源為第三方合成 AI4I；row-disjoint holdout 不是工廠泛化或設備安全認證。",source:"forge-external.md"},
registry:{name:"版本的去留，都有紀錄。",kind:"本機 Registry 狀態",copy:"模型登錄保存通過、封鎖、提升與回滾，將模型身分和發布理由放在同一條證據鏈。",facts:[["Released","qwen3-1.7b-qlora-v5-policy-v2"],["Previous-good","qwen3-1.7b-gguf-q8-v5-policy-v2（retired）"],["Blocked","qwen3-1.7b-gguf-q4-v5-policy-v2"]],boundary:"既有 1.0 歷史登錄不冒充新版前向 hash chain；本機驗證不代表正式叢集部署。",source:"forge-evidence.md"},
boundary:{name:"這份合輯的適用邊界。",kind:"資料性質與限制",copy:"每項成果依照它的來源呈現；模組立體造型與動態圖是能力示意，數據只有連回原始報告才稱為實測。",facts:[["實測","AOI 的官方測試集結果；ModelForge 的本機真實推論"],["合成","合輯事件、決策、風險、知識回答與需求曲線"],["待驗證","目標板即時時限、真實公司主資料、企業服務與量產條件"],["原型","EDA 非簽核級分析，3D 核心是原創視覺抽象"]],boundary:"完整工作台和原 PDF 保留既有八模組成果；新增的 ModelForge 與九模組敘事在本展示頁交付。",source:"collection-readme.md"}
};
export const flows={
data:{index:2,tag:"DEMO DATA",title:"Retail Data Hub",copy:byId.data.copy,input:"來源表、批次識別、驗證規則",output:"品質結果、標準化資料、血緣與稽核摘要",evidence:"lineage"},
knowledge:{index:3,tag:"GOVERNED MODEL",title:"KnowledgeOps Studio",copy:byId.knowledge.copy,input:"模型版本、Prompt、黃金題集",output:"評分、退步檢查、政策與發布狀態",evidence:"knowledge"},
rag:{index:4,tag:"CITATION REQUIRED",title:"OpsFlow Agent",copy:byId.rag.copy,input:"問題、文件片段、引用白名單",output:"附引用的回答，或拒答／人工接手",evidence:"citation"}
};
export const scenarios={
base:{title:"穩定供需，保留餘裕。",demand:"100",risk:"低",eda:"充足",line:[76,73,78,69,72,68],copy:"需求維持基準，產能保留彈性；風險與 EDA 負載採穩定情境。曲線是敘事示意，不是即時預測。"},
promo:{title:"需求上升，重新檢查產能。",demand:"128",risk:"中",eda:"縮小",line:[76,55,41,30,23,19],copy:"促銷情境提高合成需求指數，同步提高負載與壓力等級。決策重點轉向產能、風險和工程餘裕。"},
recovery:{title:"先穩定，再逐步恢復。",demand:"86",risk:"高",eda:"恢復中",line:[76,121,116,97,79,70],copy:"停機初期可交付能力下降，再隨復原逐步回升；需求指數與壓力標示用於比較合成情境，並非工廠測量。"}
};
