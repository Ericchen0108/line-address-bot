import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import axios from 'axios'
import config from './config.js'

class AddressDatabase {
  constructor() {
    this.db = null
    this.dbPath = config.database.path
    this.apiUrl = config.api.url
  }

  async init() {
    try {
      // Open SQLite database
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // Create tables
      await this.createTables()
      
      // Check if data exists, if not, populate from API
      const countyCount = await this.db.get('SELECT COUNT(*) as count FROM counties')
      if (countyCount.count === 0) {
        console.log('Database is empty, populating from API...')
        await this.populateFromAPI()
      } else {
        console.log(`Database already contains ${countyCount.count} counties`)
      }

      console.log('Address database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  async createTables() {
    // Create counties table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS counties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zip_code TEXT NOT NULL,
        chinese_name TEXT NOT NULL,
        english_name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create villages table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS villages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chinese_name TEXT NOT NULL,
        english_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create roads table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS roads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chinese_name TEXT NOT NULL,
        english_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_counties_normalized ON counties(normalized_name)
    `)
    
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_counties_chinese ON counties(chinese_name)
    `)
    
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_villages_chinese ON villages(chinese_name)
    `)
    
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_roads_chinese ON roads(chinese_name)
    `)

    console.log('Database tables created successfully')
  }

  async populateFromAPI() {
    try {
      console.log('Fetching data from API...')
      const response = await axios.get(this.apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LINE-Address-Bot/1.0)'
        }
      })

      const data = response.data
      
      if (!data || !data.county || !data.villages || !data.roads) {
        throw new Error('Invalid API response format')
      }

      // Clear existing data
      await this.db.exec('DELETE FROM counties')
      await this.db.exec('DELETE FROM villages')
      await this.db.exec('DELETE FROM roads')

      // Insert counties
      console.log(`Inserting ${data.county.length} counties...`)
      const insertCounty = await this.db.prepare(`
        INSERT INTO counties (zip_code, chinese_name, english_name, normalized_name)
        VALUES (?, ?, ?, ?)
      `)

      for (const county of data.county) {
        const [zipCode, chineseName, englishName] = county
        const normalizedName = chineseName.replace(/臺/g, '台')
        
        await insertCounty.run(zipCode, chineseName, englishName, normalizedName)
      }
      await insertCounty.finalize()

      // Insert villages
      console.log(`Inserting ${data.villages.length} villages...`)
      const insertVillage = await this.db.prepare(`
        INSERT INTO villages (chinese_name, english_name)
        VALUES (?, ?)
      `)

      for (const village of data.villages) {
        const [chineseName, englishName] = village
        await insertVillage.run(chineseName, englishName)
      }
      await insertVillage.finalize()

      // Insert roads
      console.log(`Inserting ${data.roads.length} roads...`)
      const insertRoad = await this.db.prepare(`
        INSERT INTO roads (chinese_name, english_name)
        VALUES (?, ?)
      `)

      for (const road of data.roads) {
        const [chineseName, englishName] = road
        // Skip the header row
        if (chineseName !== '中文街路名稱') {
          await insertRoad.run(chineseName, englishName)
        }
      }
      await insertRoad.finalize()

      console.log('Database populated successfully')
      
      // Log statistics
      const countyCount = await this.db.get('SELECT COUNT(*) as count FROM counties')
      const villageCount = await this.db.get('SELECT COUNT(*) as count FROM villages')
      const roadCount = await this.db.get('SELECT COUNT(*) as count FROM roads')
      console.log(`Database contains: ${countyCount.count} counties, ${villageCount.count} villages, ${roadCount.count} roads`)

    } catch (error) {
      console.error('Failed to populate database from API:', error)
      throw error
    }
  }

  async findBestCountyMatch(address) {
    try {
      const normalizedAddress = address.replace(/臺/g, '台')
      
      // Try exact match first
      const exactMatch = await this.db.get(`
        SELECT zip_code, chinese_name, english_name, LENGTH(chinese_name) as match_length
        FROM counties 
        WHERE ? LIKE '%' || normalized_name || '%'
        ORDER BY LENGTH(chinese_name) DESC
        LIMIT 1
      `, [normalizedAddress])
      
      if (exactMatch) {
        return {
          zipCode: exactMatch.zip_code,
          chinese: exactMatch.chinese_name,
          english: exactMatch.english_name,
          matchLength: exactMatch.match_length
        }
      }

      // Try partial city + district match
      const partialMatches = await this.db.all(`
        SELECT zip_code, chinese_name, english_name, normalized_name
        FROM counties 
        WHERE normalized_name LIKE '%市%'
      `)

      let bestMatch = null
      let maxLength = 0

      for (const county of partialMatches) {
        const normalizedCounty = county.normalized_name
        
        if (normalizedCounty.includes('市')) {
          const parts = normalizedCounty.split('市')
          if (parts.length === 2) {
            const cityPart = parts[0]
            const districtPart = parts[1]
            
            if (normalizedAddress.includes(cityPart + '市') && 
                normalizedAddress.includes(districtPart) &&
                (cityPart.length + districtPart.length) > maxLength) {
              bestMatch = {
                zipCode: county.zip_code,
                chinese: county.chinese_name,
                english: county.english_name,
                matchLength: cityPart.length + districtPart.length
              }
              maxLength = cityPart.length + districtPart.length
            }
          }
        }
      }

      return bestMatch
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }



  async findRoadMatch(roadName) {
    try {
      const road = await this.db.get(`
        SELECT chinese_name, english_name
        FROM roads 
        WHERE chinese_name = ?
        LIMIT 1
      `, [roadName])
      
      if (road) {
        return {
          chinese: road.chinese_name,
          english: road.english_name
        }
      }
      
      return null
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  async getStats() {
    const countyCount = await this.db.get('SELECT COUNT(*) as count FROM counties')
    const villageCount = await this.db.get('SELECT COUNT(*) as count FROM villages')
    const roadCount = await this.db.get('SELECT COUNT(*) as count FROM roads')
    
    return {
      counties: countyCount.count,
      villages: villageCount.count,
      roads: roadCount.count
    }
  }
}

export default new AddressDatabase()