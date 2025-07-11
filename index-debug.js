import express from 'express'
import { Client } from '@line/bot-sdk'
import dotenv from 'dotenv'
import addressService from './addressService.js'

dotenv.config()

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
}

const client = new Client(config)
const app = express()
const PORT = 3001

// Enable JSON parsing
app.use(express.json())

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LINE Address Bot (DEBUG MODE) is running!', 
    timestamp: new Date().toISOString(),
    env: {
      hasChannelSecret: !!process.env.CHANNEL_SECRET,
      hasChannelAccessToken: !!process.env.CHANNEL_ACCESS_TOKEN
    }
  })
})

// Debug webhook endpoint without signature validation
app.post('/webhook', async (req, res) => {
  console.log('🔍 Received webhook request (DEBUG MODE):')
  console.log('Headers:', req.headers)
  console.log('Body:', JSON.stringify(req.body, null, 2))
  
  try {
    const events = req.body.events
    if (!events || events.length === 0) {
      console.log('⚠️  No events in request')
      return res.status(200).json({ message: 'No events' })
    }

    console.log(`📝 Processing ${events.length} event(s)...`)
    const results = []
    
    for (const event of events) {
      console.log(`🎯 Processing event type: ${event.type}`)
      const result = await handleEvent(event)
      results.push(result)
    }
    
    console.log('✅ All events processed successfully')
    console.log('Results:', results)
    res.json({ success: true, results })
    
  } catch (err) {
    console.error('❌ Error handling webhook:', err)
    res.status(500).json({ error: err.message })
  }
})

// Test endpoint for direct address translation
app.post('/test-translate', async (req, res) => {
  const { address } = req.body
  console.log(`🔍 Testing address translation: "${address}"`)
  
  try {
    const result = await translateAddress(address)
    console.log(`✅ Translation result: "${result}"`)
    res.json({ input: address, output: result })
  } catch (error) {
    console.error(`❌ Translation error:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Event handler
async function handleEvent(event) {
  console.log(`📨 Event details:`, {
    type: event.type,
    messageType: event.message?.type,
    text: event.message?.text,
    replyToken: event.replyToken
  })
  
  if (event.type !== 'message' || event.message.type !== 'text') {
    console.log('⏭️  Skipping non-text message event')
    return Promise.resolve(null)
  }

  const userMessage = event.message.text
  console.log(`💬 User message: "${userMessage}"`)
  
  try {
    const englishAddress = await translateAddress(userMessage)
    console.log(`🌐 Translated address: "${englishAddress}"`)
    
    const echo = { 
      type: 'text', 
      text: englishAddress || '無法轉換此地址，請確認地址格式是否正確' 
    }
    
    console.log(`📤 Sending reply:`, echo)
    
    // In debug mode, we won't actually send to LINE
    console.log('🚧 DEBUG MODE: Would send reply via LINE Bot API')
    return { message: 'Reply sent (DEBUG MODE)', echo }
    
  } catch (error) {
    console.error('❌ Translation error:', error)
    const errorMessage = { 
      type: 'text', 
      text: '地址轉換服務暫時無法使用，請稍後再試' 
    }
    console.log('📤 Sending error reply:', errorMessage)
    return { error: error.message, errorMessage }
  }
}

// Address translation function
async function translateAddress(chineseAddress) {
  console.log(`🔄 Starting translation for: "${chineseAddress}"`)
  try {
    const englishAddress = await addressService.translateAddress(chineseAddress)
    console.log(`✅ Translation completed: "${englishAddress}"`)
    return englishAddress
  } catch (error) {
    console.error('❌ Translation service error:', error.message)
    throw error
  }
}

app.listen(PORT, () => {
  console.log(`🚀 LINE Address Bot (DEBUG MODE) running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}`)
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/webhook`)
  console.log(`🧪 Test translate: http://localhost:${PORT}/test-translate`)
  console.log(`🔑 Channel Secret: ${config.channelSecret ? '✅ Set' : '❌ Missing'}`)
  console.log(`🔑 Access Token: ${config.channelAccessToken ? '✅ Set' : '❌ Missing'}`)
  console.log(`\n🚧 DEBUG MODE: Signature validation disabled`)
})