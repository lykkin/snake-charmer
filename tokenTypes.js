'use strict'

const functionTypes = new Set([
  'ArrowFunctionExpression',
  'FunctionExpression',
  'AsyncFunction',
  'Program',
  'FunctionDeclaration'
])

const returnTypes = new Set([
  'YieldExpression',
  'ReturnStatement'
])

const callTypes = new Set([
  'CallExpression',
  'NewExpression'
])

module.exports = { functionTypes, returnTypes, callTypes }
