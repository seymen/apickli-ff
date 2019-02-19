const apickli = require('../lib/apickli.js')
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

Task.of(apickli.request(ctx, req))
.map(apickli.setMethod('GET'))
.map(apickli.setUri('`uri`'))
.chain(apickli.execute)
.chain(apickli.assertResponseCode('`successCode`'))
.chain(apickli.assertResponseCode(200))
.fork(
  console.log,
  console.log
)
