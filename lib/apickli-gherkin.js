const { Given, When, Then } = require('cucumber')
const { Async: Task } = require('crocks')
const apickli = require('./apickli.js')
const fs = require('fs')
const path = require('path')
const R = require('ramda')

Given(/^I set (.+) header to (.+)$/, function(header, value) {
  this.requestTask = this.requestTask.map(apickli.setHeader(header, value))
})

Given(/^I set headers to$/, function(table) {
  table.hashes().map(row => {
    this.request = this.request.chain(apickli.setHeader(row.name, row.value))
  })
})

Given(/^I set cookie to (.+)$/, function(cookie) {
  this.request = this.request.chain(apickli.setCookie(cookie))
})

Given(/^I have basic authentication credentials (.+) and (.+)$/, function(
  username,
  password
) {
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    'base64'
  )
  this.request = this.request.chain(
    apickli.setHeader('Authorization', `Basic ${encodedCredentials}`)
  )
})

Given(/^I set bearer token to (.+)$/, function(token) {
  this.request = this.request.chain(
    apickli.setHeader('Authorization', `Bearer ${token}`)
  )
})

Given(/^I set (.+) query parameter to (.+)$/, function(name, value) {
  this.request = this.request.chain(apickli.setQueryParameter(name, value))
})

Given(/^I set query parameters to$/, function(table) {
  table.hashes().map(row => {
    this.request = this.request.chain(
      apickli.setQueryParameter(row.name, row.value)
    )
  })
})

Given(/^I set body to (.+)$/, function(body) {
  this.request = this.request.chain(apickli.setBody(body))
})

Given(/^I set form parameter (.+) to (.+)$/, function(name, value) {
  this.request = this.request.chain(apickli.setFormParameter(name, value))
})

Given(/^I set form parameters to$/, function(table) {
  table.hashes().map(row => {
    this.request = this.request.chain(
      apickli.setFormParameter(row.name, row.value)
    )
  })
})

Given(/^I pipe contents of file (.*) to body$/, function(file) {
  const fixturesDirectory = R.propOr('', 'fixturesDirectory')(this.context)
  const fileContents = fs.readFileSync(
    path.join(fixturesDirectory, file),
    'utf8'
  )
  this.request = this.request.chain(apickli.setBody(fileContents))
})

When(/^I GET (.+)$/, function(resource, cb) {
  this.requestTask
  .map(apickli.setMethod('GET'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => {
    this.responseTask = Task.of(pair)
  })
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I POST to (.+)$/, function(resource) {
  this.response = this.request
    .chain(apickli.setMethod('POST'))
    .chain(apickli.setUri(resource))
    .execute(this.context)
})

When(/^I PUT (.+)$/, function(resource) {
  this.response = this.request
    .chain(apickli.setMethod('PUT'))
    .chain(apickli.setUri(resource))
    .execute(this.context)
})

When(/^I DELETE (.+)$/, function(resource) {
  this.response = this.request
    .chain(apickli.setMethod('DELETE'))
    .chain(apickli.setUri(resource))
    .execute(this.context)
})

When(/^I PATCH (.+)$/, function(resource) {
  this.response = this.request
    .chain(apickli.setMethod('PATCH'))
    .chain(apickli.setUri(resource))
    .execute(this.context)
})

When(/^I request OPTIONS for (.+)$/, function(resource) {
  this.response = this.request
    .chain(apickli.setMethod('OPTIONS'))
    .chain(apickli.setUri(resource))
    .execute(this.context)
})

const negate = value => `^((?!${value})[\\s\\S])*$`

Then(/^response code should be (.+)$/, function(code, cb) {
  this.responseTask
  .chain(apickli.assertResponseCode(code))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response code should not be (.+)$/, function(code) {
  return this.response.then(apickli.assertResponseCode(negate(code)))
})

Then(/^response header (.+) should be (.+)$/, function(header, value) {
  return this.response.then(apickli.assertResponseHeaderValue(header, value))
})

Then(/^response header (.+) should not be (.+)$/, function(header, value) {
  return this.response.then(
    apickli.assertResponseHeaderValue(header, negate(value))
  )
})

Then(/^response body should contain (.+)$/, function(content) {
  return this.response.then(apickli.assertResponseBodyContains(content))
})

Then(/^response body should not contain (.+)$/, function(content) {
  return this.response.then(apickli.assertResponseBodyContains(negate(content)))
})

Then(/^response body path (.+) should be (((?!of type).+))$/, function(path, value, cb) {
  this.responseTask
  .chain(apickli.assertResponseBodyPath(path, value))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response body path (.+) should not be (((?!of type).+))$/, function(
  path,
  value
) {
  return this.response.then(apickli.assertResponseBodyPath(path, negate(value)))
})

Then(/^response body should be valid according to schema file (.+)$/, function(
  schemaFile
) {
  const fixturesDirectory = R.propOr('', 'fixturesDirectory')(this.context)
  const fileContents = fs.readFileSync(
    path.join(fixturesDirectory, schemaFile),
    'utf8'
  )
  return this.response.then(apickli.assertResponseBodyWithSchema(fileContents))
})
