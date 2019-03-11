var _ = require("lodash");

module.exports = dijkstraAll;

function dijkstraAll(g, weightFunc, edgeFunc) {
  var _this = this;
  return _.transform(g.nodes(), function(acc, v) {
    acc[v] = _this.dijkstra(g, v, weightFunc, edgeFunc);
  }, {});
}
