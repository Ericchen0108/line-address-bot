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
      
      // Step 3.1: Handle village translations  
      if (streetInfo && streetInfo.roadName) {
        const villageMatch = await database.findVillageMatch(streetInfo.roadName)
        if (villageMatch) {
          // Extract village and remaining parts
          const villagePart = villageMatch.english
          let remaining = streetInfo.roadName.replace(villageMatch.chinese, '').trim()
          
          // Try to translate remaining part using road database or component-based translation
          if (remaining) {
            let remainingTranslated = await this.translateRoadName(remaining)
            
            // If no direct translation found, try component-based translation
            if (remainingTranslated === remaining) {
              remainingTranslated = await this.translateComponents(remaining)
            }
            
            streetInfo.roadName = `${remainingTranslated}, ${villagePart}`
          } else {
            streetInfo.roadName = villagePart
          }
        }
      }
      
      // Step 3.5: Translate road name using database
      if (streetInfo && streetInfo.roadName && streetInfo.roadType) {
        // Build complete road name with road type and section for database lookup
        const roadTypeMap = { 'Rd.': '路', 'St.': '街', 'Ln.': '巷', 'Aly.': '弄', 'Blvd.': '大道' }
        const chineseRoadType = roadTypeMap[streetInfo.roadType] || streetInfo.roadType
        
        let fullRoadName = streetInfo.roadName + chineseRoadType
        if (streetInfo.section) {
          const sectionNum = streetInfo.section.replace('Sec. ', '')
          const chineseNumMap = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九', '10': '十' }
          const chineseSection = chineseNumMap[sectionNum] || sectionNum
          fullRoadName = streetInfo.roadName + chineseRoadType + chineseSection + '段'
        }
        
        console.log('Looking up road name:', fullRoadName)
        
        // Try to find complete road name in database
        let roadMatch = await database.findRoadMatch(fullRoadName)
        if (!roadMatch) {
          const traditionalRoadName = fullRoadName.replace(/台/g, '臺')
          roadMatch = await database.findRoadMatch(traditionalRoadName)
        }
        
        if (roadMatch) {
          // Use the database result and remove the road type from it
          const englishName = roadMatch.english.replace(/\s(Rd\.|St\.|Ln\.|Aly\.|Blvd\.)$/, '').trim()
          console.log('Found road translation:', englishName)
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
    
    // Parse street components with hierarchical structure
    const components = {
      roadName: '',
      roadType: '',
      section: '',
      laneNumber: '',
      alleyNumber: '',
      number: '',
      floor: '',
      room: '',
      original: streetAddress
    }
    
    let remaining = streetAddress
    
    // Extract room number (室) - handle both "X室" and "之X室"
    const roomMatch = remaining.match(/(之)?(\d+)室/)
    if (roomMatch) {
      components.room = 'Rm. ' + roomMatch[2]
      remaining = remaining.replace(roomMatch[0], '')
    }
    
    // Extract floor number (樓)
    const floorMatch = remaining.match(/(\d+)樓/)
    if (floorMatch) {
      components.floor = floorMatch[1] + 'F.'
      remaining = remaining.replace(floorMatch[0], '')
    }
    
    // Extract building number (號)
    const numberMatch = remaining.match(/(\d+)號/)
    if (numberMatch) {
      components.number = 'No. ' + numberMatch[1]
      remaining = remaining.replace(numberMatch[0], '')
    }
    
    // Extract alley number (弄)
    const alleyMatch = remaining.match(/(\d+)弄/)
    if (alleyMatch) {
      components.alleyNumber = 'Aly. ' + alleyMatch[1]
      remaining = remaining.replace(alleyMatch[0], '')
    }
    
    // Extract lane number (巷)
    const laneMatch = remaining.match(/(\d+)巷/)
    if (laneMatch) {
      components.laneNumber = 'Ln. ' + laneMatch[1]
      remaining = remaining.replace(laneMatch[0], '')
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
    
    // If no direct match, try component-based translation
    return await this.translateComponents(chineseName)
  }

  translateRoadType(chineseType) {
    // Standard road types - hardcoded for performance and reliability
    const typeMap = {
      '路': 'Rd.',
      '街': 'St.',
      '巷': 'Ln.',
      '弄': 'Aly.',
      '大道': 'Blvd.'
    }
    
    return typeMap[chineseType] || chineseType
  }


  async translateComponents(chineseName) {
    // Try direct database lookup first (both simplified and traditional)
    let directMatch = await database.findRoadMatch(chineseName)
    if (!directMatch) {
      const traditionalName = chineseName.replace(/台/g, '臺')
      directMatch = await database.findRoadMatch(traditionalName)
    }
    if (directMatch) {
      return directMatch.english.replace(/\s(Rd\.|St\.|Ln\.|Aly\.|Blvd\.)$/, '').trim()
    }
    
    // Component-based translation for specific patterns
    const suffixes = ['部落', '村', '里', '鄰']
    
    for (const suffix of suffixes) {
      if (chineseName.endsWith(suffix)) {
        const prefix = chineseName.slice(0, -suffix.length)
        if (prefix) {
          // Try to translate the prefix using roads database
          let prefixMatch = await database.findRoadMatch(prefix)
          if (!prefixMatch) {
            const traditionalPrefix = prefix.replace(/台/g, '臺')
            prefixMatch = await database.findRoadMatch(traditionalPrefix)
          }
          
          if (prefixMatch) {
            return prefixMatch.english.replace(/\s(Rd\.|St\.|Ln\.|Aly\.|Blvd\.)$/, '').trim()
          }
        }
      }
    }
    
    // Hardcode common directional suffixes for performance
    if (chineseName.endsWith('南')) {
      const base = chineseName.slice(0, -1)
      const baseTranslation = await this.translateComponents(base)
      return baseTranslation !== base ? `${baseTranslation} S.` : chineseName
    }
    if (chineseName.endsWith('北')) {
      const base = chineseName.slice(0, -1)
      const baseTranslation = await this.translateComponents(base)
      return baseTranslation !== base ? `${baseTranslation} N.` : chineseName
    }
    if (chineseName.endsWith('東')) {
      const base = chineseName.slice(0, -1)
      const baseTranslation = await this.translateComponents(base)
      return baseTranslation !== base ? `${baseTranslation} E.` : chineseName
    }
    if (chineseName.endsWith('西')) {
      const base = chineseName.slice(0, -1)
      const baseTranslation = await this.translateComponents(base)
      return baseTranslation !== base ? `${baseTranslation} W.` : chineseName
    }
    
    // If no component translation found, return original
    return chineseName
  }

  chineseNumberToArabic(chineseNum) {
    // Standard numbers - hardcoded for performance and reliability
    const numMap = {
      '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
      '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
    }
    
    return numMap[chineseNum] || chineseNum
  }


  constructFinalAddress(streetInfo, countyMatch) {
    const parts = []
    
    // Taiwan standard hierarchical format: No. X, Rm. Y, ZF, Aly. A, Ln. B, Sec. C, Road Name, District, City Postal Code, Taiwan (R.O.C.)
    
    if (streetInfo) {
      // Build address components in correct hierarchical order
      const addressComponents = []
      
      // 1. Room number first (if exists)
      if (streetInfo.room) {
        addressComponents.push(streetInfo.room)
      }
      
      // 2. Floor information 
      if (streetInfo.floor) {
        addressComponents.push(streetInfo.floor)
      }
      
      // 3. Building number
      if (streetInfo.number) {
        addressComponents.push(streetInfo.number)
      }
      
      // 4. Lane number (巷) - comes before alley in expected format
      if (streetInfo.laneNumber) {
        addressComponents.push(streetInfo.laneNumber)
      }
      
      // 5. Alley number (弄)
      if (streetInfo.alleyNumber) {
        addressComponents.push(streetInfo.alleyNumber)
      }
      
      // 6. Section
      if (streetInfo.section) {
        addressComponents.push(streetInfo.section)
      }
      
      // 7. Road name and type
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