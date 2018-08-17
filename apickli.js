//TODO: implement response assertion example

const R = require('ramda')
const util = require('util')
const Reader = require('fantasy-readers')
const http = require('request-promise-native')

const withContext = f => Reader.ask.map(f)
const _ = {}

let defaultContext = {
    variables: {},
    templateChar: '`',
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

const safeGetTemplateValue = (context, templated) => {
    const prop = templated.replace(/`/g, '')
    return prop in context.variables ? context.variables[prop] : prop
}

const getTemplateResolver = context => {
    const templatedExp = `${context.templateChar}(.+)${context.templateChar}`
    const regex = new RegExp(templatedExp, 'gi')

    return x => {
        const s = JSON.stringify(x, null, 2)
        const replaced = s.replace(regex,
            templated => safeGetTemplateValue(context, templated)
        )
        return JSON.parse(replaced)
    }
}

const Request =
({
    of: reader => {
        return {
            step: f => Request.of(reader.map(f)),
            stepWithContext: f => Request.of(reader.chain(f)),
            execute: c => {
                const resolveTemplates = getTemplateResolver(c)

                return R.pipe(
                    reader.run,
                    resolveTemplates,
                    http
                )(c)
            }
        }
    }
})

_.expose = env => {
    var f
    for (f in _) {
        if (f !== 'expose' && _.hasOwnProperty(f)) {
            env[f] = _[f]
        }
    }
    return _
}

_.ScenarioContext = overrides =>
    R.mergeDeepLeft(defaultContext, overrides)

_.RequestFactory = overrides =>
    R.pipe(
        merge(defaultRequest),
        Reader.of,
        Request.of
    )(overrides)

_.inspect = x => {
    return withContext(context => {
        const resolveTemplates = getTemplateResolver(context)
        console.log(util.inspect(resolveTemplates(x), {colors: true, compact: false}))
        return x
    })
}

_.setHeader = (name, value) => (request) =>
    R.assocPath(['headers', name], value, request)

_.setQueryParameter = (name, value) => (request) => {
    return withContext(context =>
        R.assocPath(['qs', name], value, request)
    )
}

_.setMethod = method => request =>
    R.assocPath(['method'], method, request)

_.setUri = uri => request =>
    R.assocPath(['uri'], uri, request)

module.exports = _
