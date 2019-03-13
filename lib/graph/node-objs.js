module.exports = nodeObjs;

function nodeObjs(v_arr) {
    var nodes = this._nodes;
    // v_arr is empty -> return all nodeObjs
    v_arr = Array.isArray(v_arr) ? v_arr : v_arr.split(',');
    if (v_arr) {
        return Object.keys(nodes).reduce(function (result, e) {
            if ((v_arr).some(v => v === e)) {
                var nodeObj = nodes[e] || {};
                nodeObj.v = e;
                result.push(nodeObj);
            }
            return result;
        }, []);
        //v_arr is argument list, splat args to array
    } else {
        return Object.keys(nodes).reduce(function (result, e) {
            if ((Object.keys(arguments).map((k) => arguments[k])).some(v => v === e)) {
                var nodeObj = nodes[e] || {};
                nodeObj.v = e;
                result.push(nodeObj);
            }
            return result;
        }, []);
    }
}