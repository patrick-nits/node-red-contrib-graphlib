var graphlib = require("../../lib");

module.exports = function (RED) {

    /**
     * Uses node.graph_config to parse graph from message and make it compatible with graphlib.json.read.
     *
     * @param {array} nodes - List of nodes to parse.
     * @param {array} edges - List of edges to parse.
     * @returns {{nodes: *, edges: *}}
     */
    GraphNode.prototype.transformGraph = function (nodes, edges) {
        var node = this;


        var id = function () {
            return '_' + Math.random().toString(36).substr(2, 9);
        };

        if (typeof nodes === "undefined" || typeof edges === "undefined") {
            throw "Message has no nodes or edges: " + nodes + edges;
        }

        nodes.forEach(function (graph_node, index) {
            this[index] = {
                v: RED.util.getMessageProperty(graph_node, node.graph_config.node_id_key),
                value: graph_node
            }
        }, nodes);

        edges.forEach(function (edge_node, index) {
            this[index] = {
                v: RED.util.getMessageProperty(edge_node, node.graph_config.edge_from_key),
                w: RED.util.getMessageProperty(edge_node, node.graph_config.edge_to_key),
                value: {
                    label: node.graph_config.edge_label_key ? RED.util.getMessageProperty(edge_node, node.graph_config.edge_label_key) : '',
                    value: edge_node,
                    id: node.graph_config.edge_id_key ? RED.util.getMessageProperty(edge_node, node.graph_config.edge_id_key) : id()
                }
            }
        }, edges);
        return {edges: edges, nodes: nodes};
    };

    /**
     * Builds graphlib Graph from message.
     *
     * @param msg
     * @returns {Graph} - Graphlib graph object to work with. Will be passed along the flow.
     */
    GraphNode.prototype.buildGraph = function (msg) {
        var node = this;
        var graph;
        var nodes;
        var edges;

        nodes = RED.util.getMessageProperty(msg, node.graph_config.node_arr_key);
        edges = RED.util.getMessageProperty(msg, node.graph_config.edge_arr_key);

        if (node.graph_config.flush) {
            graph = new graphlib.Graph(node.graph_config);
        } else if (typeof nodes !== "undefined" || typeof edges !== "undefined") {
            graph = node.transformGraph(nodes, edges);
        } else {
            throw "Cannot create graph from message. " + msg;
        }

        graph.options = {
            multigraph: node.graph_config.multigraph,
            compound: node.graph_config.compound,
            directed: node.graph_config.directed
        };
        graph = graphlib.json.read(graph);
        return graph;
    };

    /**
     * Builds message to pass along the flow.
     *
     * @param {NodeRED Message} orig_msg - Unmodified, incoming message.
     * @param {Graph} graph - Graphlib graph to add to new message.
     * @returns {NodeRED Message} - Message with graph added. Graph will be available as msg.graph.
     */
    GraphNode.prototype.buildMsg = function (orig_msg, graph) {
        var node = this;
        if (node.config.json_output) {
            orig_msg.graph = graphlib.json.write(graph);
        } else {
            orig_msg.graph = graph;

        }
        return orig_msg;

    };

    /**
     *
     * @param {NodeRED Node Config} config - Configuration object from NodeRED for create node.
     * @constructor
     */
    function GraphNode(config) {
        try {
            RED.nodes.createNode(this, config);
            var node = this;

            node.config = config;
            node.graph_config = RED.nodes.getNode(config.graph_config).config;

            this.on('input', function (msg) {
                var graph = node.buildGraph(msg);
                node.send(node.buildMsg(msg, graph));
            });


        } catch (e) {
            console.log(e);
        }
        node.on("close", function () {

        });
    }

    RED.nodes.registerType('graph_create', GraphNode);
};