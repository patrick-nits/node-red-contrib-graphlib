module.exports = nodeObj;

function nodeObj(v) {
    console.log(v);
    return this._nodes[v] || {};
}
