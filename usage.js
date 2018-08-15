require('./apickli2').expose(global)

const util = require('util')

const print = x => {
    // [x]
    // .map(x => JSON.stringify(x, null, 2))
    // .map(x => util.inspect(x, {colors: true}))
    // .map(x => console.log(x))

    console.log(util.inspect(x, {colors: true, compact: false}))

    return x
}

const test = {
    variables: {
        a: 1
    }
}

const r = {
    headers: {
        Authorization: 'Bearer abcd'
    }
}

// const requester = apickli.createRequester(a);
// const request = requester(r)
//                 .map(print)

// const requester = apickli.initializeRequester(test)
// const request = requester(r)
//                 .map(apickli.setHeader('a', 'b'))
//                 .map(apickli.setHeader('x', 'z'))
//                 .map(print)

const context = TestContext(test)

const scenario = TestScenario(r)
    .map(setHeader('map', 'map'))
    .chain(setQueryParameter('context.variableChar', '-'))
    .map(print)

scenario.run(context)
