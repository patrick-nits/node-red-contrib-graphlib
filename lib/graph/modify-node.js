var _ = require("lodash");

module.exports = changeFnNodeObjs;

function changeFnNodeObjs(change, filter) {
    var copy = new this.constructor({
        directed: this._isDirected,
        multigraph: this._isMultigraph,
        compound: this._isCompound
    });
    var graph = this;

    copy.setGraph(this.graph());

    _.each(this._nodes, _.bind(function (value, v) {
        if (filter(v, value, graph, copy, graph.msg, graph.flow, graph.global)) {
            copy.setNode(...change(v, value, graph, copy, graph.msg, graph.flow, graph.global));
        } else {
            copy.setNode(v,value);
        }
    }, this));

    _.each(this._edgeObjs, _.bind(function (e) {
        if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
            copy.setEdge(e, this.edge(e));
        }
    }, this));

    var self = this;
    var parents = {};

    function findParent(v) {
        var parent = self.parent(v);
        if (parent === undefined || copy.hasNode(parent)) {
            parents[v] = parent;
            return parent;
        } else if (parent in parents) {
            return parents[parent];
        } else {
            return findParent(parent);
        }
    }

    if (this._isCompound) {
        _.each(copy.nodes(), function (v) {
            copy.setParent(v, findParent(v));
        });
    }
    return copy;
}