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
      return stats.counties === 371 && stats.villages === 8529
    })

    // Translation accuracy tests
    const testCases = [
      {
        input: '台北市中正區重慶南路一段122號',
        expected: 'Chongqing S. Rd. Sec. 1 No. 122, Zhongzheng Dist., Taipei City, 100'
      },
      {
        input: '高雄市左營區博愛二路777號', 
        expectedParts: ['Boai', 'Rd.', 'No. 777', 'Zuoying Dist., Kaohsiung City', '813']
      },
      {
        input: '台中市西屯區台灣大道三段99號',
        expectedParts: ['Taiwan', 'Blvd.', 'Sec. 3', 'No. 99', 'Xitun Dist., Taichung City', '407']
      },
      {
        input: '新北市板橋區中山路一段161號',
        expectedParts: ['Zhongshan', 'Rd.', 'Sec. 1', 'No. 161', 'Banqiao Dist., New Taipei City', '220']
      },
      {
        input: '台南市中西區民族路二段76號',
        expectedParts: ['Minzu', 'Rd.', 'Sec. 2', 'No. 76', 'West Central Dist., Tainan City', '700']
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

    await this.runTest('Special Characters Handling', async () => {
      const result = await addressService.translateAddress('台北市中正區重慶南路一段122號3樓')
      return result && result.includes('3F')
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