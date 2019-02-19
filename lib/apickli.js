const { assoc, Async: Task, compose, curry, Either, equals, fst, isEmpty, ifElse, map, Maybe, nAry, Pair, pick, propOr, propPathOr, setPath } = require('crocks')
const deepmerge = require('deepmerge')
const request = require('request')
const assert = require('chai').assert
const jsonPath = require('JSONPath')
const xmlPath = require('xpath.js');
const domParser = require('xmldom').DOMParser
const util = require('util')

const { Left, Right } = Either
const { Just, Nothing } = Maybe

const merge = curry(
  def => obj => deepmerge(def, obj)
)

const first = a => a[0]

const trim = str =>
  str.trim()

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

const templateRegExp = ctx =>
  regexp(`${ctx.templateChar}(\\w*)${ctx.templateChar}`, 'gi')

const pairToTask = (ctx, req) =>
  Task.of(Pair(ctx, req))

// request :: req -> ctx -> Task Pair(ctx, req)
_.request = curry((ctx, req) =>
  Pair(ctx, req)
  .bimap(mergeWithDefaultContext, mergeWithDefaultRequest)
  // .merge(pairToTask)
)

// replaceTemplated :: Pair(ctx, str) -> str
const replaceTemplatedString = pair =>
  pair.merge((ctx, str) =>
    str.replace(
      templateRegExp(ctx),
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
      templateRegExp(ctx)
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
    .map(ifElse(
      isEmpty,
      () => res(pair),
      templated => rej(`There are unresolved variables in the request: ${templated}`)
    ))
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

_.setHeader = curry((header, value, pair) =>
  pair.map(setPath(['headers', header], value))
)

_.setMethod = curry((method, pair) =>
  pair.map(assoc('method', method))
)

_.setUri = curry((uri, pair) =>
  pair.map(assoc('uri', uri))
)

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

const tryCatch = f => {
  try {
    return Right(f())
  } catch (e) {
    return Left(e)
  }
}

const getJsonPath =
  nAry(3, jsonPath)({resultType: 'all'})

const getJsonPathResult = x => x.value

const tryEvaluateJsonPath = curry((path, content) =>
  tryCatch(() =>
    compose(
      map(getJsonPathResult),
      map(first),
      ifElse(isEmpty, Nothing, Just),
      getJsonPath
    )(path, JSON.parse(content))
  )
)

const _xmlAttributeNodeType = 2

const getMatchingDomNodes = (path, content) =>
  xmlPath(domParser.parseFromString(content), path)

const pickFromNodeObject = matchedNode => ({
  nodeType: propOr(null, 'nodeType', matchedNode),
  attributeValue: propOr(null, 'nodeValue', matchedNode),
  elementValue: propPathOr(null, ['firstChild', 'data'], matchedNode)
})

// getXPathResult :: a -> String
const getXPathResult = matchedNode =>
  (matchedNode.nodeType === _xmlAttributeNodeType)
  ? matchedNode.attributeValue
  : matchedNode.elementValue

const tryEvaluateXPath = curry((path, content) =>
  tryCatch(() =>
    compose(
      map(getXPathResult),
      map(pickFromNodeObject),
      map(first),
      ifElse(isEmpty, Nothing, Just),
      getMatchingDomNodes
    )(path, content)
  )
)

const isXml = content =>
  compose(
    equals('<'),
    first,
    trim
  )(content)

const evaluatePath = (path, content) =>
  ifElse(
    isXml,
    tryEvaluateXPath(path),
    tryEvaluateJsonPath(path)
  )(content)

const assertResponseBodyPath = curry((path, value, pair) =>
  pair.merge((ctx, res) =>
    evaluatePath(path, res.body)
    .either(
      e => assert.fail(`Error during path evaluation: ${e}`),
      result =>
        result.either(
          () => assert.fail(`Path evaluation did not find any matches for ${path}`),
          x => assert.match(
            x,
            regexp(value),
            'Response body path assertion'
          )
        )
    )
  )
)

_.assertResponseCode = safeAssert(assertResponseCode)
_.assertResponseBodyPath = safeAssert(assertResponseBodyPath)

module.exports = _
