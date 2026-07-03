# 模型調度守則

> 一句話：主對話是指揮官——分派體力活、上收結論、面對用戶。指揮官不下場。
> 依據見 `diagnosis.md`。派工 prompt 直接套 `templates.md`。

## 1. 何時派工、何時自己做

**自己做**（派工本身有成本，量少不派）：
- 已知路徑、讀 1–4 個檔
- 單次 Grep / Glob
- 小範圍 Edit（1–2 個檔、改法明確）
- 跑一條驗證命令

**中間地帶（修改 3–4 個檔）**：可以自己改，但聲稱完成前必須過 verifier 驗收（judgment.md §2 條件 4 的「跨 3 檔以上」由此起算）。

**必須派工**（主對話不親自做，違反 = 漏 token，見 diagnosis §一.1）：
- 不知道東西在哪的搜尋 → `Explore`
- 跨 5 個檔以上的盤點、審讀、批次修改 → `general-purpose`
- 網頁研究、查文件 → `general-purpose`（Claude Code/API 相關則用 `claude-code-guide`）
- 驗收自己或別人聲稱完成的工作 → `verifier`（見 §6）

## 2. 可用棋子（2026-07-03 實測本環境）

| agent type | 用途 | 注意 |
|---|---|---|
| `Explore` | 唯讀搜尋定位：找檔、找 symbol、「X 定義在哪」 | 呼叫時要指定搜尋廣度：quick / medium / very thorough。它讀節錄不讀全檔，**不能**拿來做 code review 或跨檔一致性檢查 |
| `general-purpose` | 多步任務：研究、批次改檔、複雜搜尋 | 工具全開，什麼都能做 |
| `Plan` | 出實作計劃、架構取捨 | 只出計劃不動手 |
| `claude-code-guide` | 查 Claude Code / Agent SDK / Claude API 官方文件 | 問「Claude 能不能 X」類問題用它，不要憑記憶答 |
| `verifier`（本 repo 自訂） | fresh-context 驗收員 | 定義在 `.claude/agents/verifier.md`；只驗收不修復 |

**model 參數**（Agent tool 每次呼叫可指定）：`haiku` / `sonnet` / `opus` / `fable`。`fable` 未必隨時可用，呼叫報錯就退 `opus`。

**effort**：每次呼叫**不能**指定 effort。effort 只能寫在 `.claude/agents/*.md` 的 frontmatter（值：low / medium / high / xhigh / max）。需要固定 effort 的角色，就建自訂 agent 檔（先讀 maintenance.md）。

**背景執行**：subagent 預設在背景跑，完成會自動通知你。需要拿到結果才能繼續時，傳 `run_in_background: false`。要追問已存在的 agent 用 SendMessage（帶它的 id）續用它的 context，不要重開新 agent 從零重建。

## 3. 模型分工預設值

| 任務性質 | model |
|---|---|
| 機械批次：pattern 已定好、照抄套用到多處；格式整理；簡單彙整 | `haiku` |
| 一般實作、搜尋、研究、驗收（預設值，不確定就用這個） | `sonnet` |
| 卡關升級、架構決策、第二意見、高風險改動的審查 | `opus` |
| 品味／模糊判斷的最終仲裁（UI 好不好看、文案語氣、策略合理性） | `fable`；不可用則 `opus`，並向用戶標明「這是品味判斷，模型意見僅供參考」 |

## 4. 派工三件套（每個派工 prompt 必含）

1. **目標與動機**：做什麼＋為什麼要做。動機讓 agent 在邊界情況做出正確取捨（沒有動機的 agent 會字面執行到荒謬）。
2. **驗收條件**：可機械檢查的清單（能跑的命令、能 grep 的字串、能數的數量）。
3. **回報格式**：明確規定回什麼、多長。不規定就會收到一篇作文。

具體填空模板見 `templates.md`，不要自己即興寫。

## 5. 回報合約（寫進每個派工 prompt 的固定條款）

- 只回結論＋`檔案:行號`，禁止把檔案內容全文貼回。
- 長產物（研究報告、大 diff 說明）落檔——寫到 scratchpad 或 repo 檔案——回報只給路徑＋不超過 10 行的摘要。
- 失敗也要照格式回報：試了什麼、卡在哪、關鍵錯誤輸出（原文最後 20 行以內）。禁止回「做不到」四個字了事。

## 6. 驗證不自驗

- **做的人不驗收自己。**聲稱完成前，驗收工作派給 `verifier` agent（fresh context，不帶「應該已經好了」的預設）。
- 檔案類產出：verifier read-back——逐條驗收條件在檔案裡找證據。
- 代碼類產出：跑命令。`npm run build`、`py_compile`、測試——命令輸出就是證據，verifier 負責跑而不是「看起來沒問題」。
- 高風險判斷（部署行為、`playlimit.js` 等產品規則、金錢相關邏輯、大重構的方案選擇）：加第二意見——另開一個 `opus` agent 給同樣輸入獨立作答再比對；或生成 2–3 個候選方案，開一個 `opus` 評審逐條打分選優。
- 主對話自己做的 1–2 檔小改動不用開 verifier，但至少要跑 CLAUDE.md「完工必做」的最低驗證命令；3 檔以上見 §1 中間地帶，必須 verifier。

## 7. 升降級路徑

- `haiku` 錯一次 → 直接升 `sonnet`。不給 haiku 第二次機會，重試的成本比升級高。
- `sonnet` 在**同一個子任務**連錯兩次 → 帶完整失敗軌跡升 `opus`。失敗軌跡 = 原始任務描述＋兩次嘗試各自的改動摘要＋錯誤輸出原文。不帶軌跡的升級等於讓 opus 從零再錯一次。
- `opus` 也解不掉 → 停手，向用戶報告（格式見 judgment.md §3），不要開始亂試。
- **降級**：一旦模式解出來（修法確定、剩下是重複套用），降回 `haiku`/`sonnet` 批次執行，不要用貴模型做抄寫工。
- **兩輪上限**：同一件事最多重試兩輪。第三次動手前必須「換方法」或「升級」二選一，原地重試同一招視為違規（判斷訊號見 judgment.md §4）。
