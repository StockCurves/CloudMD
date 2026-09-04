# ADR 001: 系統架構與技術選型決策

## 狀態
**已通過 (Accepted)** — 2026-08-30

## 背景與需求
我們需要建立一個能部署在 Vercel 上的線上 Markdown 筆記閱讀器 (MD Reader)，支援讀取 Google Drive 儲存的 Obsidian Vault，並具備 Obsidian-Flavored Markdown 語法（Wikilinks、Callouts、數學公式、Mermaid 圖表等）渲染能力，並以 GitHub 配色搭配 Obsidian 經典版面呈現，同時支援完整行動裝置響應式體驗 (RWD)。

---

## 決策項目

### 1. 應用程式框架：Next.js (App Router)
- **原因**：
  - Vercel 原生一鍵部署，支援 Edge / Serverless Function 零設定。
  - App Router 提供乾淨的 Server Components 與 Route Handlers，可安全隱藏 OAuth Access Token 與 Drive API 呼叫，不外洩至前端用戶端。
  - 符合現代前端工程主流規格，具備極高學習價值。

### 2. 認證機制：Auth.js v5 (NextAuth.js Beta) + JWT Strategy
- **原因**：
  - 零資料庫需求（Stateless）：存取 Google Drive 必要的 Access Token / Refresh Token 加密保存在 Session JWT 中。
  - 原生支援 Google 與 Microsoft Entra ID (OneDrive) Provider，未來擴展性佳。

### 3. Google Drive 存取架構：目錄 Lazy Loading + Folder Vault Scope
- **原因**：
  - 使用者指定其 Vault 根資料夾 ID（由 localStorage 記憶或前端選擇器挑選）。
  - 檔案樹採用 **Lazy Loading（按需展開載入）**，只有在展開資料夾時才向後端 API 請求該層目錄內容，大幅降低 Google Drive API 配額消耗，並解決大型筆記庫初次載入延遲問題。

### 4. Markdown 渲染引擎：Unified Pipeline + 自製 OFM 語法擴展
- **原因**：
  - 採用 AST (mdast / hast) 架構，可精確控制 Wikilink (`[[note]]`)、Callouts (`> [!note]`)、Math (KaTeX)、Mermaid 圖表的轉換。
  - 使用 React Client Component 做 Mermaid 與 KaTeX 動態渲染與互動（如 Wikilink 檔案搜尋與快速跳轉）。

### 5. UI 設計語言：GitHub Color Palette + Obsidian Workspace Layout + Vanilla CSS Modules
- **原因**：
  - **色彩系統**：採用 GitHub 設計規範之 Light (`#ffffff`, `#f6f8fa`, `#0969da`, `#d0d7de`) 與 Dark Mode (`#0d1117`, `#161b22`, `#58a6ff`, `#30363d`) 語意化變數。
  - **版面配置**：Obsidian 雙欄佈局（可收合之左側檔案樹側邊欄、麵包屑標題列、主閱讀區）。
  - **樣式技術**：Vanilla CSS + CSS Modules，保持輕量零第三方 CSS Runtime 負擔，並深入掌握原生 CSS 變數與容器佈局技巧。

---

## 後續影響
- 無需維護 PostgreSQL/MySQL 資料庫與連線池。
- Google Drive API 呼叫需留意 Rate Limit，後端 Route Handler 應提供基本快取或批次查詢機制。
