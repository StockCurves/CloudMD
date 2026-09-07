import { DriveItem } from "@/lib/drive/types";

export interface DemoFileItem extends DriveItem {
  content?: string;
  children?: DemoFileItem[];
}

export const DEMO_VAULT_ITEMS: DemoFileItem[] = [
  {
    id: "demo-welcome",
    name: "00 Welcome to MD Reader.md",
    mimeType: "text/markdown",
    isFolder: false,
    content: `---
title: Welcome to MD Reader
tags:
  - introduction
  - obsidian
  - get-started
date: 2026-08-30
author: MD Reader Team
---

# 📖 Welcome to MD Reader

**MD Reader** 是一個專為 [Obsidian](https://obsidian.md) 與 Markdown 愛好者設計的線上筆記閱讀器。它可以連接你的 **Google Drive**，隨時隨地優雅地閱讀雲端筆記！

---

## 🌟 核心特色一覽

1. **GitHub 色彩設計風格**：深色/淺色主題一鍵切換，現代簡約。
2. **Obsidian 語法完全相容**：
   - 雙方括號連結：[[Markdown Syntax Showcase]] 與 [[Architecture Overview#核心理念]]
   - 警示區塊：> [!tip] 與 > [!warning]
   - 數學公式：$E = mc^2$ 與 $\\int_{a}^{b} f(x)dx$
   - 流程圖繪製：Mermaid 圖表
   - YAML Frontmatter 標籤抽屜
3. **按需延遲載入 (Lazy Loading)**：即使筆記庫有數千篇檔案，也能秒速開啟！
4. **手機行動端完整支援 (RWD)**：支援漢堡選單抽屜與觸控滑動。

---

## 🚀 快速跳轉導航

點擊下方連結探索各項特色與功能範例：

- 📝 [[Markdown Syntax Showcase|完整 Obsidian 語法展示]]
- 📐 [[Math and Charts|數學公式與 Mermaid 流程圖範例]]
- 🏗️ [[Architecture Overview|系統架構與開發流程]]
- 📁 查看側邊欄中的 \`Projects/\` 與 \`Personal/\` 資料夾探索階層式結構！

> [!tip] 提示
> 你可以在右上角點擊 **「連線 Google Drive」** 登入你的 Google 帳號，讀取你自己的真實 Obsidian 筆記庫！
`,
  },
  {
    id: "demo-syntax",
    name: "Markdown Syntax Showcase.md",
    mimeType: "text/markdown",
    isFolder: false,
    content: `---
title: Markdown Syntax Showcase
tags:
  - syntax
  - callouts
  - wikilinks
  - formatting
created: 2026-08-30
---

# 🎨 Obsidian 語法展示 (OFM Syntax)

MD Reader 支援完整的 **Obsidian-Flavored Markdown** 擴展語法。

---

## 1. 雙向連結 (Wikilinks)

- 基礎筆記跳轉：[[00 Welcome to MD Reader]]
- 自訂別名 (Alias)：[[Math and Charts|點我查看公式與圖表]]
- 錨點標題跳轉：[[Architecture Overview#3. Google Drive 存取策略]]
- 未建立的筆記連結測試：[[Uncreated Note Example]]（顯示為未連結樣式）

---

## 2. 警示區塊 (Callouts)

> [!note] 備忘錄 (Note)
> 這是一般的 Note 區塊，用來記錄額外補充說明。

> [!tip] 技巧 (Tip)
> 使用 \`[[檔名]]\` 可以在任何筆記之間自由穿梭跳轉！

> [!important] 重要事項 (Important)
> 本閱讀器採用唯讀 (Read-only) 機制，確保雲端檔案的安全不被意外覆寫。

> [!warning] 警告 (Warning)
> 請確認 Google Drive 帳號授權已包含 \`drive.readonly\` 範圍。

> [!danger] 危險 (Danger)
> 勿將私密金鑰直接記錄在公開筆記中。

> [!example]- 折疊式範例 (Collapsible Example)
> 點擊標題可以展開或收合這個 Callout 內容！
> 支援多行文字與列表：
> - 項目 A
> - 項目 B

---

## 3. 文字樣式與高亮

- **粗體文字** 與 *斜體文字*
- 刪除線：~~過期的待辦事項~~
- Obsidian 標記高亮：==這是被螢光筆標記的重點文字==
- 行內程式碼：\`npm run dev\` 或 \`const reader = true;\`

---

## 4. GFM 待辦清單與表格

### 任務清單
- [x] 專案基礎建設與 Next.js App Router 初始化
- [x] Auth.js v5 Google Drive 整合
- [x] Obsidian 語法解析器 (Wikilinks, Callouts, KaTeX, Mermaid)
- [ ] OneDrive 整合 (規劃中)

### 比較表格

| 功能特性 | MD Reader | 一般 Markdown 檢視器 |
| :--- | :---: | :---: |
| Obsidian Wikilinks | ✅ 支援跳轉 | ❌ 無法解析 |
| Obsidian Callouts | ✅ 多種樣式 | ❌ 僅轉為引用 |
| Google Drive 整合 | ✅ 按需載入 | ❌ 需手動下載 |
| GitHub 現代主題 | ✅ 支援 Dark/Light | ❌ 陽春預設 |
`,
  },
  {
    id: "demo-math-charts",
    name: "Math and Charts.md",
    mimeType: "text/markdown",
    isFolder: false,
    content: `---
title: Math and Charts
tags:
  - math
  - latex
  - mermaid
  - diagrams
---

# 📐 數學公式與 Mermaid 圖表

---

## 1. KaTeX 數學公式

### 行內公式 (Inline Math)
愛因斯坦質能互換公式為 $E = mc^2$，歐拉恆等式為 $e^{i\\pi} + 1 = 0$。

### 區塊公式 (Block Math)

高斯積分：
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

馬克士威方程組 (Maxwell's Equations)：
$$\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}$$
$$\\nabla \\cdot \\mathbf{B} = 0$$
$$\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}$$
$$\\nabla \\times \\mathbf{B} = \\mu_0\\left(\\mathbf{J} + \\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}\\right)$$

---

## 2. Mermaid 圖表動態繪製

### 流程圖 (Flowchart)

\`\`\`mermaid
flowchart TD
    A[用戶造訪 MD Reader] --> B{是否登入 Google?}
    B -- 是 --> C[讀取 Google Drive Vault]
    B -- 否 --> D[使用 Demo 範例筆記庫]
    C --> E[Lazy Load 目錄檔案樹]
    D --> E
    E --> F[選擇 Markdown 筆記]
    F --> G[Unified Pipeline 渲染 OFM]
    G --> H[渲染 Wikilinks / Callouts / KaTeX / Mermaid]
\`\`\`

### 序列圖 (Sequence Diagram)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as 用戶
    participant Web as 前端 UI
    participant API as Next.js API
    participant Drive as Google Drive

    User->>Web: 點選展開資料夾
    Web->>API: GET /api/drive/folders?folderId=xxx
    API->>Drive: Google Drive API (files.list)
    Drive-->>API: 返回檔案清單 JSON
    API-->>Web: 返回 DriveItem[]
    Web->>User: 動態展開子節點
\`\`\`
`,
  },
  {
    id: "demo-architecture",
    name: "Architecture Overview.md",
    mimeType: "text/markdown",
    isFolder: false,
    content: `---
title: Architecture Overview
tags:
  - architecture
  - nextjs
  - authjs
  - google-drive
---

# 🏗️ 系統架構與技術決策

本筆記記錄 **MD Reader** 的整體系統架構與核心技術設計。

---

## 1. 核心理念

- **Stateless 輕量化**：不架設專屬資料庫，避免資料隱私風險與維護成本。
- **Token-in-Session**：OAuth Access Token 加密封裝於 HTTP-only JWT Cookie 中。
- **安全隔離 Proxy**：瀏覽器不直接暴露 Google Client Secret，全部由 Next.js Server Route Handler 代理呼叫。

---

## 2. 前後端模組分層

\`\`\`
src/
├── app/                  # Next.js App Router (頁面與 API 路由)
├── components/           # UI 元件 (Sidebar, Viewer, Modal, Header)
├── lib/
│   ├── auth.ts           # Auth.js v5 Google Provider 設定
│   ├── drive/            # Google Drive API Wrapper & Types
│   ├── markdown/         # Unified / Remark / Rehype OFM 渲染管線
│   └── demo/             # 離線示範用 Vault 資料庫
└── types/                # TypeScript 型別宣告
\`\`\`

---

## 3. Google Drive 存取策略

> [!important] 按需延遲載入 (Lazy Loading)
> 當 Vault 包含數百個資料夾與數千篇筆記時，若初次一次性抓取全部目錄樹會造成嚴重的 API 限流與卡頓。
> MD Reader 採用 **按需載入**：
> 1. 初次僅載入 Vault 根目錄項目。
> 2. 當使用者點擊資料夾箭頭時，才非同步觸發該層查詢並快取於前端 State。

---

## 4. 相關連結

- 返回首頁：[[00 Welcome to MD Reader]]
- 語法範例：[[Markdown Syntax Showcase]]
`,
  },
  {
    id: "demo-toc",
    name: "TOC.md",
    mimeType: "text/markdown",
    isFolder: false,
    content: `---
title: Table of Contents
tags:
  - moc
  - index
  - toc
---

# 📑 知識庫總目錄 (Table of Contents)

歡迎使用目錄總覽！點選以下子資料夾連結，將直接在左側檔案樹展開該目錄並開啟對應的筆記檔案：

## 📂 子目錄連結測試

- 🚀 [前往 Projects 目錄 (Google Drive 格式連結)](https://drive.google.com/drive/folders/demo-folder-projects)
- 💡 [前往 Personal 目錄 (內部相對路徑連結)](demo-folder-personal)

## 📄 單篇筆記連結

- [[00 Welcome to MD Reader|歡迎頁面]]
- [[Markdown Syntax Showcase|語法展示]]
`,
  },
  {
    id: "demo-folder-projects",
    name: "Projects",
    mimeType: "application/vnd.google-apps.folder",
    isFolder: true,
    hasChildrenLoaded: true,
    children: [
      {
        id: "demo-proj-mdreader",
        name: "MD Reader Development.md",
        mimeType: "text/markdown",
        isFolder: false,
        content: `# 🚀 MD Reader 開發日誌

記錄開發過程與技術亮點。

## 🎯 已完成項目
- [x] Next.js App Router 初始化
- [x] Vanilla CSS Modules 主題變數 (GitHub Light / Dark)
- [x] Unified Pipeline (Wikilinks, Callouts, KaTeX, Mermaid)
- [x] Lazy Loading 檔案樹與即時搜尋

返回首頁：[[00 Welcome to MD Reader]]
`,
      },
    ],
  },
  {
    id: "demo-folder-personal",
    name: "Personal",
    mimeType: "application/vnd.google-apps.folder",
    isFolder: true,
    hasChildrenLoaded: true,
    children: [
      {
        id: "demo-personal-ideas",
        name: "Quick Notes.md",
        mimeType: "text/markdown",
        isFolder: false,
        content: `# 💡 靈感隨筆

- 探索 WebAssembly 加速 Markdown AST 遍歷
- 支援 Obsidian Canvas (.canvas) JSON 視覺化呈現
- 支援離線 PWA 快取

參考連結：[[00 Welcome to MD Reader]]
`,
      },
    ],
  },
];
