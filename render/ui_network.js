var fs = require('fs');
var path = require('path');
var graphlib = require("../lib");

module.exports = function (RED) {

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_list.error.no-group"));
            return false;
        }
        return true;
    }

    /**
     * Ugliest way to add angular directive(?). Todo, obviously.
     *
     * @param config
     * @returns {*}
     */
    NetworkNode.prototype.html = function(config) {
        return fs.readFileSync(path.resolve(__dirname, 'network_widget.html'), 'utf8')
    };

    NetworkNode.prototype.setGraph = require('../lib/func').set_graph;

    function buildGraph(msg){
      var node = this;
      node.setGraph(msg);

      return {msg: graph};
    }

    var ui = undefined;

    function NetworkNode(config) {
        try {
            var node = this;
            if (ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            node.draw_config = RED.nodes.getNode(config.draw_config).config;

            var done = null;
            if (checkConfig(node, config)) {
                // Generate HTML/Angular code
                var html = node.html(config);

                done = ui.addWidget({
                    node: node,
                    width: config.width,
                    height: config.height,
                    format: html,
                    templateScope: "local",
                    group: config.group,
                    emitOnlyNewValues: true,
                    forwardInputMessages: true,
                    storeFrontEndInputAsState: false,
                    beforeEmit: function(msg, value) {
                        return buildGraph(msg);
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
        node.on("close", function () {
            if (done) {
                // finalize widget on close
                done();
            }
        });
    }

    // register ui_list node
    RED.nodes.registerType('graphlib_render', NetworkNode);
};