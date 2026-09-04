# Open Source Reference Projects

這份文件整理了開發 **MD Reader** 過程中所參考的開源專案與核心技術生態，作為後續架構擴展與功能設計的參考依據。

---

## 1. 核心專案參考

### 💎 [Quartz (v4)](https://github.com/jackyzha0/quartz)
- **類型**：Obsidian Vault 靜態網站產生器 (Static Site Generator)
- **技術棧**：TypeScript, Node.js, Unified/Remark/Rehype, Preact
- **重點參考點**：
  - **OFM (Obsidian Flavored Markdown) 語法處理**：Quartz 的 Transformer 系統針對 `[[wikilinks]]`、`![[embeds]]`、Callouts (`> [!note]`)、YAML Frontmatter、數學公式等有極為成熟的 AST 轉換經驗。
  - **Internal Link 解析機制**：如何模擬 Obsidian 在檔案目錄內依據檔名做 slug 自動匹配與連結跳轉。

### 🌐 [WebObsidian](https://github.com/xnohat/webobsidian) & [Browsidian](https://github.com/benoitlamouche/browsidian)
- **類型**：Web-based Obsidian Vault 檢視與瀏覽工具
- **重點參考點**：
  - **Web 端 Vault 瀏覽體驗**：左側檔案樹樹狀結構展開/收合、雙擊或單擊開啟筆記、麵包屑導航。
  - **瀏覽器端檔案快取與狀態管理**。

### ☁️ [StackEdit](https://github.com/benweet/stackedit) & [Dillinger](https://github.com/joemccann/dillinger)
- **類型**：線上 Markdown 編輯器與雲端同步平台
- **重點參考點**：
  - **Google Drive API 整合流程**：使用 OAuth 2.0 授權、呼叫 Drive v3 API 遍歷目錄與抓取檔案內容。
  - **Multi-provider 雲端架構**：未來串接 OneDrive (Microsoft Graph API) 時的介面抽象設計。

---

## 2. Markdown 渲染生態系 (Unified / Remark / Rehype)

| 套件名稱 | 角色與用途 |
| :--- | :--- |
| `unified` | 核心處理器管道 (Processor pipeline) |
| `remark-parse` | 將 Markdown 文字解析為 mdast (Markdown AST) |
| `remark-gfm` | 支援 GitHub Flavored Markdown (表格、刪除線、待辦清單等) |
| `remark-frontmatter` | 解析 YAML Frontmatter metadata |
| `remark-math` | 識別 LaTeX 數學公式語法 (`$math$` 與 `$$math$$`) |
| `remark-rehype` | 將 mdast 轉換為 hast (HTML AST) |
| `rehype-katex` | 將數學公式 hast 節點轉換為 KaTeX HTML 渲染結構 |
| `rehype-slug` | 自動為標題 `h1`~`h6` 產生 ID（便於 TOC 與錨點跳轉） |
| `rehype-stringify` | 將 hast 序列化為最終 HTML 字串 |
| `mermaid` | 用戶端繪製流程圖、序列圖與架構圖 |

---

## 3. 學習與架構擴充指引

- **延伸研究**：
  - 研讀 Quartz 的 Link resolution 演算法：理解當 Vault 中出現同名筆記或子資料夾時的最佳搜尋比對順序。
  - Google Drive Lazy Loading 策略：使用 `q="'folder_id' in parents and trashed = false"` 按需分頁載入目錄，防止大型 vault 造成請求阻塞。
