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
    .stepWithContext(inspectTemplated)

console.log('before')
request.execute(scenarioContext)
    .then(assertResponseCode(200))
    .then(response => console.log(response.timingPhases))
    .catch(err => console.log(err.message))
console.log('after')
