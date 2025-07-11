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
    
    // Check if data exists and is not expired
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
      
      // Return cached data if available, even if expired
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

      // Clean and normalize input
      const cleanAddress = chineseAddress.trim()
      
      // Find matching county/district
      const countyMatch = this.findCountyMatch(cleanAddress, data.county)
      if (!countyMatch) {
        return null
      }

      // Find matching village if exists
      const villageMatch = this.findVillageMatch(cleanAddress, data.villages)
      
      // Extract remaining address parts (street, number, etc.)
      const remainingAddress = this.extractRemainingAddress(cleanAddress, countyMatch, villageMatch)
      
      // Construct English address
      return this.constructEnglishAddress(countyMatch, villageMatch, remainingAddress)
      
    } catch (error) {
      console.error('Address translation error:', error.message)
      throw error
    }
  }

  normalizeText(text) {
    // Convert traditional to simplified Chinese characters for better matching
    return text
      .replace(/臺/g, '台')
      .replace(/縣/g, '县')
      .replace(/區/g, '区')
      .trim()
  }

  findCountyMatch(address, counties) {
    let bestMatch = null
    let maxLength = 0
    const normalizedAddress = this.normalizeText(address)
    
    for (const county of counties) {
      const [zipCode, chineseName, englishName] = county
      const normalizedCountyName = this.normalizeText(chineseName)
      
      // Check for exact match of district name
      if (normalizedAddress.includes(normalizedCountyName) && chineseName.length > maxLength) {
        bestMatch = {
          zipCode,
          chinese: chineseName,
          english: englishName,
          matchLength: chineseName.length
        }
        maxLength = chineseName.length
      }
      
      // Also try matching without "區", "市", "縣", "鄉", "鎮" suffixes
      const shortName = normalizedCountyName.replace(/[区市县鄉鎮村里]$/, '')
      if (shortName.length > 2 && normalizedAddress.includes(shortName) && shortName.length > maxLength) {
        bestMatch = {
          zipCode,
          chinese: chineseName,
          english: englishName,
          matchLength: shortName.length
        }
        maxLength = shortName.length
      }
      
      // Try matching city + district pattern (e.g., "台北市中正區")
      if (normalizedCountyName.includes('市') && normalizedAddress.includes('市')) {
        const parts = normalizedCountyName.split('市')
        if (parts.length === 2) {
          const cityPart = parts[0]
          const districtPart = parts[1]
          const fullPattern = cityPart + '市' + districtPart
          
          if (normalizedAddress.includes(fullPattern) && fullPattern.length > maxLength) {
            bestMatch = {
              zipCode,
              chinese: chineseName,
              english: englishName,
              matchLength: fullPattern.length
            }
            maxLength = fullPattern.length
          }
        }
      }
      
      // Try matching district only (e.g., "中正區")
      if (normalizedCountyName.includes('市') && normalizedAddress.includes('区')) {
        const districtPart = normalizedCountyName.split('市')[1]
        if (districtPart && normalizedAddress.includes(districtPart) && districtPart.length > maxLength) {
          bestMatch = {
            zipCode,
            chinese: chineseName,
            english: englishName,
            matchLength: districtPart.length
          }
          maxLength = districtPart.length
        }
      }
    }
    
    return bestMatch
  }

  findVillageMatch(address, villages) {
    let bestMatch = null
    let maxLength = 0
    
    for (const village of villages) {
      const [chineseName, englishName] = village
      
      if (address.includes(chineseName) && chineseName.length > maxLength) {
        bestMatch = {
          chinese: chineseName,
          english: englishName,
          matchLength: chineseName.length
        }
        maxLength = chineseName.length
      }
    }
    
    return bestMatch
  }

  extractRemainingAddress(originalAddress, countyMatch, villageMatch) {
    let remaining = originalAddress
    
    // Remove county part
    if (countyMatch) {
      remaining = remaining.replace(countyMatch.chinese, '')
    }
    
    // Remove village part
    if (villageMatch) {
      remaining = remaining.replace(villageMatch.chinese, '')
    }
    
    // Clean up remaining address
    remaining = remaining.trim()
    
    // Enhanced address parsing with proper order
    remaining = this.parseAddressParts(remaining)
    
    return remaining
  }

  parseAddressParts(address) {
    let result = address
    
    // First, translate road names before processing
    result = this.translateRoadNames(result)
    
    // Handle directional indicators (南/北/東/西) 
    result = result.replace(/南路/g, ' S. Rd.')
    result = result.replace(/北路/g, ' N. Rd.')
    result = result.replace(/東路/g, ' E. Rd.')
    result = result.replace(/西路/g, ' W. Rd.')
    result = result.replace(/南街/g, ' S. St.')
    result = result.replace(/北街/g, ' N. St.')
    result = result.replace(/東街/g, ' E. St.')
    result = result.replace(/西街/g, ' W. St.')
    
    // Handle road types for remaining cases
    result = result.replace(/路/g, ' Rd.')
    result = result.replace(/街/g, ' St.')  
    result = result.replace(/巷/g, ' Ln.')
    result = result.replace(/弄/g, ' Aly.')
    result = result.replace(/大道/g, ' Blvd.')
    
    // Handle section numbers - convert Chinese to English
    result = result.replace(/一段/g, ' Sec. 1')
    result = result.replace(/二段/g, ' Sec. 2')
    result = result.replace(/三段/g, ' Sec. 3')
    result = result.replace(/四段/g, ' Sec. 4')
    result = result.replace(/五段/g, ' Sec. 5')
    result = result.replace(/六段/g, ' Sec. 6')
    result = result.replace(/七段/g, ' Sec. 7')
    result = result.replace(/八段/g, ' Sec. 8')
    result = result.replace(/九段/g, ' Sec. 9')
    result = result.replace(/十段/g, ' Sec. 10')
    result = result.replace(/(\d+)段/g, ' Sec. $1')
    
    // Handle building numbers
    result = result.replace(/(\d+)號/g, ' No. $1')
    
    // Handle floor numbers
    result = result.replace(/(\d+)樓/g, ' $1F')
    
    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim()
    
    return result
  }

  translateRoadNames(address) {
    // Translate common road names
    let result = address
    result = result.replace(/重慶/g, 'Chongqing')
    result = result.replace(/中山/g, 'Zhongshan')
    result = result.replace(/復興/g, 'Fuxing')
    result = result.replace(/忠孝/g, 'Zhongxiao')
    result = result.replace(/仁愛/g, 'Renai')
    result = result.replace(/信義/g, 'Xinyi')
    result = result.replace(/民族/g, 'Minzu')
    result = result.replace(/中華/g, 'Zhonghua')
    result = result.replace(/台灣大道/g, 'Taiwan Blvd.')
    result = result.replace(/博愛/g, 'Boai')
    result = result.replace(/和平/g, 'Heping')
    result = result.replace(/敦化/g, 'Dunhua')
    result = result.replace(/建國/g, 'Jianguo')
    result = result.replace(/羅斯福/g, 'Roosevelt')
    return result
  }


  constructEnglishAddress(countyMatch, villageMatch, remainingAddress) {
    const parts = []
    
    // Add remaining address (street, number, etc.)
    if (remainingAddress) {
      parts.push(remainingAddress)
    }
    
    // Add village
    if (villageMatch) {
      parts.push(villageMatch.english)
    }
    
    // Add county/district
    if (countyMatch) {
      parts.push(countyMatch.english)
    }
    
    // Add zip code
    if (countyMatch && countyMatch.zipCode) {
      parts.push(countyMatch.zipCode)
    }
    
    return parts.filter(part => part && part.trim()).join(', ')
  }
}

export default new AddressService()