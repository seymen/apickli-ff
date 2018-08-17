require('./apickli').expose(global)

const ctx = {
    variables: {
        a: 1
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
    .stepWithContext(inspect)

console.log('before')
request.execute(scenarioContext)
    .catch(err => console.log('fail', err))
    .then(response => console.log(response.timingPhases))
console.log('after')
