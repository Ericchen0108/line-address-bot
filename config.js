import dotenv from 'dotenv'
import path from 'path'

// Load environment-specific .env file
const env = process.env.NODE_ENV || 'development'
const envFile = `.env.${env}`

dotenv.config({ path: envFile })

// Fallback to default .env if specific env file doesn't exist
if (!process.env.CHANNEL_SECRET) {
  dotenv.config()
}

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  
  // LINE Bot
  line: {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
  },
  
  // Database
  database: {
    path: process.env.DB_PATH || './address.db'
  },
  
  // API
  api: {
    url: process.env.API_URL || 'https://tools.yeecord.com/address-to-english.json'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // Development specific settings
  isDevelopment: () => config.env === 'development',
  isProduction: () => config.env === 'production',
  isTest: () => config.env === 'test'
}

// Validation
if (!config.line.channelSecret && !config.isTest()) {
  console.warn('⚠️ CHANNEL_SECRET is not set')
}

if (!config.line.channelAccessToken && !config.isTest()) {
  console.warn('⚠️ CHANNEL_ACCESS_TOKEN is not set')
}

export default config