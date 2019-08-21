#! /usr/bin/env node
'use strict'

const path = require('path')

const loader = require('./loader')
const loadGraph = loader.loadAndParseFromPath(path.resolve('.', process.argv[2]))
const paths = Object.keys(loadGraph)

const needle = path.resolve('.', process.argv[3])
const containingNeedle = []
for (let path of paths) {
  if (loadGraph[path].map(n => n.path).includes(needle)) {
    containingNeedle.push(path)
  }
}

console.log(containingNeedle)
