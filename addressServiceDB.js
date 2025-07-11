import database from './database.js'

class AddressService {
  constructor() {
    this.isInitialized = false
  }

  async init() {
    if (!this.isInitialized) {
      await database.init()
      this.isInitialized = true
      console.log('AddressService initialized with SQLite database')
    }
  }

  async translateAddress(chineseAddress) {
    try {
      // Ensure database is initialized
      await this.init()
      
      // Clean input
      const cleanAddress = chineseAddress.trim()
      console.log('Translating address:', cleanAddress)
      
      // Step 1: Find the county/district match using database
      const countyMatch = await database.findBestCountyMatch(cleanAddress)
      if (!countyMatch) {
        console.log('No county match found for:', cleanAddress)
        return null
      }
      
      console.log('Found county match:', countyMatch)
      
      // Step 2: Remove county part and parse the remaining street address
      let remainingAddress = cleanAddress.replace(countyMatch.chinese, '').trim()
      if (remainingAddress === cleanAddress) {
        // Try with normalized version
        const normalizedCounty = countyMatch.chinese.replace(/臺/g, '台')
        remainingAddress = cleanAddress.replace(normalizedCounty, '').trim()
      }
      console.log('Remaining address after county removal:', remainingAddress)
      
      // Step 3: Parse the street address using proper street name database
      const streetInfo = this.parseStreetAddress(remainingAddress)
      console.log('Parsed street info:', streetInfo)
      
      // Step 4: Construct final English address
      const englishAddress = this.constructFinalAddress(streetInfo, countyMatch)
      console.log('Final English address:', englishAddress)
      
      return englishAddress
      
    } catch (error) {
      console.error('Address translation error:', error.message)
      throw error
    }
  }

  parseStreetAddress(streetAddress) {
    if (!streetAddress) return null
    
    // Parse street components: road name, section, number, etc.
    const components = {
      roadName: '',
      roadType: '',
      section: '',
      number: '',
      floor: '',
      original: streetAddress
    }
    
    let remaining = streetAddress
    
    // Extract floor number (樓)
    const floorMatch = remaining.match(/(\d+)樓/)
    if (floorMatch) {
      components.floor = floorMatch[1] + 'F'
      remaining = remaining.replace(floorMatch[0], '')
    }
    
    // Extract building number (號)
    const numberMatch = remaining.match(/(\d+)號/)
    if (numberMatch) {
      components.number = 'No. ' + numberMatch[1]
      remaining = remaining.replace(numberMatch[0], '')
    }
    
    // Extract section (段)
    const sectionMatch = remaining.match(/(一|二|三|四|五|六|七|八|九|十|\d+)段/)
    if (sectionMatch) {
      const sectionNum = this.chineseNumberToArabic(sectionMatch[1])
      components.section = 'Sec. ' + sectionNum
      remaining = remaining.replace(sectionMatch[0], '')
    }
    
    // Extract road type and name
    const roadTypeMatch = remaining.match(/(.+?)(路|街|巷|弄|大道)$/)
    if (roadTypeMatch) {
      components.roadName = this.translateRoadName(roadTypeMatch[1])
      components.roadType = this.translateRoadType(roadTypeMatch[2])
    } else {
      // If no road type found, treat the remaining as road name
      components.roadName = this.translateRoadName(remaining.trim())
    }
    
    return components
  }

  translateRoadName(chineseName) {
    // Common road name translations
    const translations = {
      '重慶': 'Chongqing',
      '中山': 'Zhongshan',
      '復興': 'Fuxing',
      '忠孝': 'Zhongxiao',
      '仁愛': 'Renai',
      '信義': 'Xinyi',
      '民族': 'Minzu',
      '中華': 'Zhonghua',
      '博愛': 'Boai',
      '和平': 'Heping',
      '敦化': 'Dunhua',
      '建國': 'Jianguo',
      '羅斯福': 'Roosevelt',
      '中正': 'Zhongzheng',
      '民生': 'Minsheng',
      '南京': 'Nanjing',
      '松江': 'Songjiang',
      '長安': "Chang'an",
      '台灣': 'Taiwan'
    }
    
    // Handle directional indicators
    for (const [chinese, english] of Object.entries(translations)) {
      if (chineseName.includes(chinese)) {
        let result = chineseName.replace(chinese, english)
        
        // Handle directional suffixes
        result = result.replace(/南$/, ' S.')
        result = result.replace(/北$/, ' N.')
        result = result.replace(/東$/, ' E.')
        result = result.replace(/西$/, ' W.')
        
        return result.trim()
      }
    }
    
    // If no translation found, return romanized version
    return chineseName
  }

  translateRoadType(chineseType) {
    const typeMap = {
      '路': 'Rd.',
      '街': 'St.',
      '巷': 'Ln.',
      '弄': 'Aly.',
      '大道': 'Blvd.'
    }
    
    return typeMap[chineseType] || chineseType
  }

  chineseNumberToArabic(chineseNum) {
    const numMap = {
      '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
      '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
    }
    
    return numMap[chineseNum] || chineseNum
  }

  constructFinalAddress(streetInfo, countyMatch) {
    const parts = []
    
    // Add street information in proper order
    if (streetInfo) {
      let streetPart = ''
      
      if (streetInfo.roadName) {
        streetPart += streetInfo.roadName
      }
      
      if (streetInfo.roadType) {
        streetPart += ' ' + streetInfo.roadType
      }
      
      if (streetInfo.section) {
        streetPart += ' ' + streetInfo.section
      }
      
      if (streetInfo.number) {
        streetPart += ' ' + streetInfo.number
      }
      
      if (streetInfo.floor) {
        streetPart += ' ' + streetInfo.floor
      }
      
      if (streetPart.trim()) {
        parts.push(streetPart.trim())
      }
    }
    
    // Add district and city
    if (countyMatch) {
      parts.push(countyMatch.english)
      
      // Add postal code
      if (countyMatch.zipCode) {
        parts.push(countyMatch.zipCode)
      }
    }
    
    return parts.filter(part => part && part.trim()).join(', ')
  }

  async getStats() {
    await this.init()
    return await database.getStats()
  }

  async updateDatabase() {
    await this.init()
    await database.updateFromAPI()
  }
}

export default new AddressService()