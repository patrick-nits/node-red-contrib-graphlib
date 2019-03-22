module.exports = function (RED) {
    "use strict";

    // Graph Configuration Node
    function WatsonConfig(config) {
        // Create this node
        RED.nodes.createNode(this, config);
        var node = this;
        node.config = config;
    }

    RED.nodes.registerType("watson-config", WatsonConfig);
};
