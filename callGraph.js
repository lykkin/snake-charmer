'use strict'

const { functionTypes } = require('./tokenTypes')

function parseCallToken(token) {
  var parentFunctionToken = token
  while (!functionTypes.has(parentFunctionToken.type)) {
    parentFunctionToken = parentFunctionToken.parent
  }
  parentFunctionToken.calls.push(token.callee)
}

module.exports = { parseCallToken }
