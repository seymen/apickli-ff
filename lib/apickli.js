const { assoc, Async: Task, constant, curry, hasProp, hasPropPath, ifElse, isEmpty, Pair, pick, propOr, setPath, propPathOr, unless } = require('crocks')
const requestLib = require('request')
const assert = require('chai').assert
const jsonValidate = require('is-my-json-valid');

const util = require('./util')

let defaultContext = {
  variables: {},
  templateChar: '`',
  fixturesDirectory: './test/features/fixtures/'
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

const pickFromResponse = resp =>
  pick(['statusCode', 'headers', 'body'], resp)

const templateRegExp = ctx =>
  util.regexp(`${ctx.templateChar}(\\w*)${ctx.templateChar}`, 'gi')

// replaceTemplated :: Pair(ctx, str) -> str
const replaceAllTemplated = pair =>
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

// resolveTemplates :: Pair(ctx, a) -> b
const resolveTemplates = pair =>
  pair
  .map(JSON.stringify) // -> Pair(ctx, str)
  .extend(replaceAllTemplated) // -> Pair(ctx, str)
  .map(JSON.parse) // -> Pair(ctx, obj)
  .snd() // -> obj

// validateRequest :: Pair(ctx, a) -> Task Pair err
const rejectIfTemplatesUnresolved = pair =>
  Task((rej, res) =>
    pair
    .map(JSON.stringify)
    .extend(getAllTemplated)
    .map(ifElse(
      isEmpty,
      () => res(pair),
      templated => rej(`There are unresolved variables: ${templated}`)
    ))
  )

// request :: req -> ctx -> Task Pair(ctx, req)
const request = (req, ctx = {}) =>
  Pair(ctx, req)
  .bimap(
    util.merge(defaultContext),
    util.merge(defaultRequest)
  )

// doHttp :: Pair(ctx, req) -> Task(Pair(ctx, resp))
const doHttp = pair =>
  Task((rej, res) =>
    pair.merge((ctx, req) => {
      // util.inspect(req)
      return requestLib(req, ((err, resp) => {
        // util.inspect(resp.body)
        return err ? rej(err) : res(Pair(ctx, pickFromResponse(resp)))
      }))
    })
  )

// execute :: Pair(ctx, a) -> Pair(ctx, b)
const execute = pair =>
  Task.of(pair)
  .map(p => p.extend(resolveTemplates))
  .chain(rejectIfTemplatesUnresolved)
  .chain(doHttp)

const setUri = curry((uri, pair) =>
  pair.map(assoc('uri', uri))
)

const setMethod = curry((method, pair) =>
  pair.map(assoc('method', method))
)

const getHeader = curry((header, req) =>
  propPathOr('', ['headers', header], req)
)

const setHeader = curry((header, value, pair) =>
  pair.map(setPath(['headers', header], value))
)

const setCookie = curry((cookie, pair) =>
  pair
  .map(getHeader('Cookie')) // -> Pair(ctx, str)
  .map(util.append(cookie, ';')) // -> Pair(ctx, newStr)
  .merge((ctx, newCookieValue) =>
    setHeader('Cookie', newCookieValue, pair)
  )
)

const setFormParameter = curry((name, value, pair) =>
  pair.map(setPath(['form', name], value))
)

const setBody = curry((body, pair) =>
  pair.map(assoc('body', body))
)

const setQueryParameter = curry((name, value, pair) =>
  pair.map(util.pushToArrayAtPath(value, ['qs', name]))
)

const _assertResponseCode = curry((code, pair) =>
  pair.map(res =>
    assert.match(
      res.statusCode,
      util.regexp(code),
      'Response code assertion'
    )
  )
)

const _assertResponseHeader = curry((name, value, pair) =>
  pair
  .map(
    unless(
      hasPropPath(['headers', name.toLowerCase()]),
      () => assert.fail(`Response doesn't contain header ${name}`)
    ))
  .map(res =>
    assert.match(
      res.headers[name.toLowerCase()],
      util.regexp(value),
      'Response header assertion'
    )
  )
)

const _assertResponseBodyPath = curry((path, value, pair) =>
  pair.merge((ctx, res) =>
    util.evaluatePath(path, res.body)
    .either(
      e => assert.fail(`Error during path evaluation: ${e}`),
      result =>
        result.either(
          () => assert.fail(`Path evaluation did not find any matches for ${path}`),
          x => assert.match(
            x,
            util.regexp(value),
            'Response body path assertion'
          )
        )
    )
  )
)

const _assertResponseBodyContains = curry((content, pair) =>
  pair
  .map(
    unless(
      hasProp('body'),
      () => assert.fail('Response expected to contain body')
    ))
  .map(res =>
    assert.match(
      res.body,
      util.regexp(content),
      'Response body contains assertion'
    )
  )
)

const _assertResponseBodyWithSchema = curry((schema, pair) =>
  pair
  .map(JSON.parse)
  .map(
    unless(
      jsonValidate(JSON.parse(schema), {verbose: true}),
      assert.fail('Response body is not valid according to the given json schema')
    )
  )
)

const safeAssertWithTemplateResolution = f => (...args) => pair =>
  Task((rej, res) => {
    try {
      pair
      .extend(constant(args))
      .extend(resolveTemplates)
      .map(resolvedArgs => f(...resolvedArgs)(pair))

      return res(pair)
    } catch (e) {
      return rej(e)
    }
  })

const assertResponseCode = safeAssertWithTemplateResolution(_assertResponseCode)
const assertResponseHeader = safeAssertWithTemplateResolution(_assertResponseHeader)
const assertResponseBodyPath = safeAssertWithTemplateResolution(_assertResponseBodyPath)
const assertResponseBodyContains = safeAssertWithTemplateResolution(_assertResponseBodyContains)
const assertResponseBodyWithSchema = safeAssertWithTemplateResolution(_assertResponseBodyWithSchema)

module.exports = {
  request,
  setBody,
  setHeader,
  setMethod,
  setUri,
  setCookie,
  setFormParameter,
  setQueryParameter,
  execute,
  assertResponseBodyPath,
  assertResponseBodyContains,
  assertResponseBodyWithSchema,
  assertResponseCode,
  assertResponseHeader
}
