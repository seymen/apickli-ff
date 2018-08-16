//TODO: implement request execution
//TODO: implement response assertion example

const R = require('ramda')
const util = require('util')

const Reader = require('fantasy-readers')
const withContext = f => Reader.ask.map(f)

const apickli = {
    expose: function(env) {
        var f;
        for (f in apickli) {
            if (f !== 'expose' && apickli.hasOwnProperty(f)) {
                env[f] = apickli[f];
            }
        }
        return apickli;
    }
}

let defaultContext = {
    variables: {},
    variableChar: '`',
    fixturesDirectory: '',
}

let defaultRequest = {
    headers: {
        Cache: 'no-cache'
    },
    queryParameters: {}
}

const merge = def => o => R.mergeDeepLeft(o, def)

const Scenario =
({
    of: reader => {
        return {
            step: f => Scenario.of(reader.map(f)),
            stepWithContext: f => Scenario.of(reader.chain(f)),
            run: c => reader.run(c)
        }
    }
})

apickli.TestContext = overrides =>
    R.mergeDeepLeft(defaultContext, overrides)

apickli.TestScenario = overrides =>
    R.compose(
        Scenario.of,
        Reader.of,
        merge(defaultRequest)
    )(overrides)

apickli.inspect = x => {
    console.log(util.inspect(x, {colors: true, compact: false}))
    return x
}

apickli.setHeader = (name, value) => (scenario) =>
    R.assocPath(['headers', name], value, scenario)

apickli.setQueryParameter = (name, value) => (scenario) => {
    return withContext(context =>
        R.assocPath(['queryParameters', name], context.variableChar, scenario)
    )
}

module.exports = apickli
