//TODO: exception output is shit

const { assoc, Async: Task, compose, curry, Either, Identity, Pair, pick, propOr, setPath, substitution: S, tap } = require('crocks')
const deepmerge = require('deepmerge')
const request = require('request')
const assert = require('chai').assert
const jsonPath = require('JSONPath')
const util = require('util')

const { Left, Right } = Either
const { fromNode, Resolved: of } = Task

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

const getTemplateExpression = ctx =>
  new RegExp(`${ctx.templateChar}(\\w*)${ctx.templateChar}`, 'gi')

const replaceTemplated = curry((ctx, str) =>
  Pair(ctx,
    str.replace(
      getTemplateExpression(ctx),
      varName => propOr(
        varName, // value if template couldn't be resolved
        varName.replace(/`/g, ''), // property name in ctx.variables
        ctx.variables
      )
    )
  )
)

const resolveTemplates = pair =>
  pair
    .map(JSON.stringify)
    .merge(replaceTemplated) // -> Pair(ctx, requestString)
    .map(JSON.parse) // -> Pair(ctx, request)

// Task.of(obj)
// .map(JSON.stringify)
// .map(replaceTemplated(ctx))
// .map(JSON.parse)

const pickFromResponse = pair => {
  const a = pair.map(pick(['statusCode', 'headers', 'body']))
  console.log('picker:', a.snd())
  return a
}

const pairWith = fst => x =>
  Pair(fst, x)

_.execute = pair =>
  Task.of(pair)
    .map(resolveTemplates) // Task(Pair(ctx,request)
    .chain(doHttp) // Task(Pair(ctx, response))
    .map(pickFromResponse)

  // resolveTemplates(pair)
  //   .map(doHttp) // -> Pair(ctx, Task(response))

const doHttp = pair => {
  // const t = Task.node(done =>
  //   request(pair.snd(), done)
  // )
  const t =
    Task((rej, res) =>
      request(pair.snd(), ((err, resp) =>
        err ? rej(err) : res(pairWith(pair.fst(), resp))
      ))
    )

  return t
}

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

const pairToTask = (ctx, req) =>
  Identity(Pair(ctx, req))

// request :: req ctx -> Identity Pair
_.request = curry((req, ctx) =>
  Pair(ctx, req)
  .bimap(mergeWithDefaultContext, mergeWithDefaultRequest)
  .merge(pairToTask)
)

_.inspect = x => {
  console.log(util.inspect(x, { colors: true, compact: false }))
  return x
}

_.setHeader = (header, value) => pair =>
  pair.map(setPath(['headers', header], value))

_.setMethod = method => request =>
  assoc('method', method, request)

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

//TODO: ctx is required here
_.assertResponseCode = curry((code, pair) =>
  assert.equal(
    pair.snd().statusCode,
    code,
    'Response code assertion'
  )
)

_.assertResponseBodyPath = curry((path, value, pair) => {
  assert.match(
    evaluatePath(path, pair.snd()),
    new RegExp(value),
    'Response body path assertion'
  )
  return pair
})

module.exports = _
