# Google Cloud Platform (GCP) OAuth 設定教學

本文件說明如何建立 Google Cloud 專案與 OAuth 2.0 Client ID，以供 CloudMD 進行 Google 登入與存取 Google Drive 中的 Markdown 檔案。

---

## 步驟 1：建立 GCP 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 點擊頂部專案選單，選擇 **「新增專案」 (New Project)**。
3. 專案名稱可填寫 `CloudMD`，點擊 **「建立」**。

---

## 步驟 2：啟用 Google Drive API

1. 在左側導航選單中，點選 **「API 和服務」 (APIs & Services) > 「已啟用的 API 和服務」 (Enabled APIs & Services)**。
2. 點擊頂部的 **「+ 啟用 API 和服務」 (+ ENABLE APIS AND SERVICES)**。
3. 搜尋 `Google Drive API`，進入後點擊 **「啟用」 (Enable)**。

---

## 步驟 3：設定 OAuth 同意畫面 (OAuth Consent Screen)

1. 前往 **「API 和服務」 > 「OAuth 同意畫面」**。
2. 使用者類型 (User Type) 選擇 **「外部」 (External)**，點擊「建立」。
3. 填寫必要欄位：
   - **應用程式名稱**：`CloudMD`
   - **使用者支援電子郵件**：填寫你的 Gmail
   - **開發人員聯絡資訊**：填寫你的 Gmail
4. 點擊「儲存並繼續」。
5. **範圍 (Scopes)**：
   - 點擊「新增或移除範圍」。
   - 勾選 `.../auth/userinfo.email`、`.../auth/userinfo.profile`、`openid`。
   - 勾選 `https://www.googleapis.com/auth/drive.readonly`。
   - 點擊「更新」並儲存繼續。
6. **測試使用者 (Test Users)**：
   - 在測試模式下，只有加入清單的 Google 帳號可以登入。
   - 點擊「+ ADD USERS」，輸入你要用來測試的 Google 帳號（即存放筆記的帳號）。
   - 點擊「儲存並繼續」。

---

## 步驟 4：建立 OAuth 2.0 Client ID 憑證

1. 前往 **「API 和服務」 > 「憑證」 (Credentials)**。
2. 點擊頂部 **「+ 建立憑證」 > 「OAuth 用戶端 ID」 (OAuth client ID)**。
3. 應用程式類型選擇 **「網路應用程式」 (Web application)**。
4. 名稱填寫 `CloudMD Web Client`。
5. **已授權的 JavaScript 來源 (Authorized JavaScript origins)**：
   - 本地開發：`http://localhost:3000`
   - 正式環境 (若已佈署到 Vercel)：`https://your-app.vercel.app`
6. **已授權的重新導向 URI (Authorized redirect URIs)**：
   - 本地開發：`http://localhost:3000/api/auth/callback/google`
   - 正式環境：`https://your-app.vercel.app/api/auth/callback/google`
7. 點擊 **「建立」**。
8. 複製彈出視窗中的 **「用戶端編號 (Client ID)」** 與 **「用戶端密鑰 (Client Secret)」**。

---

## 步驟 5：設定專案環境變數 (.env.local)

在專案根目錄建立 `.env.local` 檔案，填入以下設定：

```env
# NextAuth / Auth.js 設定
AUTH_SECRET="請執行 npx auth secret 或 openssl rand -base64 32 生成"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth 憑證
AUTH_GOOGLE_ID="你的 Google Client ID"
AUTH_GOOGLE_SECRET="你的 Google Client Secret"
```
