const { Given, When, Then } = require('cucumber')
const { Async: Task, curry, propOr } = require('crocks')
const apickli = require('./index.js')
const util = require('./util.js')
const fs = require('fs')

const b64 = str =>
  Buffer.from(str).toString('base64')

const readFile = file =>
  Task((rej, res) =>
    fs.readFile(file, 'utf-8', (err, contents) =>
      err ? rej(err) : res(contents)
    )
  )

const ctxPropOr = curry((def, prop, pair) =>
  pair.merge(ctx =>
    propOr(def, prop, ctx)
  )
)

Given(/^I set (.+) header to (.+)$/, function(header, value) {
  this.requestPair =
    apickli.setHeader(header, value, this.requestPair)
})

Given(/^I set headers to$/, function(table) {
  table.hashes().map(row => {
    this.requestPair =
      apickli.setHeader(row.name, row.value, this.requestPair)
  })
})

Given(/^I set cookie to (.+)$/, function(cookie) {
  this.requestPair =
    apickli.setCookie(cookie, this.requestPair)
})

Given(/^I have basic authentication credentials (.+) and (.+)$/, function(username, password) {
  this.requestPair =
    apickli.setHeader('Authorization', 'Basic ' + b64(`${username}:${password}`), this.requestPair)
})

Given(/^I set bearer token to (.+)$/, function(token) {
  this.requestPair =
    apickli.setHeader('Authorization', `Bearer ${token}`, this.requestPair)
})

Given(/^I set (.+) query parameter to (.+)$/, function(name, value) {
  this.requestPair =
    apickli.setQueryParameter(name, value, this.requestPair)
})

Given(/^I set query parameters to$/, function(table) {
  table.hashes().map(row => {
    this.requestPair =
      apickli.setQueryParameter(row.name, row.value, this.requestPair)
  })
})

Given(/^I set body to (.+)$/, function(body) {
  this.requestPair =
    apickli.setBody(body, this.requestPair)
})

Given(/^I set form parameter (.+) to (.+)$/, function(name, value) {
  this.requestPair =
    apickli.setFormParameter(name, value, this.requestPair)
})

Given(/^I set form parameters to$/, function(table) {
  table.hashes().map(row => {
    this.requestPair =
      apickli.setFormParameter(row.name, row.value, this.requestPair)
  })
})

Given(/^I pipe contents of file (.+) to body$/, function(file, cb) {
  Task.of(ctxPropOr('', 'fixturesDirectory', this.requestPair))
  .map(util.append(file))
  .chain(readFile)
  .map(contents => apickli.setBody(contents, this.requestPair))
  .map(pair => this.requestPair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I GET (.+)$/, function(resource, cb) {
  Task.of(this.requestPair)
  .map(apickli.setMethod('GET'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => this.responsePair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I POST to (.+)$/, function(resource, cb) {
  Task.of(this.requestPair)
  .map(apickli.setMethod('POST'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => this.responsePair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I PUT (.+)$/, function(resource, cb) {
  Task.of(this.requestPair)
  .map(apickli.setMethod('PUT'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => this.responsePair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I DELETE (.+)$/, function(resource, cb) {
  Task.of(this.requestPair)
  .map(apickli.setMethod('DELETE'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => this.responsePair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I PATCH (.+)$/, function(resource, cb) {
  Task.of(this.requestPair)
  .map(apickli.setMethod('PATCH'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => this.responsePair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

When(/^I request OPTIONS for (.+)$/, function(resource, cb) {
  Task.of(this.requestPair)
  .map(apickli.setMethod('OPTIONS'))
  .map(apickli.setUri(resource))
  .chain(apickli.execute)
  .map(pair => this.responsePair = pair)
  .fork(
    e => cb(e),
    () => cb()
  )
})

const negate = value => `^((?!${value})[\\s\\S])*$`

Then(/^response code should be (.+)$/, function(code, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseCode(code))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response code should not be (.+)$/, function(code, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseCode(negate(code)))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response header (.+) should be (.+)$/, function(header, value, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseHeader(header, value))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response header (.+) should not be (.+)$/, function(header, value, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseHeader(header, negate(value)))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response body should contain (.+)$/, function(content, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseBodyContains(content))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response body should not contain (.+)$/, function(content, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseBodyContains(negate(content)))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response body path (.+) should be (((?!of type).+))$/, function(path, value, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseBodyPath(path, value))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response body path (.+) should not be (((?!of type).+))$/, function(path, value, cb) {
  Task.of(this.responsePair)
  .chain(apickli.assertResponseBodyPath(path, negate(value)))
  .fork(
    e => cb(e),
    () => cb()
  )
})

Then(/^response body should be valid according to schema file (.+)$/, function(schemaFile, cb) {
  Task.of(ctxPropOr('', 'fixturesDirectory', this.responsePair))
  .map(util.append(schemaFile))
  .chain(readFile)
  .map(schema => apickli.assertResponseBodyWithSchema(schema, this.responsePair))
  .fork(
    e => cb(e),
    () => cb()
  )
})
