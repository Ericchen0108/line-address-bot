import axios from 'axios'

class AddressService {
  constructor() {
    this.apiUrl = 'https://tools.yeecord.com/address-to-english.json'
    this.addressData = null
    this.lastFetched = null
    this.cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
  }

  async loadAddressData() {
    const now = Date.now()
    
    if (this.addressData && this.lastFetched && (now - this.lastFetched < this.cacheExpiry)) {
      return this.addressData
    }

    try {
      console.log('Fetching address data from API...')
      const response = await axios.get(this.apiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LINE-Address-Bot/1.0)'
        }
      })
      
      this.addressData = response.data
      this.lastFetched = now
      console.log('Address data loaded successfully')
      
      return this.addressData
    } catch (error) {
      console.error('Failed to fetch address data:', error.message)
      
      if (this.addressData) {
        console.log('Using cached address data due to fetch failure')
        return this.addressData
      }
      
      throw new Error('Unable to load address translation data')
    }
  }

  async translateAddress(chineseAddress) {
    try {
      const data = await this.loadAddressData()
      
      if (!data || !data.county || !data.villages) {
        throw new Error('Invalid address data format')
      }

      // Clean input
      const cleanAddress = chineseAddress.trim()
      console.log('Translating address:', cleanAddress)
      
      // Step 1: Find the county/district match using real data
      const countyMatch = this.findBestCountyMatch(cleanAddress, data.county)
      if (!countyMatch) {
        console.log('No county match found for:', cleanAddress)
        return null
      }
      
      console.log('Found county match:', countyMatch)
      
      // Step 2: Remove county part and parse the remaining street address  
      // Also try with normalized version
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

  findBestCountyMatch(address, counties) {
    let bestMatch = null
    let maxLength = 0
    
    // Normalize for better matching (台/臺)
    const normalizedAddress = address.replace(/臺/g, '台')
    
    for (const county of counties) {
      const [zipCode, chineseName, englishName] = county
      const normalizedCounty = chineseName.replace(/臺/g, '台')
      
      // Try exact match first
      if (normalizedAddress.includes(normalizedCounty) && chineseName.length > maxLength) {
        bestMatch = {
          zipCode,
          chinese: chineseName,
          english: englishName,
          matchLength: chineseName.length
        }
        maxLength = chineseName.length
      }
      
      // Try partial match (city + district)
      if (normalizedCounty.includes('市') && normalizedAddress.includes('市')) {
        const parts = normalizedCounty.split('市')
        if (parts.length === 2) {
          const cityPart = parts[0]
          const districtPart = parts[1]
          
          // Check if both city and district are in the address
          if (normalizedAddress.includes(cityPart + '市') && 
              normalizedAddress.includes(districtPart) &&
              (cityPart.length + districtPart.length) > maxLength) {
            bestMatch = {
              zipCode,
              chinese: chineseName,
              english: englishName,
              matchLength: cityPart.length + districtPart.length
            }
            maxLength = cityPart.length + districtPart.length
          }
        }
      }
    }
    
    return bestMatch
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
}

export default new AddressService()