module.exports = {
    /**
     * Sets msg.graph to node.graph.
     *
     * @param {NodeRED Message} msg - The message to get the current graph from.
     * @throws Error if msg does not contain a graph in msg.graph.
     */
    setGraph: function (msg) {
        var node = this;
        if (typeof msg.graph.nodes === 'function') {
            node.graph = msg.graph;
        } else {
            throw "Cannot call graphlib function. No Graph in Message. " + msg;
        }
    }
};