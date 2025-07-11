# 📋 LINE Bot 部署 TODO List

## ✅ 已完成
- [x] LINE Bot 程式碼開發
- [x] 地址轉換功能實現
- [x] 本地測試通過 (13/14 成功)
- [x] 環境變數設定
- [x] 清理不必要檔案

## 🚀 接下來要做的步驟

### 1. 建立 GitHub Repository
- [ ] 前往 [GitHub.com](https://github.com)
- [ ] 點選右上角 "+" → "New repository"
- [ ] Repository name: `line-address-bot`
- [ ] 描述: `LINE Bot for Chinese to English address translation`
- [ ] 選擇 **Public**
- [ ] **不要** 勾選 "Add a README file" (我們已經有了)
- [ ] 點選 "Create repository"

### 2. 連接本地專案到 GitHub
```bash
git remote add origin https://github.com/你的GitHub用戶名/line-address-bot.git
git branch -M main
git add .
git commit -m "Initial commit: LINE Address Translation Bot"
git push -u origin main
```

### 3. 部署到 Railway
- [ ] 前往 [railway.app](https://railway.app)
- [ ] 點選 "Start a New Project"
- [ ] 選擇 "Deploy from GitHub repo"
- [ ] 如果需要，點選 "Configure GitHub App" 授權 Railway
- [ ] 選擇 `line-address-bot` repository
- [ ] 點選 "Deploy Now"

### 4. 設定 Railway 環境變數
部署完成後：
- [ ] 點選你的專案進入儀表板
- [ ] 點選 "Variables" 標籤
- [ ] 點選 "New Variable" 添加：
  ```
  CHANNEL_SECRET
  375c53ae440ac380f6c8136234ac0ed1
  ```
- [ ] 再次點選 "New Variable" 添加：
  ```
  CHANNEL_ACCESS_TOKEN
  RRou6ri0uK+nvwvEgyrGCzLBwvg8zwtChvZfNdcEbjj4DbauuBpj/Q+40qMtwlrOGU6Q6bmzhELz/jO08uYGSdapmUAA6SjeyP9N9FNfgMYyWMWHiIf+O7+wBRD3hJwPnaXph9NryU6By4qZZF5aR4wdB04t89/1O/w1cDnyilFU=
  ```

### 5. 確認部署成功
- [ ] 等待重新部署完成 (約1-2分鐘)
- [ ] 點選 "Deployments" 確認狀態為 "Success"
- [ ] 點選 "Settings" → "Domains" 取得你的網址
- [ ] 測試 API：在瀏覽器打開 `https://你的railway網址/`
- [ ] 應該看到 JSON 回應：`{"message":"LINE Address Bot is running!"...}`

### 6. 設定 LINE Webhook
- [ ] 前往 [LINE Developers Console](https://developers.line.biz/)
- [ ] 選擇你的 Messaging API 頻道
- [ ] 點選 "Messaging API" 標籤
- [ ] 在 "Webhook settings" 部分：
  - [ ] Webhook URL: `https://你的railway網址/webhook`
  - [ ] 啟用 "Use webhook"
  - [ ] 點選 "Verify" 按鈕測試連線
  - [ ] 應該顯示 "Success"

### 7. 測試 LINE Bot
- [ ] 在 LINE Developers Console 找到 QR Code
- [ ] 用手機 LINE 掃描 QR Code 加入 Bot
- [ ] 傳送測試訊息：
  - [ ] `台北市中正區重慶南路一段122號`
  - [ ] `高雄市左營區博愛二路777號`  
  - [ ] `信義區`
- [ ] 確認 Bot 回覆正確的英文地址

## 🎯 完成標準
- [ ] Bot 能正確回覆地址轉換
- [ ] 無錯誤訊息
- [ ] Railway 部署狀態正常

---

**開始第一步：建立 GitHub Repository！** 🚀