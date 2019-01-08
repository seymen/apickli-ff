const Reader = require('fantasy-readers')
const R = require('ramda')
const util = require('util')
const http = require('request-promise-native')
const assert = require('chai').assert
const jsonPath = require('JSONPath')
const Dom = require('xmldom').DOMParser

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
  qs: {},
  useQuerystring: true // a=1&a=2
}

const merge = def => o => R.mergeDeepLeft(o, def)

const safeGetTemplateValue = (context, templated) => {
  const prop = templated.replace(/`/g, '')
  return R.propOr(prop, prop)(context.variables)
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

const Request = {
  of: reader => {
    return {
      map: f => Request.of(reader.map(f)),
      chain: f => Request.of(reader.chain(f)),
      execute: c => {
        const scenarioContext = merge(c || {})(defaultContext)
        const templateResolver = getTemplateResolver(scenarioContext)

        const rp = R.pipe(
          reader.run,
          templateResolver.resolve,
          http
        )(scenarioContext)

        return rp.then(r => R.assoc('context', scenarioContext, r))
      }
    }
  }
}

_.request = overrides =>
  R.pipe(
    merge(defaultRequest),
    Reader.of,
    Request.of
  )(overrides)

const chainable = f => Reader.ask.map(f)

const inspect = x => {
  console.log(util.inspect(x, { colors: true, compact: false }))
  return x
}

_.inspect = x =>
  chainable(context => {
    const templateResolver = getTemplateResolver(context)
    return inspect(templateResolver.resolve(x))
  })

_.setHeader = (name, value) => request =>
  chainable(() => R.assocPath(['headers', name], value, request))

_.setQueryParameter = (name, value) => request =>
  chainable(() => {
    const qsLens = R.lensPath(['qs', name])
    return R.over(qsLens, pushToArray(value), request)
  })

_.setMethod = method => request =>
  chainable(() => R.assoc(['method'], method, request))

_.setUri = uri => request => chainable(() => R.assoc(['uri'], uri, request))

_.setBody = body => request => chainable(() => R.assoc(['body'], body, request))

_.setFormParameter = (name, value) => request =>
  chainable(() => R.assocPath(['form', name], value, request))

_.setCookie = cookie => request =>
  chainable(() => {
    const cookieLens = R.lensPath(['headers', 'Cookie'])
    return R.over(cookieLens, append(cookie, ';'), request)
  })

const append = (str2, sep) => str1 => {
  if (!sep) sep = ''
  if (!str1) {
    str1 = ''
    sep = ''
  }
  return `${str1}${sep}${str2}`
}

const pushToArray = item => array => R.append(item, array)

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

const matchResponseCode = expected => response => {
  const actual = R.prop('statusCode', response)
  const expectedRe = new RegExp(expected)
  assert.match(actual, expectedRe, 'Status code =>')
  return response
}

const matchResponseHeaderValue = (name, expected) => response => {
  const actual = R.path(['headers', name.toLowerCase()], response)
  const expectedRe = new RegExp(expected)
  assert.match(actual, expectedRe, 'Response header =>')
  return response
}

const matchInResponseBody = content => response => {
  const body = R.prop('body', response)
  const expectedRe = new RegExp(content)
  assert.match(body, expectedRe, 'Response body =>')
  return response
}

const matchResponseBodyPath = (path, value) => response => {
  const expectedRe = new RegExp(value)
  const actual = evaluatePath(path, response)
  assert.match(actual, expectedRe, `Content path ${path} =>`)
  return response
}

_.assertResponseCode = _.assert(matchResponseCode)
_.assertResponseHeaderValue = _.assert(matchResponseHeaderValue)
_.assertResponseBodyContains = _.assert(matchInResponseBody)
_.assertResponseBodyPath = _.assert(matchResponseBodyPath)
// _.assertResponseBodyWithSchema = _.assert(validateWithSchema)

_.expose = env => {
  var f
  for (f in _) {
    if (f !== 'expose' && _.hasOwnProperty(f)) {
      env[f] = _[f]
    }
  }
  return _
}

module.exports = _
