import express from 'express'
import { middleware, Client } from '@line/bot-sdk'
import config from './config.js'
import addressService from './addressServiceDB.js'

const lineConfig = {
  channelSecret: config.line.channelSecret,
  channelAccessToken: config.line.channelAccessToken
}

const client = new Client(lineConfig)
const app = express()

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LINE Address Bot is running!', 
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
    env: {
      hasChannelSecret: !!config.line.channelSecret,
      hasChannelAccessToken: !!config.line.channelAccessToken
    }
  })
})

// LINE webhook endpoint
app.post('/webhook', middleware(lineConfig), (req, res) => {
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

app.listen(config.port, () => {
  console.log(`🚀 LINE Address Bot server running on port ${config.port}`)
  console.log(`🌍 Environment: ${config.env}`)
  console.log(`📍 Health check: http://localhost:${config.port}`)
  console.log(`📱 Webhook endpoint: http://localhost:${config.port}/webhook`)
  console.log(`🗄️ Database: ${config.database.path}`)
  console.log(`🔑 Channel Secret: ${config.line.channelSecret ? '✅ Set' : '❌ Missing'}`)
  console.log(`🔑 Access Token: ${config.line.channelAccessToken ? '✅ Set' : '❌ Missing'}`)
})

