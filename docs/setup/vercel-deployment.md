# Vercel 部署指引 (Vercel Deployment Guide)

本文件說明如何將 CloudMD 專案部署至 [Vercel](https://vercel.com/) 雲端平台。

---

## 步驟 1：前往 Vercel 匯入 GitHub 專案

1. 登入 [Vercel 控制台](https://vercel.com/dashboard)。
2. 點擊右上角的 **「Add New...」 > 「Project」**。
3. 在 **「Import Git Repository」** 列表中找到 `StockCurves/CloudMD`，並點擊 **「Import」**。

---

## 步驟 2：設定專案環境變數 (Environment Variables)

在 Vercel 的專案設定頁面中，展開 **「Environment Variables」** 區塊，加入以下環境變數（可參考本地 `.env.local` 內容填入）：

| 變數名稱 (Variable Key) | 說明與範例值 |
| :--- | :--- |
| `AUTH_SECRET` | 用於加密 NextAuth / Auth.js JWT Session Cookie 的隨機字串（可使用原本本地的字串，或透過 `openssl rand -base64 32` 生成） |
| `AUTH_GOOGLE_ID` | 您的 Google Cloud OAuth 2.0 用戶端編號（結尾為 `.apps.googleusercontent.com`） |
| `AUTH_GOOGLE_SECRET` | 您的 Google Cloud OAuth 2.0 用戶端密鑰 |
| `NEXTAUTH_URL` | 正式環境的應用程式網址，格式為 `https://<your-project-name>.vercel.app`（若尚未取得精確網址，Vercel 預設支援以 `https://${process.env.VERCEL_URL}` 作為備援，部署完成取得 Domain 後建議補上） |

---

## 步驟 3：點擊「Deploy」進行建置

1. 架構預設維持 **Next.js**，Build Command 與 Output Directory 維持預設值。
2. 點擊 **「Deploy」**。
3. 等待約 1~2 分鐘建置完成，即可取得上線網址（例如 `https://cloud-md-xxx.vercel.app`）。

---

## 步驟 4：更新 Google Cloud OAuth 2.0 授權重新導向網址 (重要)

完成部署並取得 Vercel 網址後，**必須**將正式網址加入 Google Cloud Console，否則在正式站點登入 Google 帳號時會出現 `redirect_uri_mismatch` 錯誤：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) > **「API 和服務」 > 「憑證」 (Credentials)**。
2. 點擊您的 OAuth 2.0 用戶端（例如 `CloudMD Web Client`）進入編輯頁面。
3. 在 **「已授權的 JavaScript 來源 (Authorized JavaScript origins)」** 新增：
   - `https://<your-project-name>.vercel.app`
4. 在 **「已授權的重新導向 URI (Authorized redirect URIs)」** 新增：
   - `https://<your-project-name>.vercel.app/api/auth/callback/google`
5. 點擊 **「儲存」**（設定通常於數分鐘內生效）。

---

## 步驟 5：驗證正式環境

1. 開啟 Vercel 正式網址。
2. 點擊右上角 **「連線 Google Drive」** 進行登入。
3. 選取您的 Obsidian Vault 資料夾。
4. 點選 `TOC.md` 測試 Google Drive 子目錄連結跳轉與 Markdown 筆記閱讀。
