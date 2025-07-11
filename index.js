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
const PORT = process.env.PORT || 3000

// LINE webhook endpoint
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
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
  console.log(`Server running on port ${PORT}`)
})