module.exports = function (RED) {
    "use strict";

    // Graph Configuration Node
    function DrawConfigNode(config) {
        // Create this node
        RED.nodes.createNode(this, config);
        var node = this;
        node.config = config;
    }

    RED.nodes.registerType("draw-config", DrawConfigNode);
};
