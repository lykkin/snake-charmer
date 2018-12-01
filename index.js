#! /usr/bin/env node

'use strict'

const loader = require('./loader')

var graph = loader.loadAndParseFromPath(process.argv[2])
console.log(Object.keys(graph))
