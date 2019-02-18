const apickli = require('../lib/apickli.js')

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

apickli.request(ctx, req)
  .map(apickli.setMethod('GET'))
  .map(apickli.setUri('`uri`'))
  .chain(apickli.execute)
  .chain(apickli.assertResponseCode('`successCode`'))
  .chain(apickli.assertResponseCode(200))
  .fork(
    console.log,
    console.log
  )
