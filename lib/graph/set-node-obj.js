module.exports = setNodeObj;

function setNodeObj(nodeObj) {
    var _this = this;
    if (Array.isArray(nodeObj)) {
        nodeObj.forEach(function (nodeObj) {
            var v = nodeObj.v;
            var label = nodeObj;
            delete nodeObj.v;
            _this.setNode(v, label);
        });
    } else {
        var v = nodeObj.v;
        var label = nodeObj;
        delete nodeObj.v;
        _this.setNode(v, label);
    }
    return this;
}