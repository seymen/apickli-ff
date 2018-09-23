const apickli = require('../../../../lib/apickli.js')
const { Before, setDefaultTimeout } = require('cucumber')

Before(function() {
  this.request = apickli.RequestFactory({
    baseUrl: 'https://httpbin.org'
  })

  this.context = {
    variables: {
      userAgent: 'apickli'
    }
  }
})

setDefaultTimeout(60 * 1000)
