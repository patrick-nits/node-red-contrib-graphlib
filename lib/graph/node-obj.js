module.exports = nodeObj;

function nodeObj(v) {
    var nodeObj = this._nodes[v] || {};
    nodeObj.v = v;
    return nodeObj;
}