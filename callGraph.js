'use strict'

const { functionTypes } = require('./tokenTypes')

function parseCallToken(token) {
  // Keep track of all function calls.
  // This data will be used when determining a function's parameter types.
  var parentFunctionToken = token
  while (!functionTypes.has(parentFunctionToken.type)) {
    parentFunctionToken = parentFunctionToken.parent
  }
  parentFunctionToken.calls.push(token.callee)
}

module.exports = { parseCallToken }
