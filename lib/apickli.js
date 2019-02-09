//TODO: exception output is shit

const { assoc, compose, curry, propOr, Reader, setPath, substitution: S, tap } = require('crocks')
const { Future: Task } = require('fluture')
const deepmerge = require('deepmerge')
const request = require('request')
const assert = require('chai').assert
const jsonPath = require('JSONPath')
const util = require('util')

const { ask: chainable } = Reader

const merge = curry(
  def => obj => deepmerge(def, obj)
)

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

const mergeWithDefaultContext =
  merge(defaultContext)

const mergeWithDefaultRequest =
  merge(defaultRequest)

const getTemplateExpression = ctx =>
  new RegExp(`${ctx.templateChar}(\\w*)${ctx.templateChar}`, 'gi')

const replaceTemplated = ctx => str =>
  str.replace(
    getTemplateExpression(ctx),
    varName => propOr(
      varName, // value if template couldn't be resolved
      varName.replace(/`/g, ''), // property name in ctx.variables
      ctx.variables
    )
  )

const resolveTemplates = ctx => obj =>
  Task.of(obj)
  .map(JSON.stringify)
  .map(replaceTemplated(ctx))
  .map(JSON.parse)

const doHttp = req =>
  Task.node(done =>
    request(req, done)
  )

const Request = {
  of: reader => {
    return {
      map: f => Request.of(reader.map(f)),
      chain: f => Request.of(reader.chain(f)),
      execute: ctx =>
        Task.of(ctx) // -> user context
        .map(mergeWithDefaultContext) // -> complete context
        .chain(S(resolveTemplates, reader.runWith)) // -> complete request
        .chain(doHttp) // -> Task(response)
        .map(V(ctx)) // -> Task(V)
    }
  }
}

_.request = requestObj =>
  compose(
    Request.of,
    Reader.of,
    mergeWithDefaultRequest
  )(requestObj)

_.inspect = x =>
  chainable(() => {
    console.log(util.inspect(x, { colors: true, compact: false }))
    return x
  })

_.setHeader = (name, value) => request =>
  chainable(() =>
    setPath(['headers', name], value, request)
  )

_.setMethod = method => request =>
  chainable(() =>
    assoc('method', method, request)
  )

_.setUri = uri => request =>
  chainable(() =>
    assoc('uri', uri, request)
  )

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

//TODO: this is shit
const evaluateJsonPath = (path, response) => {
  const body = JSON.parse(response.body)
  const evalResult = jsonPath({ resultType: 'all' }, path, body)
  return evalResult.length > 0 ? evalResult[0].value : null
}

//TODO: this is shit
const evaluatePath = (path, response) => {
  switch (getResponseContentType(response)) {
    case 'json':
      return evaluateJsonPath(path, response)
    case 'xml':
      return evaluateXPath(path, response)
    default:
      return false
  }
}

//TODO: ctx is required here
_.assertResponseCode = code => test =>
  test((ctx, response) => {
    assert.equal(
      response.statusCode,
      code,
      'Response code assertion'
    )
  }
)

_.assertResponseBodyPath = curry((path, value, response) => {
  assert.match(
    evaluatePath(path, response),
    new RegExp(value),
    'Response body path assertion'
  )
  return response
})

module.exports = _
