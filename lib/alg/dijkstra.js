var _ = require("lodash"),
    PriorityQueue = require("@dagrejs/graphlib/lib/data/priority-queue");

module.exports = dijkstra;

var DEFAULT_WEIGHT_FUNC = _.constant(1);

function dijkstra(g, source, weightFn, edgeFn) {
    return runDijkstra(this.msg, this.flow, this.global, g, String(source),
        weightFn || DEFAULT_WEIGHT_FUNC,
        edgeFn || function (v) {
            return g.outEdges(v);
        });
}

function runDijkstra(msg, flow, global, g, source, weightFn, edgeFn) {
    var results = {},
        pq = new PriorityQueue(),
        v, vEntry;

    var updateNeighbors = function (edge) {
        var w = edge.v !== v ? edge.v : edge.w,
            wEntry = results[w],
            weight = weightFn(edge, g, msg, flow, global),
            distance = vEntry.distance + weight;
        if (weight < 0) {
            throw new Error("dijkstra does not allow negative edge weights. " +
                "Bad edge: " + edge + " Weight: " + weight);
        }
        if (distance < wEntry.distance) {
            wEntry.distance = distance;
            wEntry.predecessor = v;
            pq.decrease(w, distance);
        }
    };

    g.nodes().forEach(function (v) {
        var distance = v === source ? 0 : Number.POSITIVE_INFINITY;
        results[v] = {distance: distance};
        pq.add(v, distance);
    });

    while (pq.size() > 0) {
        v = pq.removeMin();
        vEntry = results[v];
        if (vEntry.distance === Number.POSITIVE_INFINITY) {
            break;
        }
        edgeFn(v, g, msg, flow, global).forEach(updateNeighbors);

    }
    return results;
}
