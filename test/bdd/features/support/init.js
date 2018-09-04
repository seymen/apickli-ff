const apickli = require('../../../../lib/apickli.js')
const { Before, setDefaultTimeout } = require('cucumber')

Before(function() {
  this.request = apickli.RequestFactory({
    baseUrl: 'https://httpbin.org'
  })
})

setDefaultTimeout(60 * 1000)
