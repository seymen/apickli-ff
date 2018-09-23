const { Given, When, Then } = require('cucumber')
const apickli = require('./apickli.js')

const modifyRequest = (world, f) => (world.request = f(world.request))

Given(/^I set (.*) header to (.*)$/, function(
  headerName,
  headerValue,
  callback
) {
  // this.request = this.request.map(apickli.setHeader(headerName, headerValue))
  modifyRequest(this, r => r.map(apickli.setHeader(headerName, headerValue)))
  callback()
})

When(/^I GET (.*)$/, function(resource, callback) {
  // this.response = this.request
  //   .map(apickli.setMethod('GET'))
  //   .map(apickli.setUri(resource))
  //   .execute(this.context)

  modifyRequest(this, r =>
    r.map(apickli.setMethod('GET')).map(apickli.setUri(resource))
  )

  this.response = this.request.execute(this.context)

  callback()
})

Then(/^response body path (.*) should be (((?!of type).*))$/, function(
  path,
  value
) {
  return this.response.then(apickli.assertResponseContentPathValue(path, value))
})
