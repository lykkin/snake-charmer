#! /usr/bin/env node

'use strict'

const Module = require('module')
const path = require('path')
const fs = require('fs')

const es = require('esprima')

const util = require('./util')
const typer = require('./typer')
const callGrapher = require('./callGraph')
const { functionTypes, returnTypes, callTypes } = require('./tokenTypes')

// Keys we will be defining on the tokens as we iterate through them
const ourKeys = new Set([
  'calls',
  'parent',
  'returns'
])

// Replicates node's module loader so we can use node's machinery for route resolution
function getLoadNode(filename, parent, isMain) {
  try {
    var moduleFilename = Module._resolveFilename(filename, parent, isMain)
  } catch (e) {
    console.warn(`
      Could not find package ${filename}
    `)
    return {
      path: 'not found'
    }
  }
  var m = new Module(moduleFilename, parent)

  if (isMain) {
    m.id = '.'
  } else {
    m.id = moduleFilename
  }

  m.filename = moduleFilename

  m.paths = Module._nodeModulePaths(path.dirname(moduleFilename))

  var source = null
  if (path.extname(moduleFilename) === '.js') {
    source = es.parse(
      util.stripShebang(
        fs.readFileSync(moduleFilename).toString()
      )
    )
  }

  return {
    module: m,
    path: moduleFilename,
    source: source
  }
}

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
      }

      // Push nodes onto the stack and annotate nodes with their parents
      Object.keys(currentToken).forEach(function(key) {
        if (ourKeys.has(key)) {
          return
        }

        var value = currentToken[key]
        if (value && value instanceof Object) {
          if (Array.isArray(value)) {
            for (var i = 0; i < value.length; ++i) {
              value[i].parent = currentToken
            }
            Array.prototype.push.apply(toRelax, value)
          } else {
            value.parent = currentToken
            toRelax.push(value)
          }
        }
      })

      // Track which file the current file loads
      var requirePath = getRequirePath(currentToken)
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
        return getLoadNode(path, currentToken.module, false)
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

/*
 * ENTRY POINT
 */

try {
  var entryPath = process.argv[2]
  var root = getLoadNode(entryPath, null, true)
} catch (e) {
  console.log('could not load ' + entryPath)
  console.log('error', e)
  process.exit(1)
}

var graph = parseProgram(root)
console.log(graph)
