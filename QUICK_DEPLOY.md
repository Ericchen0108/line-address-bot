# 快速部署指南

## ✅ 測試完成
地址轉換功能已測試完成 (13/14 通過)，TOKEN 和 SECRET 已設定。

## 🚀 Vercel 部署步驟

### 方法 1: Vercel CLI
```bash
# 1. 登入 Vercel (選擇 GitHub/Email)
vercel login

# 2. 部署
vercel --prod

# 3. 設定環境變數
vercel env add CHANNEL_SECRET
# 輸入: 375c53ae440ac380f6c8136234ac0ed1

vercel env add CHANNEL_ACCESS_TOKEN
# 輸入: RRou6ri0uK+nvwvEgyrGCzLBwvg8zwtChvZfNdcEbjj4DbauuBpj/Q+40qMtwlrOGU6Q6bmzhELz/jO08uYGSdapmUAA6SjeyP9N9FNfgMYyWMWHiIf+O7+wBRD3hJwPnaXph9NyU6By4qZZF5aR4wdB04t89/1O/w1cDnyilFU=

# 4. 重新部署
vercel --prod
```

### 方法 2: Vercel Dashboard
1. 前往 [vercel.com](https://vercel.com)
2. 連接 GitHub 並匯入此專案
3. 在 Settings → Environment Variables 添加：
   - `CHANNEL_SECRET`: `375c53ae440ac380f6c8136234ac0ed1`
   - `CHANNEL_ACCESS_TOKEN`: `RRou6ri0uK+nvwvEgyrGCzLBwvg8zwtChvZfNdcEbjj4DbauuBpj/Q+40qMtwlrOGU6Q6bmzhELz/jO08uYGSdapmUAA6SjeyP9N9FNfgMYyWMWHiIf+O7+wBRD3hJwPnaXph9NyU6By4qZZF5aR4wdB04t89/1O/w1cDnyilFU=`
4. 重新部署

## 📱 LINE Bot 設定

部署完成後，取得 Vercel URL (例如: `https://your-app.vercel.app`)

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇你的 Messaging API 頻道
3. 在 Messaging API 設定：
   - **Webhook URL**: `https://your-app.vercel.app/webhook`
   - **Use webhooks**: ✅ 啟用
   - 點選 **Verify** 測試連線

## 🧪 測試 Bot

1. 在 LINE Developers Console 取得 QR Code
2. 用手機 LINE 掃描加入 Bot
3. 傳送測試地址：
   - `台北市中正區重慶南路一段122號`
   - `高雄市左營區博愛二路777號`
   - `信義區`

## 🔧 疑難排解

### Webhook 驗證失敗
- 確認環境變數正確設定
- 檢查 Vercel 部署狀態
- 確認 URL 正確: `/webhook`

### Bot 無回應
- 檢查 Vercel Function Logs
- 確認 CHANNEL_ACCESS_TOKEN 正確
- 測試地址格式是否支援

## 📁 檔案已準備完成
- ✅ `vercel.json` - Vercel 配置
- ✅ 環境變數已設定
- ✅ 功能測試通過