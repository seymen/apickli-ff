require('./lib/apickli').expose(global)

const ctx = {
    variables: {
        a: 1,
        connection: 'close1'
    }
}

const req = {
    baseUrl: 'https://httpbin.org',
    headers: {
        Authorization: 'Bearer abcd'
    }
}

const scenarioContext = ScenarioContext(ctx)

const request = RequestFactory(req)
    .step(setHeader('map', '`a`'))
    .stepWithContext(setQueryParameter('a', '`a`'))
    .step(setMethod('GET'))
    .step(setUri('/status/400'))
    .stepWithContext(inspectTemplated)

console.log('before')
request.execute(scenarioContext)
    .then(assertResponseCode(400))
    .then(assertResponseHeaderValue('Connection', '`connection`'))
    .catch(err => console.error(err))
console.log('after')
