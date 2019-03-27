var fs = require('fs');
var path = require('path');
var graphlib = require("../../lib");
var vis = require("vis");

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
     * @returns {*}
     */
    NetworkNode.prototype.html = function () {
        return fs.readFileSync(path.resolve(__dirname, 'network_widget.html'), 'utf8')
    };

    NetworkNode.prototype.setGraph = require('../../lib/func').set_graph;

    NetworkNode.prototype.buildOptions = function (msg) {
        var node = this;

        return {
            configure: RED.util.evaluateNodeProperty(node.draw_config.configure, node.draw_config.configure_type, node, msg) || {},
            edges: RED.util.evaluateNodeProperty(node.draw_config.edges, node.draw_config.edges_type, node, msg) || {},
            groups: RED.util.evaluateNodeProperty(node.draw_config.groups, node.draw_config.groups_type, node, msg) || {},
            interaction: RED.util.evaluateNodeProperty(node.draw_config.interaction, node.draw_config.interaction_type, node, msg) || {},
            layout: RED.util.evaluateNodeProperty(node.draw_config.layout, node.draw_config.layout_type, node, msg) || {},
            manipulation: RED.util.evaluateNodeProperty(node.draw_config.manipulation, node.draw_config.manipulation_type, node, msg) || {},
            nodes: RED.util.evaluateNodeProperty(node.draw_config.nodes, node.draw_config.nodes_type, node, msg) || {},
            physics: RED.util.evaluateNodeProperty(node.draw_config.physics, node.draw_config.physics_type, node, msg) || {}
        }
    };

    NetworkNode.prototype.buildGraph = function (msg) {
        var node = this;
        node.setGraph(msg);
        msg.payload = {
            options: node.buildOptions(msg),
            data: {
                nodes: node.graph.nodes().map(function (v) {
                    var nodeObj = node.graph.nodeObj(v);
                    return Object.assign({}, nodeObj, {
                        id: v,
                        label: node.config.func.labelFn(v, nodeObj, msg, node.flow, node.global),
                        title: node.config.func.titleFn(v, nodeObj, msg, node.flow, node.global),
                        group: node.config.func.groupFn(v, nodeObj, msg, node.flow, node.global),
                    });
                }),
                edges: node.graph.edges().map(function (e) {
                    var label = node.graph.edge(e);
                    return {id: label.id, from: e.v, to: e.w, label: label.label}
                })
            },
            callback: node.draw_config.graphCallbackFns
        };
        return msg;
    };

    var ui = undefined;

    function NetworkNode(config) {
        try {
            var node = this;
            var done = null;
            if (ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            node.draw_config = RED.nodes.getNode(config.draw_config).config;
            node.flow = node.context().flow;
            node.global = node.context().global;
            node.config = config;
            node.config.func = {
                titleFn: new Function('v', 'value', 'msg', 'flow', 'global', node.draw_config.titleFn),
                labelFn: new Function('v', 'value', 'msg', 'flow', 'global', node.draw_config.labelFn),
                groupFn: new Function('v', 'value', 'msg', 'flow', 'global', node.draw_config.groupFn),
            };
            if (checkConfig(node, config)) {
                done = ui.addWidget({
                    node: node,
                    width: config.width,
                    height: config.height,
                    format: node.html(),
                    templateScope: "local",
                    group: config.group,
                    emitOnlyNewValues: true,
                    forwardInputMessages: true,
                    storeFrontEndInputAsState: false,
                    beforeEmit: function (msg) {
                        return {msg: node.buildGraph(msg)};
                    },
                    initController: function ($scope, events) {
                        $scope.containerId = Math.random().toString(36).substring(7);
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