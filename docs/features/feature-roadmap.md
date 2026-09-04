# MD Reader 功能路線圖 (Feature Roadmap)

本文件規劃 MD Reader 的開發階段里程碑與未來功能儲備清單。

---

## 🎯 Phase 1：基礎設施與開發規範 (已完成)
- [x] Next.js (App Router) + TypeScript + pnpm 專案架構建立
- [x] 建立 `docs/` 文件目錄結構 (ADR、架構參考、GCP 設定教學)
- [x] 環境變數 `.env.example` 配置
- [x] Vanilla CSS 與 GitHub Light/Dark 主題變數系統

---

## 🚀 Phase 2：使用者認證 (Auth.js v5)
- [ ] 整合 Auth.js v5 與 Google OAuth 2.0 Provider
- [ ] 配置 `drive.readonly` 權限範圍並在 JWT Session 回調中安全保存 Access Token / Refresh Token
- [ ] 登入與登出流程、身分狀態展示元件
- [ ] Session 自動更新與過期處理提示

---

## 📁 Phase 3：Google Drive Vault 與檔案樹 (Lazy Loading)
- [ ] Google Drive API Wrapper (`src/lib/drive/google.ts`)
- [ ] API Route Handler: `/api/drive/folders` (按父資料夾 ID 查詢子目錄與 Markdown 檔案)
- [ ] API Route Handler: `/api/drive/file` (依檔案 ID 抓取 Markdown 文字內容)
- [ ] Vault 根目錄選擇器 (支援瀏覽選擇 Google Drive 目錄並存入 localStorage)
- [ ] 左側檔案樹元件 (支援樹狀折疊、展開按需 Lazy Loading、即時檔名過濾搜尋)

---

## 📝 Phase 4：Obsidian-Flavored Markdown (OFM) 渲染引擎
- [ ] Markdown 管道基礎配置：`remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-stringify`
- [ ] **Wikilinks 支援**：`[[note-title]]` 與 `[[note-title#heading]]` 解析，支援 Vault 內檔案自動配對跳轉
- [ ] **Obsidian Callouts**：解析 `> [!note]`, `> [!tip]`, `> [!warning]`, `> [!danger]`, `> [!info]` 等語法與色彩渲染
- [ ] **數學公式**：支援 KaTeX 行內 `$E=mc^2$` 與區塊 `$$...$$` 渲染
- [ ] **圖表與架構圖**：支援 Mermaid 程式碼區塊用戶端動態繪製
- [ ] **YAML Frontmatter**：頂部標籤、建立時間與 Metadata 折疊預覽
- [ ] **標籤與高亮**：支援 `#tag` 與 `==highlight==` 語法

---

## 🎨 Phase 5：UI/UX 優化與行動裝置支援 (RWD)
- [ ] GitHub 配色主題 (Light & Dark Mode) 完整樣式微調與切換按鈕
- [ ] Obsidian 風格主佈局 (側邊欄拖曳調整寬度/收合、標題導航欄、回到頂部)
- [ ] 行動裝置適配 (側邊欄抽屜式 Drawer 漢堡選單、手勢滑動體驗)
- [ ] Demo / 離線預覽模式 (未登入時可直接載入範例 Obsidian 筆記庫測試渲染效果)

---

## 🔮 Phase 6：未來功能儲備 (Future Features)
- [ ] **Microsoft OneDrive 整合**：串接 Microsoft Graph API 支援 OneDrive 筆記庫
- [ ] **全文檢索 (Full-Text Search)**：於瀏覽器端建立 Client-side 索引支援筆記內文搜尋
- [ ] **雙向連結圖譜 (Graph View)**：以 D3.js 或 2D Canvas 視覺化 Vault 內筆記關聯圖
- [ ] **編輯與存回雲端 (Write Mode)**：整合輕量級 Markdown 編輯器支援變更儲存回 Google Drive
