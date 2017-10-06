'use strict'

const { functionTypes } = require('./tokenTypes')

function parseReturnToken(token) {
  var parentBlockToken = token
  while (parentBlockToken.type !== 'BlockStatement') {
    parentBlockToken = parentBlockToken.parent
  }

  parentBlockToken.isTerminal = true

  var parentFunctionToken = parentBlockToken
  while (!functionTypes.has(parentFunctionToken.type)) {
    parentFunctionToken = parentFunctionToken.parent
  }
  parentFunctionToken.returns.push(token.argument)
}

module.exports = { parseReturnToken }
