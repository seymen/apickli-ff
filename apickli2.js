//TODO: re-implement Request object to get rid of map/chain business
//TODO: implement request execution
//TODO: implement response assertion example

const R = require('ramda')

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

apickli.TestContext = overrides =>
    R.mergeDeepLeft(defaultContext, overrides)

apickli.TestScenario = overrides =>
    R.compose(
        Reader.of,
        merge(defaultRequest)
    )(overrides)

apickli.setHeader = (name, value) => (scenario) =>
    R.assocPath(['headers', name], value, scenario)

apickli.setQueryParameter = (name, value) => (scenario) => {
    return withContext(context =>
        R.assocPath(['queryParameters', name], context.variableChar, scenario)
    )
}

module.exports = apickli
