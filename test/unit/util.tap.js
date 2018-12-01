'use strict'

const util = require ('../../util.js')
const tap = require('tap')

const DisjointSetNode = util.DisjointSetNode
tap.test('DisjointSetNode', (t) => {
  t.autoend()
  t.test('should properly compare two values after union', (t) => {
    var firstNode = new DisjointSetNode(1)
    var secondNode = new DisjointSetNode(2)
    t.notOk(firstNode.equals(secondNode))
    firstNode.union(secondNode)
    t.ok(firstNode.equals(secondNode))
    t.end()
  })

  t.test('should properly compare two values after union regardless of order', (t) => {
    var firstNode = new DisjointSetNode(1)
    var secondNode = new DisjointSetNode(2)
    t.notOk(firstNode.equals(secondNode))
    firstNode.union(secondNode)
    t.ok(secondNode.equals(firstNode))
    t.end()
  })

  t.test('should compress parent path on root get', (t) => {
    var firstNode = new DisjointSetNode(1)
    var secondNode = firstNode.parent = new DisjointSetNode(2)
    var thirdNode = secondNode.parent = new DisjointSetNode(3)
    var fourthNode = thirdNode.parent = new DisjointSetNode(4)
    t.equals(firstNode.root, fourthNode)
    t.equals(secondNode.parent, fourthNode)
    t.equals(thirdNode.parent, fourthNode)
    t.end()
  })

  t.test('should compress parent path on root set', (t) => {
    var firstNode = new DisjointSetNode(1)
    var secondNode = firstNode.parent = new DisjointSetNode(2)
    var thirdNode = secondNode.parent = new DisjointSetNode(3)
    var fourthNode = thirdNode.parent = new DisjointSetNode(4)
    var fifthNode = firstNode.root = new DisjointSetNode(5)
    t.equals(firstNode.parent, fifthNode)
    t.equals(secondNode.parent, fifthNode)
    t.equals(thirdNode.parent, fifthNode)
    t.equals(fourthNode.parent, fifthNode)
    t.end()
  })
})
