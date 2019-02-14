const { assoc, Async: Task, curry, fst, Pair, pick, propOr, setPath } = require('crocks')
const deepmerge = require('deepmerge')
const request = require('request')
const assert = require('chai').assert
const jsonPath = require('JSONPath')
const util = require('util')

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

const mergeWithDefaultContext = ctx =>
  merge(defaultContext, ctx)

const mergeWithDefaultRequest = ctx =>
  merge(defaultRequest, ctx)

const pickFromResponse = resp =>
  pick(['statusCode', 'headers', 'body'], resp)

const regexp = exp =>
  new RegExp(exp, 'gi')

const getTemplateExpression = ctx =>
  regexp(`${ctx.templateChar}(\\w*)${ctx.templateChar}`, 'gi')

const pairToTask = (ctx, req) =>
  Task.of(Pair(ctx, req))

// request :: req -> ctx -> Identity Pair
_.request = curry((ctx, req) =>
  Pair(ctx, req)
  .bimap(mergeWithDefaultContext, mergeWithDefaultRequest)
  .merge(pairToTask)
)

// replaceTemplated :: Pair(ctx, str) -> str
const replaceTemplatedString = pair =>
  pair.merge((ctx, str) =>
    str.replace(
      getTemplateExpression(ctx),
      varName => propOr(
        varName, // value if template couldn't be resolved
        varName.replace(/`/g, ''), // property name in ctx.variables
        ctx.variables
      )
    )
  )

// getAllTemplated :: Pair(ctx, req) -> string
const getAllTemplated = pair =>
  pair.merge((ctx, str) =>
    str.match(
      getTemplateExpression(ctx)
    )
  )

// resolveTemplates :: Pair(ctx, obj) -> Pair(ctx, obj)
_.resolveTemplates = pair =>
  pair
  .map(JSON.stringify) // -> Pair(ctx, str)
  .extend(replaceTemplatedString) // -> Pair(ctx, str)
  .map(JSON.parse) // -> Pair(ctx, obj)

// validateRequest :: Pair(ctx, obj) -> Task(Pair err)
const validateRequest = pair =>
  Task((rej, res) =>
    pair
    .map(JSON.stringify)
    .extend(getAllTemplated)
    .map(templated =>
      templated
        ? rej(`There are unresolved variables in the request: ${templated}`)
        : res(pair)
    )
  )

// doHttp :: Pair(ctx, req) -> Task(Pair(ctx, resp))
const doHttp = pair =>
  Task((rej, res) =>
    pair.merge((ctx, req) =>
      request(req, ((err, resp) =>
        err ? rej(err) : res(Pair(ctx, pickFromResponse(resp)))
      ))
    )
  )

// execute :: Pair(ctx, req) -> Pair(ctx, resp)
_.execute = pair =>
  Task.of(pair)
  .map(_.resolveTemplates)
  .chain(validateRequest)
  .chain(doHttp)

_.inspect = x => {
  console.log(util.inspect(x, { colors: true, compact: false }))
  return x
}

_.setHeader = (header, value) => pair =>
  pair.map(setPath(['headers', header], value))

_.setMethod = method => pair =>
  pair.map(assoc('method', method))

_.setUri = uri => pair =>
  pair.map(assoc('uri', uri))

//TODO: this is shit
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

const safeAssert = f => (...args) => pair =>
  Task((rej, res) => {
    try {
      _.resolveTemplates(Pair(fst(pair), args))
      .merge((ctx, resolvedArgs) =>
        f(...resolvedArgs)(pair)
      )

      return res(pair)
    } catch (e) {
      return rej(e)
    }
  })

const assertResponseCode = curry((code, pair) =>
  pair.merge((ctx, res) =>
    assert.equal(
      code,
      res.statusCode,
      'Response code assertion'
    )
  )
)

const assertResponseBodyPath = curry((path, value, pair) =>
  pair.merge((ctx, res) =>
    assert.match(
      evaluatePath(path, res),
      regexp(value),
      'Response body path assertion'
    )
  )
)

_.assertResponseCode = safeAssert(assertResponseCode)
_.assertResponseBodyPath = safeAssert(assertResponseBodyPath)

module.exports = _
