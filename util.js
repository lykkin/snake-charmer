'use strict'

//lifted from internals
/**
 * Find end of shebang line and slice it off
 */
function stripShebang(content) {
  // Remove shebang
  var contLen = content.length;
  if (contLen >= 2) {
    if (content.charCodeAt(0) === 35/*#*/ &&
        content.charCodeAt(1) === 33/*!*/) {
      if (contLen === 2) {
        // Exact match
        content = '';
      } else {
        // Find end of shebang line and slice it off
        var i = 2;
        for (; i < contLen; ++i) {
          var code = content.charCodeAt(i);
          if (code === 10/*\n*/ || code === 13/*\r*/)
            break;
        }
        if (i === contLen)
          content = '';
        else {
          // Note that this actually includes the newline character(s) in the
          // new output. This duplicates the behavior of the regular expression
          // that was previously used to replace the shebang line
          content = content.slice(i);
        }
      }
    }
  }
  return content;
}

// Class to test the equality of variables
class DisjointSetNode {
  constructor(value, parent=null) {
    this.value = value
    this.parent = parent
  }

  get root() {
    if (!this.parent) {
      return this
    }

    // Path compress while we traverse
    return this.parent = this.parent.root
  }

  set root(newRoot) {
    var currNode = this
    while (currNode.parent) {
      // Path compress while we traverse
      var oldParent = currNode.parent
      currNode.parent = newRoot
      currNode = oldParent
    }

    return currNode.parent = newRoot
  }

  equals(node) {
    return this.root === node.root
  }

  union(node) {
    this.root = node
  }
}

module.exports = {
  stripShebang,
  DisjointSetNode
}
