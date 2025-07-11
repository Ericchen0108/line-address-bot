import addressService from './addressServiceDB.js'
import database from './database.js'

class TestSuite {
  constructor() {
    this.passedTests = 0
    this.totalTests = 0
    this.results = []
  }

  async runTest(testName, testFunction) {
    this.totalTests++
    console.log(`🧪 Running: ${testName}`)
    
    try {
      const result = await testFunction()
      if (result) {
        this.passedTests++
        console.log(`✅ PASS: ${testName}`)
        this.results.push({ name: testName, status: 'PASS', error: null })
      } else {
        console.log(`❌ FAIL: ${testName}`)
        this.results.push({ name: testName, status: 'FAIL', error: 'Test returned false' })
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testName} - ${error.message}`)
      this.results.push({ name: testName, status: 'ERROR', error: error.message })
    }
    console.log('')
  }

  async runAllTests() {
    console.log('🚀 Starting LINE Address Bot Test Suite\n')
    console.log('=' .repeat(50))
    
    // Database tests
    await this.runTest('Database Initialization', async () => {
      await database.init()
      const stats = await database.getStats()
      return stats.counties > 0 && stats.villages > 0
    })

    await this.runTest('Database County Search', async () => {
      const result = await database.findBestCountyMatch('台北市中正區重慶南路')
      return result && result.chinese === '臺北市中正區'
    })

    // Address service tests
    await this.runTest('Address Service Initialization', async () => {
      await addressService.init()
      const stats = await addressService.getStats()
      return stats.counties === 371 && stats.villages === 8529 && stats.roads > 30000
    })

    // Translation accuracy tests
    const testCases = [
      {
        input: '台北市中正區重慶南路一段122號',
        expected: 'No. 122, Sec. 1, Chongqing S. Rd., Zhongzheng Dist., Taipei City 100, Taiwan (R.O.C.)'
      },
      {
        input: '高雄市左營區博愛二路777號', 
        expectedParts: ['No. 777', "Bo'ai 2nd Rd.", 'Zuoying Dist., Kaohsiung City', '813', 'Taiwan (R.O.C.)']
      },
      {
        input: '台中市西屯區台灣大道三段99號',
        expectedParts: ['No. 99', 'Sec. 3', 'Taiwan', 'Blvd.', 'Xitun Dist., Taichung City', '407', 'Taiwan (R.O.C.)']
      },
      {
        input: '新北市板橋區中山路一段161號',
        expectedParts: ['No. 161', 'Sec. 1', 'Zhongshan', 'Rd.', 'Banqiao Dist., New Taipei City', '220', 'Taiwan (R.O.C.)']
      },
      {
        input: '台南市中西區民族路二段76號',
        expectedParts: ['No. 76', 'Sec. 2', 'Minzu', 'Rd.', 'West Central Dist., Tainan City', '700', 'Taiwan (R.O.C.)']
      },
      {
        input: '台中市大里區瑞城二街52巷12弄26號',
        expectedParts: ['No. 26', 'Aly. 12', 'Ln. 52', 'Ruicheng 2nd St.', 'Dali Dist., Taichung City', '412', 'Taiwan (R.O.C.)']
      },
      // Test cases from test.txt with expected answers
      {
        input: '台北市信義區忠孝東路五段297號3樓8室',
        expected: 'Rm. 8, 3F., No. 297, Sec. 5, Zhongxiao E. Rd., Xinyi Dist., Taipei City 110, Taiwan (R.O.C.)'
      },
      {
        input: '台北市大安區新生南路三段23巷1弄1號',
        expectedParts: ['No. 1', 'Ln. 23', 'Aly. 1', 'Sec. 3', 'Xinsheng S. Rd.', 'Taipei City', '106', 'Taiwan (R.O.C.)']
      },
      {
        input: '新北市板橋區文化路一段21巷11號5樓',
        expected: '5F., No. 11, Ln. 21, Sec. 1, Wenhua Rd., Banqiao Dist., New Taipei City 220, Taiwan (R.O.C.)'
      },
      {
        input: '新北市新店區北宜路二段1000號',
        expected: 'No. 1000, Sec. 2, Beiyi Rd., Xindian Dist., New Taipei City 231, Taiwan (R.O.C.)'
      },
      {
        input: '新北市貢寮區龍洞街189號2樓1室',
        expected: 'Rm. 1, 2F., No. 189, Longdong St., Gongliao Dist., New Taipei City 228, Taiwan (R.O.C.)'
      },
      {
        input: '桃園市中壢區中山路1234號',
        expected: 'No. 1234, Zhongshan Rd., Zhongli Dist., Taoyuan City 320, Taiwan (R.O.C.)'
      },
      {
        input: '台中市西屯區台灣大道三段777號',
        expected: 'No. 777, Sec. 3, Taiwan Blvd., Xitun Dist., Taichung City 407, Taiwan (R.O.C.)'
      },
      {
        input: '台南市安平區古堡街100巷10弄1號',
        expected: 'No. 1, Ln. 100, Aly. 10, Gubao St., Anping Dist., Tainan City 708, Taiwan (R.O.C.)'
      },
      {
        input: '宜蘭縣羅東鎮公園路1號',
        expected: 'No. 1, Gongyuan Rd., Luodong Township, Yilan County 265, Taiwan (R.O.C.)'
      },
      {
        input: '台東縣蘭嶼鄉椰油村漁人部落31號',
        expected: 'No. 31, Yuren, Yeyou Vil., Lanyu Township, Taitung County 952, Taiwan (R.O.C.)'
      }
    ]

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      await this.runTest(`Address Translation ${i + 1}: ${testCase.input}`, async () => {
        const result = await addressService.translateAddress(testCase.input)
        
        if (!result) return false
        
        if (testCase.expected) {
          return result === testCase.expected
        }
        
        if (testCase.expectedParts) {
          return testCase.expectedParts.every(part => result.includes(part))
        }
        
        return false
      })
    }

    // Edge case tests
    await this.runTest('Invalid Address Handling', async () => {
      const result = await addressService.translateAddress('invalid address 123')
      return result === null
    })

    await this.runTest('Empty Address Handling', async () => {
      const result = await addressService.translateAddress('')
      return result === null
    })

    await this.runTest('Special Characters Handling (Floor)', async () => {
      const result = await addressService.translateAddress('台北市中正區重慶南路一段122號3樓')
      return result && result.includes('3F') && result.includes('Taiwan (R.O.C.)')
    })

    await this.runTest('Hierarchical Address Handling (Street/Lane/Alley)', async () => {
      const result = await addressService.translateAddress('台中市大里區瑞城二街52巷12弄26號')
      const expectedParts = ['No. 26', 'Aly. 12', 'Ln. 52', 'Ruicheng 2nd St.']
      return expectedParts.every(part => result.includes(part))
    })

    await this.runTest('Complex Address with Room and Floor', async () => {
      const result = await addressService.translateAddress('台北市信義區信義路五段7號3樓301室')
      return result && result.includes('No. 7') && result.includes('3F') && result.includes('Rm. 301') && result.includes('Taiwan (R.O.C.)')
    })

    // Performance test
    await this.runTest('Performance Test (10 translations)', async () => {
      const startTime = Date.now()
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(addressService.translateAddress('台北市中正區重慶南路一段122號'))
      }
      
      await Promise.all(promises)
      const duration = Date.now() - startTime
      
      console.log(`    ⏱️ 10 translations completed in ${duration}ms (avg: ${duration/10}ms per translation)`)
      return duration < 5000 // Should complete within 5 seconds
    })

    // Print results
    this.printResults()
  }

  printResults() {
    console.log('=' .repeat(50))
    console.log('📊 TEST RESULTS')
    console.log('=' .repeat(50))
    
    console.log(`✅ Passed: ${this.passedTests}/${this.totalTests}`)
    console.log(`❌ Failed: ${this.totalTests - this.passedTests}/${this.totalTests}`)
    console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%\n`)
    
    if (this.results.some(r => r.status !== 'PASS')) {
      console.log('📋 FAILED TESTS:')
      this.results
        .filter(r => r.status !== 'PASS')
        .forEach(r => {
          console.log(`   ${r.status}: ${r.name}${r.error ? ` - ${r.error}` : ''}`)
        })
      console.log('')
    }
    
    if (this.passedTests === this.totalTests) {
      console.log('🎉 All tests passed! The LINE Address Bot is working correctly.')
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.')
    }
  }
}

// Run tests
const testSuite = new TestSuite()
testSuite.runAllTests()
  .then(() => {
    console.log('\n🏁 Test suite completed')
    process.exit(testSuite.passedTests === testSuite.totalTests ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test suite crashed:', error)
    process.exit(1)
  })