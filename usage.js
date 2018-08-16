require('./apickli2').expose(global)

const util = require('util')

const print = x => {
    console.log(util.inspect(x, {colors: true, compact: false}))
    return x
}

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
    .step(print)

console.log('before')
scenario.run(context)
console.log('after')
