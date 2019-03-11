module.exports = selectNodeObjs;

function selectNodeObjs(filter) {
    var graph = this.filterNodeObjs(filter);
    return graph.nodeObjs(graph.nodeObjs());
}