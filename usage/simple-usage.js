const apickli = require('../lib/index')
const log = require('../lib/log')
const { Async: Task } = require('crocks')

const ctx = {
  variables: {
    uri: '/get',
    successCode: '200'
  },
  templateChar: '`'
}

const req = {
  baseUrl: 'https://httpbin.org',
  headers: {
    Authorization: 'Bearer abcd'
  }
}

Task.of(apickli.request(req, ctx))
.map(apickli.setMethod('GET'))
.map(apickli.setUri('`uri`'))
.chain(apickli.execute)
.chain(apickli.assertResponseCode('`successCode`'))
.chain(apickli.assertResponseCode(200))
.fork(log, log)
