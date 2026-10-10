export const TOUR_ORDER = Object.freeze(["aoi","safe","retail","knowledge","ops","planning","risk","simops","forge"]);
export const TOUR_RATES = Object.freeze([1,1.5,2,2.5]);
export const TOUR_TIMING = Object.freeze({
  curtain:3000, arrival:500, explain:600, focus:550, observe:1150,
  transitionLead:500, transition:12000, collection:9000, typing:52, lineShift:310, lineHold:350
});
const step=(value,title,body,tone)=>Object.freeze({value,title,body,tone});
const scene=(id,name,attribute,steps)=>Object.freeze({id,name,attribute,steps:Object.freeze(steps)});
// Event first; body is the result spoken only after the scenario is selected.
export const TOUR_SCRIPT=Object.freeze([
  scene("aoi","視覺檢測","data-aoi",[
    step("normal","放入一塊表面完整的鋼板","掃描未發現缺陷，判定為正常品","normal"),
    step("scratch","下一塊鋼板出現一道明顯刮痕","缺陷位置已標出，這塊鋼板不合格","warning"),
    step("review","換成一塊刮痕不易判定的鋼板","保留影像，交由人員複核","review")
  ]),
  scene("safe","即時安全","data-safe",[
    step("normal","啟動機械臂，開始搬運工件","力量與心跳訊號穩定，持續運轉","normal"),
    step("force","搬運時，力量突然超過安全條件","機械臂停止，保留力量超限原因","warning"),
    step("heartbeat","接著模擬控制心跳中斷","系統維持安全停止，等待確認","review")
  ]),
  scene("retail","資料對帳","data-retail",[
    step("normal","送入十一筆資料，進行整理與對帳","兩端金額一致，合格資料可以發布","normal"),
    step("mismatch","其中一筆資料的金額突然不符","比對失敗，暫停發布並保留差額","warning"),
    step("rerun","將同一批資料再次送入","本次新增零筆，沒有重複入帳","review")
  ]),
  scene("knowledge","知識治理","data-knowledge",[
    step("cited","員工詢問設備異常該如何通報","找到作業文件，回答附上引用來源","normal"),
    step("insufficient","下一個問題找不到足夠資料","證據不足，轉交人工處理","warning"),
    step("denied","使用者嘗試查詢未授權文件","權限檢查拒絕存取，不讀取內容","review")
  ]),
  scene("ops","事件調查","data-ops",[
    step("normal","一則設備告警進站，開始查找證據","資料齊全，交付附來源的調查摘要","normal"),
    step("critical","事件突然升為高風險","保留調查結果，等待人員接手","warning"),
    step("timeout","查詢工具連續失敗，嘗試次數用盡","停止重試，保留失敗紀錄","review")
  ]),
  scene("planning","需求規劃","data-planning",[
    step("baseline","載入七日需求資料作為基準","基準總量七百件，逐日比較數量","normal"),
    step("upside","模擬需求上升百分之二十五","七日總量提高到八百七十五件","warning"),
    step("downside","再模擬需求下降百分之二十","七日總量降到五百六十件","review")
  ]),
  scene("risk","風險觀測","data-risk",[
    step("equal","載入四個發行人的完整持倉","各占百分之二十五，分布均勻","normal"),
    step("concentrated","單一持倉突然升到百分之七十","超過示意門檻，提示集中情況","warning"),
    step("missing","下一份資料缺少一成持倉","資料不完整，暫不輸出集中度結論","review")
  ]),
  scene("simops","電路模擬","data-simops",[
    step("pass","送入電路案例，查看六個頻率點","阻抗皆低於示意門檻，結果通過","normal"),
    step("fail","下一個案例的阻抗峰值超過門檻","標記失敗，保留曲線供工程師判讀","warning"),
    step("timeout","另一項模擬工作逾時","保留嘗試紀錄，不補造模擬曲線","review")
  ]),
  scene("forge","模型治理","data-forge",[
    step("nf4","載入 NF4 版本與評測紀錄","這是來源快照中的已發布版本","normal"),
    step("q8","切換到 Q8，查看備援版本","保留為回復備援，並非現行發布版","normal"),
    step("q4","再查看體積較小的 Q4 版本","品質降幅超過上限，因此阻擋發布","warning")
  ])
]);
export function tourSelector(sceneConfig,tourStep){return '['+sceneConfig.attribute+'="'+tourStep.value+'"]';}
export function easeTour(value){const p=Math.max(0,Math.min(1,Number(value)||0));return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
// Allocate time to the actual morph range, independent of the distance between anchors.
export function tourBridgeProgress(value,from,to,bridge){
  const p=Math.max(0,Math.min(1,Number(value)||0)),span=bridge.end-bridge.start;
  const times=[0,.08,.36,.64,.92,1];
  const points=[from,bridge.start,bridge.start+span*.36,bridge.start+span*.64,bridge.end,to];
  for(let i=1;i<times.length;i++)if(p<=times[i]){
    const t=(p-times[i-1])/(times[i]-times[i-1]),smooth=t*t*(3-2*t);
    return points[i-1]+(points[i]-points[i-1])*smooth;
  }
  return to;
}
// Preserve every character, keeping closing punctuation with the preceding line.
export function captionLines(text,maxWidth,measure){
  const lines=[];let line="";
  for(const character of Array.from(text)){
    if(line&&measure(line+character)>maxWidth){
      if(/[，。！？、；：]/.test(character)&&line.length>1){
        const chars=Array.from(line),last=chars.pop();lines.push(chars.join(""));line=last+character;continue;
      }
      lines.push(line);line="";
    }
    line+=character;
  }
  if(line)lines.push(line);return lines;
}
