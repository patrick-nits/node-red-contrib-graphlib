module.exports = nodeObjs;

function nodeObjs(v_arr) {
    var nodes = this._nodes;

    // v_arr is empty -> return all nodeObjs
    if (arguments.length < 1) {
        return Object.keys(nodes).reduce(function (result, e) {
            result.push(nodes[e]);
            return result;
        }, []);

        // v_arr is array, filter by array
    } else if (arguments.length === 1) {
        v_arr = Array.isArray(v_arr) ? v_arr : v_arr.split(',');
        return Object.keys(nodes).reduce(function (result, e) {
            if ((v_arr).some(v => v === e)) {
                result.push(nodes[e]);
            }
            return result;
        }, []);
        //v_arr is argument list, splat args to array
    } else {
        return Object.keys(nodes).reduce(function (result, e) {
            if ((Object.keys(arguments).map((k) => arguments[k])).some(v => v === e)) {
                result.push(nodes[e]);
            }
            return result;
        }, []);
    }
}