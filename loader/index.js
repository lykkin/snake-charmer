'use strict'

const Module = require('module')
const path = require('path')
const fs = require('fs')

const es = require('esprima')

const util = require('../util')

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
      path: null
    }
  }

  let source = null
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
  const loadPaths = []

  if (rootToken != null) {
    const toRelax = [rootToken]

    while (toRelax.length) {
      const currentToken = toRelax.pop()
      if (!currentToken) {
        console.log(currentToken)
        continue
      }
      // Push nodes onto the stack and annotate nodes with their parents
      for (let key of Object.keys(currentToken)) {
        const value = currentToken[key]
        if (value && value instanceof Object) {
          if (Array.isArray(value)) {
            Array.prototype.push.apply(toRelax, value)
          } else {
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
    loadPaths
  }
}

function parseProgram(root) {
  const loads = {}
  const toRelax = [root]
  while (toRelax.length) {
    const currentToken = toRelax.pop()

    const tokPath = currentToken.path
    if (tokPath && !loads[tokPath]) {
      const { loadPaths } = getMetaData(currentToken.source)

      const nodes = loads[tokPath] = loadPaths.map(function(path) {
        return getLoadNode(path, currentToken.path)
      })

      toRelax.push(...nodes)
    }
  }
  return loads
}

function getRequirePath(token) {
  if (token.type === 'CallExpression' && token.callee.name === 'require' && token.arguments[0].type === 'Literal') {
    return token.arguments[0].value
  }
}

module.exports = {
  loadAndParseFromPath: function loadAndParseFromPath(entryPath) {
    let root
    try {
      root = getLoadNode(entryPath, '.')
    } catch (e) {
      // TODO: more graceful error handling when this is used for something
      console.log('could not load ' + entryPath)
      console.log('error', e)
      process.exit(1)
    }

    return parseProgram(root)
  }
}
