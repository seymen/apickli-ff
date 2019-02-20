const apickli = require('../../../lib/index.js')
const { Before, setDefaultTimeout } = require('cucumber')

Before(function() {
  const ctx = {
    variables: {
      userAgent: 'apickli',
      foo: 'bar',
      successCode: 200
    },
    fixturesDirectory: './test/features/fixtures'
  }

  const req = {
    baseUrl: 'https://httpbin.org'
  }

  this.requestPair = apickli.request(req, ctx)
})

setDefaultTimeout(60 * 1000)

// https://github.com/cucumber/cucumber-js/issues/157#issuecomment-36896256
Error.prepareStackTrace = function (error, stack) {
    return ''
};
