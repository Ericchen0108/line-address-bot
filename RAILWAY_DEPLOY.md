# 🚀 Railway 部署指引

## 為什麼選擇 Railway？
- ❌ Vercel 有驗證保護問題
- ✅ Railway 沒有存取限制
- ✅ 更適合 webhook 服務
- ✅ 部署簡單

## 📋 部署步驟

### 1. 建立 Railway 帳號
- 前往 [railway.app](https://railway.app)
- 用 GitHub 帳號註冊

### 2. CLI 部署 (推薦)
```bash
# 登入 Railway
railway login

# 初始化專案
railway init

# 設定環境變數
railway variables set CHANNEL_SECRET=375c53ae440ac380f6c8136234ac0ed1
railway variables set CHANNEL_ACCESS_TOKEN=RRou6ri0uK+nvwvEgyrGCzLBwvg8zwtChvZfNdcEbjj4DbauuBpj/Q+40qMtwlrOGU6Q6bmzhELz/jO08uYGSdapmUAA6SjeyP9N9FNfgMYyWMWHiIf+O7+wBRD3hJwPnaXph9NyU6By4qZZF5aR4wdB04t89/1O/w1cDnyilFU=

# 部署
railway up
```

### 3. 網頁介面部署 (替代方案)
1. 前往 [railway.app/new](https://railway.app/new)
2. 選擇 "Deploy from GitHub repo"
3. 上傳專案到 GitHub 並連接
4. 在 Variables 頁面設定：
   - `CHANNEL_SECRET`: `375c53ae440ac380f6c8136234ac0ed1`
   - `CHANNEL_ACCESS_TOKEN`: `RRou6ri0uK+nvwvEgyrGCzLBwvg8zwtChvZfNdcEbjj4DbauuBpj/Q+40qMtwlrOGU6Q6bmzhELz/jO08uYGSdapmUAA6SjeyP9N9FNfgMYyWMWHiIf+O7+wBRD3hJwPnaXph9NyU6By4qZZF5aR4wdB04t89/1O/w1cDnyilFU=`
5. 點選 Deploy

## 🎯 部署後測試

部署完成會得到 URL，例如：
`https://your-app.railway.app`

測試指令：
```bash
curl https://your-app.railway.app/
```

應該回應：
```json
{
  "message": "LINE Address Bot is running!",
  "timestamp": "...",
  "env": {
    "hasChannelSecret": true,
    "hasChannelAccessToken": true
  }
}
```

## 📱 設定 LINE Webhook

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇你的 Messaging API 頻道
3. 設定 Webhook URL：
   ```
   https://your-app.railway.app/webhook
   ```
4. 啟用 "Use webhooks"
5. 點選 "Verify" 測試連線

## ✅ 完成！

掃描 QR Code 加入 Bot 並測試地址轉換：
- `台北市中正區重慶南路一段122號`
- `高雄市左營區博愛二路777號`

## 🔧 疑難排解

### 查看部署日誌
```bash
railway logs
```

### 重新部署
```bash
railway up --detach
```

## 📁 當前專案狀態
- ✅ Express 版本已準備
- ✅ 環境變數已設定
- ✅ 功能測試通過
- 🚀 準備部署到 Railway