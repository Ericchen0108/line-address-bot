# LINE Bot 地址轉換機器人

將中文地址轉換為英文地址的 LINE Bot，使用 SQLite 資料庫提供快速、精確的地址轉換服務。

## 功能特色

- 🏠 支援台灣各縣市地址轉換 (371 個縣市, 8529 個村里, 30030 條道路)
- 🗄️ SQLite 本地資料庫，提供極快查詢速度 (< 0.1ms)
- 🔄 智能處理繁簡體字差異 (台/臺)
- 📍 郵遞區號自動對應
- 🛣️ 智能混合翻譯：資料庫查詢+性能優化硬編碼
- 🏗️ 標準台灣地址格式輸出
- 🌍 開發/生產環境分離
- 🧪 完整測試覆蓋 (100% 通過率)
- ❌ 完整錯誤處理

## 技術架構

- **後端**: Node.js + Express
- **資料庫**: SQLite (本地儲存)
- **LINE SDK**: @line/bot-sdk
- **部署**: Railway

## 安裝步驟

1. **克隆專案**

   ```bash
   git clone https://github.com/your-username/line-address-bot.git
   cd line-address-bot
   ```

2. **安裝依賴**

   ```bash
   npm install
   ```

3. **設定環境變數**

   ```bash
   cp .env.development .env
   ```

   編輯 `.env` 檔案：

   ```
   NODE_ENV=development
   CHANNEL_SECRET=你的_LINE_頻道密鑰
   CHANNEL_ACCESS_TOKEN=你的_LINE_頻道存取權杖
   PORT=8080
   DB_PATH=./address-dev.db
   LOG_LEVEL=debug
   ```

4. **取得 LINE Bot 憑證**
   - 前往 [LINE Developers Console](https://developers.line.biz/)
   - 建立新的 Provider 和 Messaging API 頻道
   - 複製 Channel Secret 和 Channel Access Token

## 本地開發

1. **啟動開發伺服器**

   ```bash
   # 開發模式 (with nodemon)
   npm run dev

   # 生產模式
   npm run start:prod

   # 一般啟動
   npm start
   ```

2. **執行完整測試**

   ```bash
   # 測試環境
   npm test

   # 開發環境測試
   npm run test:dev
   ```

   測試涵蓋：

   - 資料庫初始化 (371 縣市, 8529 村里, 30030 道路)
   - 地址轉換準確性 (16 項複雜地址)
   - 智能混合翻譯系統
   - 台灣標準地址格式
   - 階層式地址解析 (街/巷/弄/樓/室)
   - 邊界條件處理
   - 效能測試 (< 0.1ms/翻譯)

## 資料庫架構

首次啟動時，系統會自動：

1. 建立 SQLite 資料庫 (`address.db`)
2. 從 API 獲取最新台灣地址數據
3. 建立索引以提升查詢效能

**資料表結構：**

- `counties` - 371 筆縣市資料 (郵遞區號、中英文名稱)
- `villages` - 8529 筆村里資料 (中英文名稱)
- `roads` - 30030 筆道路資料 (中英文道路名稱)

## 部署到 Railway

Railway 提供簡單快速的部署體驗，適合 Node.js 應用：

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入並部署
railway login
railway link
railway up

# 設定生產環境變數
railway variables set NODE_ENV=production
railway variables set CHANNEL_SECRET=你的生產密鑰
railway variables set CHANNEL_ACCESS_TOKEN=你的生產權杖
railway variables set LOG_LEVEL=info
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

**輸入**: `台北市中正區重慶南路一段122號`  
**輸出**: `No. 122, Sec. 1, Chongqing S. Rd., Zhongzheng Dist., Taipei City 100, Taiwan (R.O.C.)`

**輸入**: `高雄市左營區博愛二路777號`  
**輸出**: `No. 777, Bo'ai 2nd Rd., Zuoying Dist., Kaohsiung City 813, Taiwan (R.O.C.)`

**支援地址格式：**

- 階層式地址 (街/巷/弄/樓/室)
- 標準台灣地址格式輸出
- 智能混合翻譯系統
- 自動處理繁簡體差異 (台/臺)
- 原住民部落地址翻譯

## 測試結果

```
📊 TEST RESULTS
✅ Passed: 25/25
❌ Failed: 0/25
📈 Success Rate: 100.0%

🎉 All tests passed! The LINE Address Bot is working correctly.
```

## 效能指標

- **平均翻譯時間**: < 0.1ms per translation
- **資料庫查詢**: SQLite 本地查詢，極快響應
- **記憶體使用**: 低記憶體佔用
- **離線運作**: 不依賴外部 API

## 專案結構

```
├── index.js              # 主程式 (LINE Bot webhook)
├── addressServiceDB.js   # 資料庫版地址轉換服務
├── database.js          # SQLite 資料庫管理
├── config.js            # 環境配置管理
├── test.js              # 完整測試套件 (25項測試)
├── address.db           # 生產環境資料庫
├── package.json         # 專案設定與腳本
├── railway.toml         # Railway 部署設定
├── Procfile             # Railway 啟動設定
├── .env.development     # 開發環境變數
├── .env.production      # 生產環境變數
└── .gitignore           # Git 忽略檔案
```

## API 資料來源

- **地址資料來源**: https://tools.yeecord.com/address-to-english.json
- **資料完整性**: 371 個縣市 + 8529 個村里 + 30030 條道路
- **自動更新**: 首次啟動時自動從 API 獲取最新資料
- **資料庫快取**: 本地 SQLite 儲存，無需重複 API 呼叫

## 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權條款

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 聯絡資訊

如有問題或建議，請開啟 [Issue](https://github.com/your-username/line-address-bot/issues)

---

**🤖 Generated with Claude Code**
