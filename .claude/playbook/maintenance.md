# 維護協議：怎麼安全地更新這套制度檔

> 制度檔清單：root `CLAUDE.md`、`kid-star/CLAUDE.md`、`.claude/playbook/*.md`、`.claude/agents/*.md`。
> 原則：git 就是備份（所有改動走 `claude/*` 分支＋PR），但**一個制度檔的修改 = 一個獨立 commit**，方便單獨 revert。

## 1. 可以自行改（不用問用戶）

- `lessons.md`：追加新教訓、往 Backlog 加一行。**這是預設動作**，門檻低，寧多勿漏。
- 事實性更新：命令換了、路徑改了、新增了目錄——改 CLAUDE.md／kid-star/CLAUDE.md 對應行，並實測新命令可用。
- `templates.md`：新增模板（不改動現有模板的三件套結構）。
- 修正錯字、失效連結、錯誤的檔案路徑。

## 2. 動之前必須先問用戶（紅線）

- 刪除或放寬任何驗證要求（CLAUDE.md 完工必做、judgment.md §2/§5）。放寬驗證永遠感覺「合理」，這正是制度退化的主通道。
- 改 `dispatch.md` 的升降級規則、兩輪上限。
- 改 `judgment.md` 的任何判準內容（追加正反例可以自行做）。
- 刪掉 `diagnosis.md`、`letter.md` 的內容（追加註記可以）。
- 新增 `.claude/agents/*.md` 或改 `verifier.md`（agent 定義影響之後所有 session 的行為）。
- 把任何檔案放進 `.claude/rules/`——注意：**該目錄有自動載入語義**（無 `paths` frontmatter 的檔開場全載，燒每個 session 的 token）。本制度刻意不用它，deep 規則放 playbook 按需讀。

## 3. 踩坑後怎麼寫教訓

寫進 `lessons.md`，格式（每條 ≤6 行）：

```
## YYYY-MM-DD 一句話標題
- 情境：做什麼任務、哪個專案。
- 坑：實際發生了什麼（帶錯誤訊息關鍵行或 commit hash）。
- 教訓：下次怎麼避免（可執行的一句話，不要「要小心」）。
- 規則改動：改了哪個制度檔哪一段；沒改就寫「無」＋為什麼。
```

重要：lessons.md 是 changelog，**規則檔才是 source of truth**。如果一個教訓值得每次都遵守，必須同時把它寫進對應規則檔（§1/§2 判斷要不要先問）；只躺在 lessons 裡的教訓等於沒學會。

## 4. 精簡門檻（防制度膨脹）

- `lessons.md` 超過 30 條或 300 行 → 做一次整併：已寫進規則檔的條目刪掉、同類坑合併、過時的刪除。整併是自行可做的，但整併 commit 要單獨開，訊息寫明刪了什麼。
- root `CLAUDE.md` 超過 60 行 → 超出部分抽到 playbook，CLAUDE.md 只留路由。它是每個 session 的固定成本，一行都要省。
- 任何 playbook 檔超過 150 行 → 檢查是否該拆分或刪冗餘（先問用戶再刪規則內容）。

## 5. 改完制度檔的驗證

- 引用的路徑、命令、工具名逐一實測（路徑 `ls`、命令跑一次、工具名對照本 session 實際可用清單）。
- 讓 verifier agent read-back：給它「這次修改的意圖清單」，讓它在 fresh context 下讀改後的檔，確認一個沒看過上下文的模型能否照做。它說讀不懂的地方就是要重寫的地方。
