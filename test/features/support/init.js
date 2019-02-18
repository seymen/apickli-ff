const apickli = require('../../../lib/apickli.js')
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

  this.requestTask = apickli.request(ctx, req)
})

setDefaultTimeout(60 * 1000)

// https://github.com/cucumber/cucumber-js/issues/157#issuecomment-36896256
Error.prepareStackTrace = function (error, stack) {
    return ''
};
