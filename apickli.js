const R = require('ramda')

let defaultTest = {
    variables: {},
    variableChar: '`',
    fixturesDirectory: '',
}

let defaultRequest = {
    headers: {
        Cache: 'no-cache'
    },
    queryParameters: {}
}

const merge = def => o => R.mergeDeepLeft(o, def)

const initializeRequester = (test) => {
    test = R.mergeDeepLeft(test, defaultTest)

    return (req) =>
        R.compose(
            Request(test),
            merge(defaultRequest)
        )(req)
}

const Request = test => req =>
({
    map: f => Request(test)(f(req, test))
})

const setHeader = (name, value) => (req, test) => {
    req.headers[name] = value
    return req
}

module.exports = {
    initializeRequester,
    setHeader
}

// const Request = (x, scenarioOptions) =>
// ({
//     map: f => Request(f(x, R.clone(scenarioOptions)), scenarioOptions)
// })

// const Request = scenarioOptions =>
// ({
//     of: requestOptions => {
//         const options = Object.assign({}, requestOptions, defaultRequestOptions)

//         return ({
//             map: f => Request(scenarioOptions).of(f(options, R.clone(scenarioOptions)))
//         })
//     }
// })
