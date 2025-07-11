# LINE Bot 地址轉換機器人

將中文地址轉換為英文地址的 LINE Bot，使用台灣地址資料庫API。

## 功能特色

- 🏠 支援台灣各縣市地址轉換
- 🔄 智能處理繁簡體字差異
- 📍 郵遞區號自動對應
- 🚀 快取機制提升效能
- ❌ 完整錯誤處理

## 安裝步驟

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **設定環境變數**
   ```bash
   cp .env.example .env
   ```
   
   編輯 `.env` 檔案：
   ```
   CHANNEL_SECRET=你的_LINE_頻道密鑰
   CHANNEL_ACCESS_TOKEN=你的_LINE_頻道存取權杖
   PORT=3000
   ```

3. **取得 LINE Bot 憑證**
   - 前往 [LINE Developers Console](https://developers.line.biz/)
   - 建立新的 Provider 和 Messaging API 頻道
   - 複製 Channel Secret 和 Channel Access Token

## 本地測試

1. **啟動伺服器**
   ```bash
   npm start
   # 或開發模式
   npm run dev
   ```

2. **測試地址轉換功能**
   ```bash
   node test.js
   ```

## 部署選項

### 1. Railway (推薦)
```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入並部署
railway login
railway link
railway up
```

### 2. Heroku
```bash
# 安裝 Heroku CLI
heroku create your-linebot-name
heroku config:set CHANNEL_SECRET=你的密鑰
heroku config:set CHANNEL_ACCESS_TOKEN=你的權杖
git push heroku main
```

### 3. Vercel
```bash
npm install -g vercel
vercel --prod
```

## LINE Bot 設定

1. 在 LINE Developers Console 中設定 Webhook URL
   ```
   https://你的域名.com/webhook
   ```

2. 啟用 "Use webhooks" 選項

3. 測試 webhook 連線

## 使用範例

傳送以下地址給 Bot：
- `台北市中正區重慶南路一段122號`
- `高雄市左營區博愛二路777號`
- `中正區重慶南路`
- `信義區`

Bot 會回覆對應的英文地址格式。

## API 來源

- 地址資料來源：https://tools.yeecord.com/address-to-english.json
- 包含台灣各縣市區域和村里資料

## 專案結構

```
├── index.js          # 主程式 (LINE Bot webhook)
├── addressService.js # 地址轉換服務
├── test.js          # 測試程式
├── package.json     # 專案設定
└── .env.example     # 環境變數範例
```