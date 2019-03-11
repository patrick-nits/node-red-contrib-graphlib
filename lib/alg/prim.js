var _ = require("lodash"),
    graphlib = require("@dagrejs/graphlib"),
    PriorityQueue = require("@dagrejs/graphlib/lib/data/priority-queue");

module.exports = prim;

function prim(g, weightFunc) {
  console.log(typeof graphlib.Graph);
  var result = new graphlib.Graph(),
      parents = {},
      pq = new PriorityQueue(),
      v;
  var _this = this;

  function updateNeighbors(edge) {
    var w = edge.v === v ? edge.w : edge.v,
        pri = pq.priority(w);
    if (pri !== undefined) {
      var edgeWeight = weightFunc(edge, g, _this.msg, _this.flow, _this.global);
      if (edgeWeight < pri) {
        parents[w] = v;
        pq.decrease(w, edgeWeight);
      }
    }
  }

  if (g.nodeCount() === 0) {
    return result;
  }

  _.each(g.nodes(), function(v) {
    pq.add(v, Number.POSITIVE_INFINITY);
    result.setNode(v);
  });

  // Start from an arbitrary node
  pq.decrease(g.nodes()[0], 0);

  var init = false;
  while (pq.size() > 0) {
    v = pq.removeMin();
    if (_.has(parents, v)) {
      result.setEdge(v, parents[v]);
    } else if (init) {
      throw new Error("Input graph is not connected: " + g);
    } else {
      init = true;
    }

    g.nodeEdges(v).forEach(updateNeighbors);
  }

  return result;
}