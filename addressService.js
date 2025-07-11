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
    
    // Basic translation of common terms
    remaining = remaining
      .replace(/路/g, ' Rd.')
      .replace(/街/g, ' St.')
      .replace(/巷/g, ' Ln.')
      .replace(/弄/g, ' Aly.')
      .replace(/號/g, '')
      .replace(/樓/g, 'F')
      .replace(/段/g, ' Sec.')
      .trim()
    
    return remaining
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