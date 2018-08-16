require('./apickli').expose(global)

const myContext = {
    variables: {
        a: 1
    }
}

const myScenario = {
    headers: {
        Authorization: 'Bearer abcd'
    }
}

const context = TestContext(myContext)

const scenario = TestScenario(myScenario)
    .step(setHeader('map', 'map'))
    .stepWithContext(setQueryParameter('context.variableChar', '-'))
    .step(inspect)

console.log('before')
scenario.run(context)
console.log('after')
