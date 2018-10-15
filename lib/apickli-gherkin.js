const { Given, When, Then } = require('cucumber')
const apickli = require('./apickli.js')

Given(/^I set (.+) header to (.+)$/, function(headerName, headerValue) {
  this.request = this.request.map(apickli.setHeader(headerName, headerValue))
})

Given(/^I set headers to$/, function(table) {
  table.hashes().map(row => {
    this.request = this.request.map(apickli.setHeader(row.name, row.value))
  })
})

Given(/^I set cookie to (.+)$/, function(cookie) {
  this.request = this.request.map(apickli.setCookie(cookie))
})

Given(/^I have basic authentication credentials (.+) and (.+)$/, function(
  username,
  password
) {
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    'base64'
  )
  this.request = this.request.map(
    apickli.setHeader('Authorization', `Basic ${encodedCredentials}`)
  )
})

Given(/^I set bearer token to (.+)$/, function(token) {
  this.request = this.request.map(
    apickli.setHeader('Authorization', `Bearer ${token}`)
  )
})

Given(/^I set (.+) query parameter to (.+)$/, function(name, value) {
  this.request = this.request.map(apickli.setQueryParameter(name, value))
})

Given(/^I set query parameters to$/, function(table) {
  table.hashes().map(row => {
    this.request = this.request.map(
      apickli.setQueryParameter(row.name, row.value)
    )
  })
})

Given(/^I set body to (.+)$/, function(body) {
  this.request = this.request.map(apickli.setBody(body))
})

Given(/^I set form parameter (.+) to (.+)$/, function(name, value) {
  this.request = this.request.map(apickli.setFormParameter(name, value))
})

Given(/^I set form parameters to$/, function(table) {
  table.hashes().map(row => {
    this.request = this.request.map(
      apickli.setFormParameter(row.name, row.value)
    )
  })
})

Given(/^I pipe contents of file (.*) to body$/, function(file) {
  this.request = this.request.map(apickli.pipeFileToBody(file))
})

When(/^I GET (.+)$/, function(resource) {
  this.response = this.request
    .map(apickli.setMethod('GET'))
    .map(apickli.setUri(resource))
    .execute(this.context)
})

When(/^I POST to (.+)$/, function(resource) {
  this.response = this.request
    .map(apickli.setMethod('POST'))
    .map(apickli.setUri(resource))
    .execute(this.context)
})

Then(/^response body path (.+) should be (((?!of type).+))$/, function(
  path,
  value
) {
  return this.response.then(apickli.assertResponseContentPathValue(path, value))
})
