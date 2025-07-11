# 🔧 修復 Vercel 驗證保護問題

## 目前狀況
- ✅ 程式碼完全正常 (本地測試通過)
- ✅ 部署成功
- ❌ Vercel 啟用了驗證保護，阻止外部訪問

## 解決步驟

### 🔍 步驟 1: 找到正確的設定位置

1. **前往 Vercel Dashboard**
   - 打開 [vercel.com/dashboard](https://vercel.com/dashboard)
   - 選擇 `address` 專案

2. **查找驗證設定** (可能在以下位置之一)：
   
   **選項 A: Settings → Security**
   - 點選 "Settings" 標籤
   - 找到 "Security" 或 "Protection" 部分
   - 關閉所有保護選項
   
   **選項 B: Settings → Functions**
   - 查看是否有 Authentication 相關設定
   
   **選項 C: Settings → General**
   - 查看是否有訪問控制設定

### 🎯 步驟 2: 關閉以下選項 (如果存在)
- ❌ **Password Protection**
- ❌ **Vercel Authentication** 
- ❌ **SSO Protection**
- ❌ **Team-only Access**
- ❌ **Private Deployment**

### 🔄 步驟 3: 儲存並重新部署
關閉設定後，重新部署：
```bash
vercel --prod --yes
```

### 🧪 步驟 4: 測試訪問
```bash
curl https://你的vercel網址/
```
應該看到 JSON 回應而不是驗證頁面

## 🚨 如果找不到設定

### 方案 A: 建立新專案
1. 在 Vercel 建立全新專案
2. 確保不啟用任何保護
3. 重新部署

### 方案 B: 使用 Railway (推薦)
```bash
npm install -g @railway/cli
railway login
railway up
```

## 📱 部署成功後的 LINE 設定

新的 Webhook URL：
```
https://你的vercel網址/webhook
```

在 LINE Developers Console 設定此 URL 並啟用 webhooks。

## 🎯 目標
讓這個測試成功：
```bash
curl https://你的vercel網址/
# 應該回應: {"message":"LINE Address Bot is running!"}
```