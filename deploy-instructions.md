# 🚀 現在開始部署！

## 專案已準備完成
✅ Git repository 已初始化  
✅ 所有檔案已提交  
✅ Vercel 配置已設定  
✅ 功能測試通過 (13/14)

## 部署選項

### 選項 1: Vercel Dashboard (推薦)
1. 前往 [vercel.com](https://vercel.com) 並登入
2. 點選 "Add New..." → "Project"
3. 選擇 "Import Git Repository"
4. 上傳此專案資料夾或連接 GitHub
5. 在專案設定中添加環境變數：
   ```
   CHANNEL_SECRET=375c53ae440ac380f6c8136234ac0ed1
   CHANNEL_ACCESS_TOKEN=RRou6ri0uK+nvwvEgyrGCzLBwvg8zwtChvZfNdcEbjj4DbauuBpj/Q+40qMtwlrOGU6Q6bmzhELz/jO08uYGSdapmUAA6SjeyP9N9FNfgMYyWMWHiIf+O7+wBRD3hJwPnaXph9NyU6By4qZZF5aR4wdB04t89/1O/w1cDnyilFU=
   ```
6. 點選 "Deploy"

### 選項 2: Vercel CLI
```bash
# 1. 手動登入 Vercel
vercel login
# 選擇登入方式 (GitHub/Email 等)

# 2. 部署專案
vercel --prod

# 3. 設定環境變數
vercel env add CHANNEL_SECRET
vercel env add CHANNEL_ACCESS_TOKEN

# 4. 重新部署
vercel --prod
```

### 選項 3: GitHub + Vercel 自動部署
1. 建立 GitHub repository
2. 推送程式碼到 GitHub
3. 在 Vercel 連接 GitHub repository
4. 設定環境變數並部署

## 📱 部署後設定 LINE Webhook

部署完成後會取得 URL，例如：`https://your-project.vercel.app`

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇你的 Messaging API 頻道
3. 設定 Webhook URL: `https://your-project.vercel.app/webhook`
4. 啟用 "Use webhooks"
5. 點選 "Verify" 測試連線

## 🧪 測試 Bot
1. 在 LINE Developers Console 取得 QR Code
2. 掃描加入 Bot
3. 傳送地址測試，例如：`台北市中正區重慶南路一段122號`

## ⚡ 快速啟動
如果你已經熟悉 Vercel，直接執行：
```bash
vercel login
vercel --prod
```

然後設定環境變數即可！