import express from 'express'
import { middleware, Client } from '@line/bot-sdk'
import dotenv from 'dotenv'
import addressService from './addressService.js'

dotenv.config()

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
}

const client = new Client(config)
const app = express()
const PORT = process.env.PORT || 8080

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LINE Address Bot is running!', 
    timestamp: new Date().toISOString(),
    env: {
      hasChannelSecret: !!process.env.CHANNEL_SECRET,
      hasChannelAccessToken: !!process.env.CHANNEL_ACCESS_TOKEN
    }
  })
})

// LINE webhook endpoint
app.post('/webhook', middleware(config), (req, res) => {
  console.log('Received webhook request:', req.body)
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => {
      console.log('Handler results:', result)
      res.json(result)
    })
    .catch((err) => {
      console.error('Error handling events:', err)
      res.status(500).end()
    })
})

// Event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  const userMessage = event.message.text
  
  try {
    const englishAddress = await translateAddress(userMessage)
    
    const echo = { 
      type: 'text', 
      text: englishAddress || '無法轉換此地址，請確認地址格式是否正確' 
    }
    
    return client.replyMessage(event.replyToken, echo)
  } catch (error) {
    console.error('Translation error:', error)
    const errorMessage = { 
      type: 'text', 
      text: '地址轉換服務暫時無法使用，請稍後再試' 
    }
    return client.replyMessage(event.replyToken, errorMessage)
  }
}

// Address translation function
async function translateAddress(chineseAddress) {
  try {
    const englishAddress = await addressService.translateAddress(chineseAddress)
    return englishAddress
  } catch (error) {
    console.error('Translation service error:', error.message)
    throw error
  }
}

app.listen(PORT, () => {
  console.log(`🚀 LINE Address Bot server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}`)
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/webhook`)
  console.log(`🔑 Channel Secret: ${config.channelSecret ? '✅ Set' : '❌ Missing'}`)
  console.log(`🔑 Access Token: ${config.channelAccessToken ? '✅ Set' : '❌ Missing'}`)
})

