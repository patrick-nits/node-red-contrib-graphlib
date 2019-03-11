var lib = require("@dagrejs/graphlib");

lib.Graph.prototype.nodeObj = require('./graph').nodeObj;

lib.Graph.prototype.nodeObjs = require('./graph').nodeObjs;

lib.Graph.prototype.selectNodeObjs = require('./graph').selectNodeObjs;

lib.Graph.prototype.filterNodeObjs = require('./graph').filterNodeObjs;

lib.alg.dijkstra = require('./alg').dijkstra;

lib.alg.dijkstraAll = require('./alg').dijkstraAll;

lib.alg.floydWarshall = require('./alg').floydWarshall;

lib.alg.prim = require('./alg').prim;

module.exports = {
    Graph: lib.Graph,
    json: lib.json,
    alg: lib.alg,
    version: lib.version
};
