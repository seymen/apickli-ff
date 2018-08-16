require('./apickli').expose(global)

const ctx = {
    variables: {
        a: 1
    }
}

const req = {
    headers: {
        Authorization: 'Bearer abcd'
    }
}

const context = ScenarioContext(ctx)

const request = RequestFactory(req)
    .step(setHeader('map', 'map'))
    .stepWithContext(setQueryParameter('context.variableChar', '-'))
    .step(inspect)

console.log('before')
request.execute(ctx)
console.log('after')
