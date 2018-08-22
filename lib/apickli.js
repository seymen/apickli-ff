const R = require('ramda')
const util = require('util')
const Reader = require('fantasy-readers')
const http = require('request-promise-native')
const assert = require('chai').assert

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
                    const resolveTemplate = getTemplateResolver(c)

                    const rp = R.pipe(
                        reader.run,
                        resolveTemplate,
                        http
                    )(c)

                    return rp.then(r => R.assoc('context', c, r))
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

_.inspectTemplated = x => {
    return withContext(context => {
        const resolveTemplates = getTemplateResolver(context)
        return _.inspect(resolveTemplates(x))
    })
}

_.inspect = x => {
    console.log(util.inspect(x, { colors: true, compact: false }))
    return x
}

_.setHeader = (name, value) => (request) =>
    R.assocPath(['headers', name], value, request)

_.setQueryParameter = (name, value) => (request) =>
    withContext(context =>
        R.assocPath(['qs', name], value, request)
    )

_.setMethod = method => request =>
    R.assoc(['method'], method, request)

_.setUri = uri => request =>
    R.assoc(['uri'], uri, request)

_.assert = f => (...args) => response => {
    const resolveTemplate = getTemplateResolver(response.context)
    const resolvedArgs = args.map(resolveTemplate)

    try {
        return f(...resolvedArgs)(response)
    } catch (err) {
        err.context = response.context
        throw err
    }
}

const isResponseCodeEq = expected => response => {
    const actual = R.prop('statusCode', response)
    assert.equal(actual, expected, 'Status code =>')
    return response
}

const matchResponseHeaderValue = (name, expected) => response => {
    const actual = R.path(['headers', name.toLowerCase()], response)
    assert.equal(actual, expected, 'Response header =>')
    return response
}

_.assertResponseCode = _.assert(isResponseCodeEq)
_.assertResponseHeaderValue = _.assert(matchResponseHeaderValue)

module.exports = _
