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
      
      // Step 3.5: Translate road name using database
      if (streetInfo && streetInfo.roadName) {
        // Try to find complete road name with section first (keep original Chinese format)
        const fullRoadName = streetInfo.roadName + '路' + (streetInfo.section ? this.arabicToChineseNumber(streetInfo.section.replace('Sec. ', '')) + '段' : '')
        const roadMatch = await database.findRoadMatch(fullRoadName)
        
        if (roadMatch) {
          // Use the database result and remove the road type from it
          const englishName = roadMatch.english.replace(/\s(Rd\.|St\.|Ln\.|Aly\.|Blvd\.)$/, '').trim()
          // Parse the English name to separate components
          const englishParts = englishName.split(', ')
          if (englishParts.length > 1 && englishParts[0].startsWith('Sec.')) {
            streetInfo.section = englishParts[0]
            streetInfo.roadName = englishParts[1]
          } else {
            streetInfo.roadName = englishName
          }
        } else {
          // Fallback to manual translation
          streetInfo.roadName = await this.translateRoadName(streetInfo.roadName)
        }
      }
      
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
      components.roadName = roadTypeMatch[1]
      components.roadType = this.translateRoadType(roadTypeMatch[2])
    } else {
      // If no road type found, treat the remaining as road name
      components.roadName = remaining.trim()
    }
    
    return components
  }

  async translateRoadName(chineseName) {
    // First try to find exact match in database
    const roadMatch = await database.findRoadMatch(chineseName)
    if (roadMatch) {
      return roadMatch.english.replace(/\s(Rd\.|St\.|Ln\.|Aly\.|Blvd\.)$/, '').trim()
    }
    
    // If no exact match, handle directional suffixes manually
    let result = chineseName
    
    // Convert directional indicators to English
    result = result.replace(/南$/, ' S.')
    result = result.replace(/北$/, ' N.')
    result = result.replace(/東$/, ' E.')
    result = result.replace(/西$/, ' W.')
    
    return result.trim()
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

  arabicToChineseNumber(arabicNum) {
    const numMap = {
      '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
      '6': '六', '7': '七', '8': '八', '9': '九', '10': '十'
    }
    
    return numMap[arabicNum] || arabicNum
  }

  constructFinalAddress(streetInfo, countyMatch) {
    const parts = []
    
    // Taiwan standard format: No. X, Sec. Y, Road Name, District, City Postal Code, Taiwan (R.O.C.)
    
    if (streetInfo) {
      // Build address components in correct order
      const addressComponents = []
      
      // 1. Building number first
      if (streetInfo.number) {
        addressComponents.push(streetInfo.number)
      }
      
      // 2. Floor information 
      if (streetInfo.floor) {
        addressComponents.push(streetInfo.floor)
      }
      
      // 3. Section
      if (streetInfo.section) {
        addressComponents.push(streetInfo.section)
      }
      
      // 4. Road name and type
      if (streetInfo.roadName && streetInfo.roadType) {
        addressComponents.push(`${streetInfo.roadName} ${streetInfo.roadType}`)
      } else if (streetInfo.roadName) {
        addressComponents.push(streetInfo.roadName)
      }
      
      if (addressComponents.length > 0) {
        parts.push(addressComponents.join(', '))
      }
    }
    
    // Add district and city
    if (countyMatch) {
      parts.push(countyMatch.english)
      
      // Add postal code without comma
      if (countyMatch.zipCode) {
        // Combine last part with postal code
        if (parts.length > 0) {
          const lastPart = parts.pop()
          parts.push(`${lastPart} ${countyMatch.zipCode}`)
        } else {
          parts.push(countyMatch.zipCode)
        }
      }
    }
    
    // Add Taiwan (R.O.C.) at the end
    parts.push('Taiwan (R.O.C.)')
    
    return parts.filter(part => part && part.trim()).join(', ')
  }

  async getStats() {
    await this.init()
    return await database.getStats()
  }

}

export default new AddressService()