# 部署指引

## 1. 準備 LINE Bot 憑證

### 建立 LINE Bot 頻道
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 登入並點選 "Create Provider"
3. 建立新的 "Messaging API" 頻道
4. 取得以下資訊：
   - **Channel Secret** (在 Basic settings 頁面)
   - **Channel Access Token** (在 Messaging API 頁面，點選 Issue)

### 設定環境變數
編輯 `.env` 檔案：
```env
CHANNEL_SECRET=你的_Channel_Secret
CHANNEL_ACCESS_TOKEN=你的_Channel_Access_Token
PORT=3000
```

## 2. 快速部署到 Railway

### 安裝 Railway CLI
```bash
npm install -g @railway/cli
```

### 部署步驟
```bash
# 1. 登入 Railway
railway login

# 2. 初始化專案
railway init

# 3. 設定環境變數
railway variables set CHANNEL_SECRET=你的_Channel_Secret
railway variables set CHANNEL_ACCESS_TOKEN=你的_Channel_Access_Token

# 4. 部署
railway up
```

### 取得部署 URL
```bash
railway domain
```
會顯示類似：`https://your-app-name.railway.app`

## 3. 設定 LINE Webhook

1. 在 LINE Developers Console 的 Messaging API 頁面
2. 設定 **Webhook URL**：
   ```
   https://your-app-name.railway.app/webhook
   ```
3. 啟用 **Use webhooks**
4. 點選 **Verify** 測試連線

## 4. 測試 Bot

1. 在 LINE Developers Console 取得 QR Code
2. 用手機 LINE 掃描加入 Bot
3. 傳送地址測試：`台北市中正區重慶南路一段122號`

## 其他部署選項

### Heroku
```bash
heroku create your-linebot-name
heroku config:set CHANNEL_SECRET=你的密鑰
heroku config:set CHANNEL_ACCESS_TOKEN=你的權杖
git add .
git commit -m "Deploy LINE Bot"
git push heroku main
```

### Vercel
1. 安裝 Vercel CLI：`npm i -g vercel`
2. 執行：`vercel --prod`
3. 在 Vercel dashboard 設定環境變數

## 疑難排解

### Webhook 驗證失敗
- 確認 URL 正確且可訂閱
- 檢查 CHANNEL_SECRET 是否正確
- 確認伺服器正常回應 200 狀態

### Bot 無回應
- 檢查 CHANNEL_ACCESS_TOKEN 是否正確
- 查看伺服器 logs：`railway logs`
- 確認 webhook 事件處理正常

### 地址轉換失敗
- 檢查 API 連線：`node test.js`
- 確認輸入地址格式正確
- 查看錯誤訊息