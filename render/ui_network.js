var fs = require('fs');
var path = require('path');
var graphlib = require("@dagrejs/graphlib");

module.exports = function (RED) {

    // check required configuration
    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_list.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        // TODO: This is ugly as hell. But who cares.
        return fs.readFileSync(path.resolve(__dirname, 'network_widget.html'), 'utf8')
    }


    function buildGraph(msg){
      var graph =  graphlib.json.read(msg.payload);
      console.log(graph);
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
            var done = null;
            if (checkConfig(node, config)) {
                // Generate HTML/Angular code
                var html = HTML(config);

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
                        // TODO: validate network structure
                        // TODO: store old msg, generate diff between old and new, ony emit new
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