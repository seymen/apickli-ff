const R = require('ramda')
const util = require('util')
const Reader = require('fantasy-readers')
const http = require('request-promise-native')
const assert = require('chai').assert
const jsonPath = require('JSONPath')
const Dom = require('xmldom').DOMParser
const fs = require('fs')
const path = require('path')

const _ = {}

let defaultContext = {
  variables: {},
  templateChar: '`',
  fixturesDirectory: './test/features/fixtures'
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
  qs: {}
}

const merge = def => o => R.mergeDeepLeft(o, def)

const safeGetTemplateValue = (context, templated) => {
  const prop = templated.replace(/`/g, '')
  return prop in context.variables ? context.variables[prop] : prop
}

const getTemplateResolver = context => {
  const templatedExp = `${context.templateChar}(.+)${context.templateChar}`
  const regex = new RegExp(templatedExp, 'gi')

  return {
    resolve: x => {
      const s = JSON.stringify(x, null, 2)
      const replaced = s.replace(regex, templated =>
        safeGetTemplateValue(context, templated)
      )
      return JSON.parse(replaced)
    }
  }
}

const getFixtureResolver = context => {
  const fixturedBodyExpression = /^fixture:\/\/(.+)$/

  return {
    resolve: x => {
      if (!x.body) return x

      const match = x.body.match(fixturedBodyExpression)
      if (!match) return x

      const fileContents = fs.readFileSync(
        path.join(context.fixturesDirectory, match[1]),
        'utf8'
      )
      return R.assoc(['body'], fileContents, x)
    }
  }
}

const Request = {
  of: reader => {
    return {
      map: f => Request.of(reader.map(f)),
      chain: f => Request.of(reader.chain(f)),
      execute: c => {
        const scenarioContext = R.mergeDeepLeft(defaultContext, c || {})

        const templateResolver = getTemplateResolver(scenarioContext)
        const fixtureResolver = getFixtureResolver(scenarioContext)

        const rp = R.pipe(
          reader.run,
          templateResolver.resolve,
          fixtureResolver.resolve,
          http
        )(scenarioContext)

        return rp.then(r => R.assoc('context', scenarioContext, r))
      }
    }
  }
}

_.RequestFactory = overrides =>
  R.pipe(
    merge(defaultRequest),
    Reader.of,
    Request.of
  )(overrides)

_.inspectTemplated = x => {
  return Reader.ask.map(context => {
    const templateResolver = getTemplateResolver(context)
    return _.inspect(templateResolver.resolve(x))
  })
}

_.inspect = x => {
  console.log(util.inspect(x, { colors: true, compact: false }))
  return x
}

_.setHeader = (name, value) => request =>
  R.assocPath(['headers', name], value, request)

_.setQueryParameter = (name, value) => request =>
  R.assocPath(['qs', name], value, request)

_.setMethod = method => request => R.assoc(['method'], method, request)

_.setUri = uri => request => R.assoc(['uri'], uri, request)

_.setBody = body => request => R.assoc(['body'], body, request)

_.setFormParameter = (name, value) => request =>
  R.assocPath(['form', name], value, request)

_.setFormParameters = table => request =>
  R.assoc(['form'], R.fromPairs(table.rows()), request)

_.pipeFileToBody = file => request =>
  R.assoc(['body'], `fixture://${file}`, request)

const getResponseContentType = response => {
  try {
    JSON.parse(response.body)
    return 'json'
  } catch (e) {
    try {
      new Dom().parseFromString(response.body)
      return 'xml'
    } catch (e) {
      return null
    }
  }
}

const evaluateJsonPath = (path, response) => {
  const body = JSON.parse(response.body)
  const evalResult = jsonPath({ resultType: 'all' }, path, body)
  return evalResult.length > 0 ? evalResult[0].value : null
}

const evaluatePath = (path, response) => {
  switch (getResponseContentType(response)) {
    case 'json':
      return evaluateJsonPath(path, response)
    // case 'xml':
    //   return evaluateXPath(path, response)
    default:
      return false
  }
}

_.assert = f => (...args) => response => {
  const templateResolver = getTemplateResolver(response.context)
  const resolvedArgs = args.map(templateResolver.resolve)

  try {
    return f(...resolvedArgs)(response)
  } catch (err) {
    console.log(err.message)
    err.context = response.context
    throw new Error(err.message)
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

const matchResponseContentPathValue = (path, value) => response => {
  const regExp = new RegExp(value)
  const actual = evaluatePath(path, response)
  assert.match(actual, regExp, `Content path ${path} =>`)
  return response
}

_.assertResponseCode = _.assert(isResponseCodeEq)
_.assertResponseHeaderValue = _.assert(matchResponseHeaderValue)
_.assertResponseContentPathValue = _.assert(matchResponseContentPathValue)

_.expose = env => {
  var f
  for (f in _) {
    if (f !== 'expose' && _.hasOwnProperty(f)) {
      env[f] = _[f]
    }
  }
  return _
}

// export default _
module.exports = _
