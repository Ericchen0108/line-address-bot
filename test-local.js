import axios from 'axios'
import { createHmac } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const baseURL = 'http://localhost:3000'
const channelSecret = process.env.CHANNEL_SECRET

// 創建 LINE signature
function createSignature(body, secret) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('base64')
}

// 模擬 LINE webhook 事件
const testEvent = {
  destination: "test",
  events: [
    {
      type: "message",
      message: {
        type: "text",
        id: "test_message_id",
        text: "台北市中正區重慶南路一段122號"
      },
      replyToken: "test_reply_token",
      source: {
        type: "user",
        userId: "test_user_id"
      },
      timestamp: Date.now(),
      mode: "active"
    }
  ]
}

async function testLocalBot() {
  console.log('🧪 Testing local LINE Bot...\n')
  
  try {
    // 1. Test health check
    console.log('1. Testing health check...')
    const healthResponse = await axios.get(baseURL)
    console.log('✅ Health check:', healthResponse.data)
    
    // 2. Test webhook without signature (should fail)
    console.log('\n2. Testing webhook without signature...')
    try {
      await axios.post(`${baseURL}/webhook`, testEvent)
    } catch (error) {
      console.log('✅ Expected error (no signature):', error.response?.status, error.response?.statusText)
    }
    
    // 3. Test webhook with signature
    console.log('\n3. Testing webhook with valid signature...')
    const body = JSON.stringify(testEvent)
    const signature = createSignature(body, channelSecret)
    
    const webhookResponse = await axios.post(`${baseURL}/webhook`, testEvent, {
      headers: {
        'Content-Type': 'application/json',
        'X-Line-Signature': signature
      }
    })
    
    console.log('✅ Webhook response:', webhookResponse.data)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
  }
}

testLocalBot()