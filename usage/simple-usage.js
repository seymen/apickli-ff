const apickli = require('../lib/apickli.js')

const ctx = {
  variables: {
    a: 1,
    connection: 'close'
  }
}

//TODO: CAN ALL OF THESE BE READER?

const req = {
  baseUrl: 'https://httpbin.org',
  headers: {
    Authorization: 'Bearer abcd'
  }
}

const request = apickli
  .request(req)
  .chain(apickli.setHeader('map', '`a`'))
  .chain(apickli.setMethod('GET'))
  .chain(apickli.setUri('/get?q=`a`'))
  // .chain(apickli.inspect)

console.log('standalone usage:')

request
  .execute(ctx)
  .map(apickli.assertResponseCode(200))
  .map(apickli.assertResponseCode(200))
  // .map(apickli.assertResponseBodyPath('$.headers.Connection', 'close'))
  // .map(resp => resp.body)
  // .map(JSON.parse)
  .fork(console.error, console.log)

console.log('after')
