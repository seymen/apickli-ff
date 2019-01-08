const apickli = require('../../../lib/apickli.js')
const { Before, setDefaultTimeout } = require('cucumber')

Before(function() {
  this.request = apickli.request({
    baseUrl: 'https://httpbin.org'
  })

  this.context = {
    variables: {
      userAgent: 'apickli',
      foo: 'bar'
    },
    fixturesDirectory: './test/features/fixtures'
  }
})

setDefaultTimeout(60 * 1000)
