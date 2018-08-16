//TODO: implement response assertion example

const R = require('ramda')
const util = require('util')
const Reader = require('fantasy-readers')
const http = require('request-promise-native')

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
    time: true, // in order to receive response.timingPhases object
    simple: false, // prevent 4xx and 5xx to trigger promise.catch
    resolveWithFullResponse: true,
    followRedirect: false,
    method: 'GET',
    uri: '/',
    headers: {
        Cache: 'no-cache'
    },
    qs: {},
}

const merge = def => o => R.mergeDeepLeft(o, def)

const Request =
({
    of: reader => {
        return {
            step: f => Request.of(reader.map(f)),
            stepWithContext: f => Request.of(reader.chain(f)),
            execute: c =>
                R.compose(
                    http,
                    reader.run
                )(c)
        }
    }
})

apickli.ScenarioContext = overrides =>
    R.mergeDeepLeft(defaultContext, overrides)

apickli.RequestFactory = overrides =>
    R.compose(
        Request.of,
        Reader.of,
        merge(defaultRequest)
    )(overrides)

apickli.inspect = x => {
    console.log(util.inspect(x, {colors: true, compact: false}))
    return x
}

apickli.setHeader = (name, value) => (request) =>
    R.assocPath(['headers', name], value, request)

apickli.setQueryParameter = (name, value) => (request) => {
    return withContext(context =>
        R.assocPath(['qs', name], context.variableChar, request)
    )
}

apickli.setMethod = method => request =>
    R.assocPath(['method'], method, request)

apickli.setUri = uri => request =>
    R.assocPath(['uri'], uri, request)

module.exports = apickli
