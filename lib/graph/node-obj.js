module.exports = nodeObj;

function nodeObj(v) {
    return this._nodes[v] || {};
}