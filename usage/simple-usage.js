const apickli = require('../lib/apickli.js')

const ctx = {
  variables: {
    a: 1,
    connection: 'close'
  }
}

const req = {
  baseUrl: 'https://httpbin.org',
  headers: {
    Authorization: 'Bearer abcd'
  }
}

apickli.request(req, ctx)
.map(apickli.setHeader('Header1', 'a'))
.map(apickli.setUri('/get'))
.chain(apickli.execute)
.fork(
  console.error,
  r => console.log('forked:', r)
)
// .either(console.error, console.log)
// .map(apickli.assertResponseCode(200))

// const request = apickli
//   .request(req)
//   .chain(apickli.setHeader('map', '`a`'))
//   .chain(apickli.setMethod('GET'))
//   .chain(apickli.setUri('/get?q=`a`'))
//   // .chain(apickli.inspect)

// console.log('standalone usage:')

// request
//   .execute(ctx)
//   .map(apickli.assertResponseCode(200))
//   .map(apickli.assertResponseCode(200))
//   // .map(apickli.assertResponseBodyPath('$.headers.Connection', 'close'))
//   // .map(resp => resp.body)
//   // .map(JSON.parse)
//   .fork(console.error, console.log)

// console.log('after')
