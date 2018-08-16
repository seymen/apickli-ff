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
    .step(setHeader('map', 'map'))
    .stepWithContext(setQueryParameter('context.variableChar', '-'))
    .step(setMethod('GET'))
    .step(setUri('/status/400'))
    .step(inspect)

console.log('before')
request.execute(scenarioContext)
    .then(response => console.log('success: ', response.timingPhases))
    .catch(err => console.log('fail', err))
console.log('after')
