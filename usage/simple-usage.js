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

const request = apickli
  .request(req)
  .chain(apickli.setHeader('map', '`a`'))
  .chain(apickli.setQueryParameter('a', '`a`'))
  .chain(apickli.setMethod('GET'))
  .chain(apickli.setUri('/status/400?q=`a`'))
  .chain(apickli.inspect)

console.log('before')
request
  .execute(ctx)
  .then(apickli.assertResponseCode(400))
  .then(apickli.assertResponseHeaderValue('Connection', '`connection`'))
  .catch(err => console.error(err))
console.log('after')
