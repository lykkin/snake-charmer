'use strict'

const { functionTypes } = require('./tokenTypes')

function parseReturnToken(token) {
  // Mark the nearest parent block as terminal.
  // This data will be used when determining if a function implicitly returns.
  var parentBlockToken = token
  while (parentBlockToken.type !== 'BlockStatement') {
    parentBlockToken = parentBlockToken.parent
  }

  parentBlockToken.isTerminal = true

  // Record the argument of the return statement for later determining
  // the function return types.
  var parentFunctionToken = parentBlockToken
  while (!functionTypes.has(parentFunctionToken.type)) {
    parentFunctionToken = parentFunctionToken.parent
  }
  parentFunctionToken.returns.push(token.argument)
}

function parseBlockToken(token) {
  // We want to keep track of what a function defines.
  // This data will be used when we attempt to resolve a type, as we can
  // go up the parent tokens looking for the nearest block that defines
  // the variable.
  // Mutations will be used to determine if the given variable is
  // polymorphic, on the way up the parent blocks we can collect
  // mutation types.

  // These maps will be of type identifier to type

  token.declares = {}
  token.mutates = {}

  for (let entry of token.body) {
    if (entry.type === 'VariableDeclaration') {
      for (let declaration of entry.declarations) {
        token.declares[declaration.id.name] = declaration.init
      }
    } else if (entry.type === 'ExpressionStatement') {
    }

  }
}

module.exports = { parseReturnToken, parseBlockToken }
