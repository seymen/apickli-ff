const { compose, concat, curry, Either, equals, Identity, ifElse, isEmpty, map, Maybe, nAry, propOr, propPathOr, setPath } = require('crocks')
const deepmerge = require('deepmerge')
const jsonPath = require('JSONPath')
const xmlPath = require('xpath.js');
const domParser = require('xmldom').DOMParser

const log = require('./log')

const { Left, Right } = Either
const { Just, Nothing } = Maybe

const first = a => a[0]

const trim = str =>
  str.trim()

const merge = curry(
  def => obj => deepmerge(def, obj)
)

const inspect = x => {
  log(x)
  return x
}

const regexp = exp =>
  new RegExp(exp, 'g')

const pushToArrayAtPath = curry((item, path, obj) =>
  Identity(obj)
  .map(propPathOr([], path))
  .map(concat([item]))
  .map(newArray => setPath(path, newArray, obj))
  .valueOf()
)

const append = (str2, sep = '') => str1 =>
  ifElse(
    isEmpty,
    s => `${s}${str2}`,
    s => `${s}${sep}${str2}`
  )(str1)

const prepend = (str1, sep) => str2 =>
  `${str1}${sep}${str2}`

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

module.exports = {
  append,
  evaluatePath,
  first,
  inspect,
  merge,
  prepend,
  pushToArrayAtPath,
  regexp,
  trim
}
