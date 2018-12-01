'use strict'

const Module = require('module')
const path = require('path')
const fs = require('fs')

const es = require('esprima')

const util = require('../util')
const typer = require('../typer')
const callGrapher = require('../callGraph')
const { functionTypes, returnTypes, callTypes } = require('../tokenTypes')

// Keys we will be defining on the tokens as we iterate through them
const ourKeys = new Set([
  'mutates',
  'declares',
  'calls',
  'parent',
  'returns'
])

// Returns an object of the AST and filename of a file
function getLoadNode(filename, parent) {
  const localRequire = Module.createRequireFromPath(parent)
  try {
    var moduleFilename = localRequire.resolve(filename)
  } catch (e) {
    console.warn(`
      Could not find package ${filename}
    `)
    return {
      path: 'not found'
    }
  }

  var source = null
  if (path.extname(moduleFilename) === '.js') {
    source = es.parse(
      util.stripShebang(
        fs.readFileSync(moduleFilename).toString()
      )
    )
  }

  return {
    path: moduleFilename,
    source
  }
}

// Parse the AST and pull out the data we are interested in
function getMetaData(rootToken) {
  var loadPaths = []
  var functionTokens = []

  if (rootToken != null) {
    var toRelax = [rootToken]

    while (toRelax.length) {
      var currentToken = toRelax.pop()

      const type = currentToken.type
      if (functionTypes.has(type)) {
        // Collect function tokens for later parsing
        functionTokens.push(currentToken)
        currentToken.calls = []
        currentToken.returns = []
      } else if (returnTypes.has(type)) {
        // Parse return statements immediately
        typer.parseReturnToken(currentToken)
      } else if (callTypes.has(type)) {
        // Parse call statements immediately
        callGrapher.parseCallToken(currentToken)
      } else if (type === 'BlockStatement') {
        typer.parseBlockToken(currentToken)
      }

      // Push nodes onto the stack and annotate nodes with their parents
      for (let key of Object.keys(currentToken)) {
        if (ourKeys.has(key)) {
          continue
        }

        var value = currentToken[key]
        if (value && value instanceof Object) {
          if (Array.isArray(value)) {
            for (let t of value) {
              t.parent = currentToken
            }
            Array.prototype.push.apply(toRelax, value)
          } else {
            value.parent = currentToken
            toRelax.push(value)
          }
        }
      }

      // Track which file the current file loads
      const requirePath = getRequirePath(currentToken)
      if (requirePath) {
        loadPaths.push(requirePath)
      }
    }
  }

  return {
    loadPaths,
    functionTokens
  }
}

function parseProgram(root) {
  var loads = {}
  var toRelax = [root]
  while (toRelax.length) {
    var currentToken = toRelax.pop()

    if (!loads[currentToken.path]) {
      var tokenMeta = getMetaData(currentToken.source)
      var fileLoads = tokenMeta.loadPaths
      currentToken.functionTokens = tokenMeta.functionTokens

      loads[currentToken.path] = fileLoads.map(function(path) {
        return getLoadNode(path, currentToken.path)
      })

      Array.prototype.push.apply(
        toRelax,
        loads[currentToken.path]
      )
    }
  }
  return loads
}

function getRequirePath(token) {
  if (token.type === 'CallExpression' && token.callee.name === 'require') {
    return token.arguments[0].value
  }
}

module.exports = {
  loadAndParseFromPath: function loadAndParseFromPath(entryPath) {
    try {
      var root = getLoadNode(entryPath, '.')
    } catch (e) {
      // TODO: more graceful error handling when this is used for something
      console.log('could not load ' + entryPath)
      console.log('error', e)
      process.exit(1)
    }

    return parseProgram(root)
  }
}
