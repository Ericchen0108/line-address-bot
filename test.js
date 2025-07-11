import addressService from './addressService.js'

async function testAddressTranslation() {
  console.log('🧪 Testing Address Translation Service...\n')
  
  const testCases = [
    '台北市中正區重慶南路一段122號',
    '高雄市左營區博愛二路777號',
    '台中市西屯區台灣大道三段99號',
    '新北市板橋區中山路一段161號',
    '桃園市桃園區復興路195號',
    '台南市中西區民族路二段76號',
    '彰化縣彰化市中山路二段416號',
    '宜蘭縣宜蘭市中山路二段58號',
    '花蓮縣花蓮市中華路123號',
    '苗栗縣苗栗市中正路1號',
    '中正區重慶南路',
    '信義區',
    '板橋區中山路',
    '無效地址測試'
  ]

  for (const testAddress of testCases) {
    try {
      console.log(`📍 測試地址: ${testAddress}`)
      const result = await addressService.translateAddress(testAddress)
      
      if (result) {
        console.log(`✅ 英文地址: ${result}`)
      } else {
        console.log(`❌ 無法轉換此地址`)
      }
      console.log('---')
    } catch (error) {
      console.log(`❌ 錯誤: ${error.message}`)
      console.log('---')
    }
  }
}

// Test API data loading
async function testAPILoading() {
  console.log('\n🔄 Testing API Data Loading...\n')
  
  try {
    const data = await addressService.loadAddressData()
    console.log(`✅ Counties loaded: ${data.county?.length || 0}`)
    console.log(`✅ Villages loaded: ${data.villages?.length || 0}`)
    
    // Show some sample data
    if (data.county && data.county.length > 0) {
      console.log(`📋 Sample county: ${data.county[0]}`)
    }
    if (data.villages && data.villages.length > 0) {
      console.log(`📋 Sample village: ${data.villages[0]}`)
    }
  } catch (error) {
    console.log(`❌ API Loading Error: ${error.message}`)
  }
}

// Run all tests
async function runTests() {
  try {
    await testAPILoading()
    await testAddressTranslation()
    console.log('\n🎉 All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

runTests()