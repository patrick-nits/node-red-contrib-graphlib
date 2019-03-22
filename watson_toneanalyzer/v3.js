var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var graphlib = require("../lib");
var _ = require('lodash');

module.exports = function (RED) {

    WatsonToneAnalyzer.prototype.buildFns = function () {
        var node = this;
        node.filterFn = new Function('v', 'value', 'g_old', 'g_new', 'msg', 'flow', 'global', node.config.filterFn);
        node.propertySelectFn = new Function('v', 'value', 'msg', 'flow', 'global', node.config.propertySelectFn);
        node.propertyWriteFn = new Function('v', 'value', 'tones', 'msg', 'flow', 'global', node.config.propertyWriteFn);
    };

    /**
     * Builds trace for called functions on graph in flow.
     *
     * @param {NodeRED Message} msg
     * @param {Object} stack_obj - Holds function name, params, result and graph for traceability.
     * @returns {Array<Object>>} Each call of func_node adds another stack_obj to the msg.graph_func_stack.
     */
    WatsonToneAnalyzer.prototype.buildFuncStack = function (msg, stack_obj) {
        var node = this;
        var func_stack = [];

        if (typeof msg.graph_func_stack !== 'undefined' && msg.graph_func_stack.length && typeof msg.graph_func_stack.push === 'function') {
            func_stack = msg.graph_func_stack;
        }
        func_stack.push(stack_obj);
        return func_stack;
    };

    WatsonToneAnalyzer.prototype.analyze = function (msg) {
        var node = this;
        node.status({fill: "blue", shape: "ring", text: "requesting..."});
        var dragScope = function (scope) {
            scope.msg = msg;
            scope.flow = node.context().flow;
            scope.global = node.context().global;
            return scope;
        };
        var cleanScope = function (result, scope) {
            delete scope.msg;
            delete scope.flow;
            delete scope.global;
            if (result.result && result.result.graph) {
                delete result.result.graph.msg;
                delete result.result.graph.flow;
                delete result.result.graph.global;
            }
            return result;
        };
        var requestNbr = 0;
        var nodes = _.map(msg.graph.selectNodeObjs(node.filterFn), function (v) {
            return v
        });
        var totalRequests = nodes.length;
        dragScope(msg.graph);
        Promise.all(_.map(nodes, function (v) {
            return new Promise(function resolver(resolve, reject) {
                node.toneAnalyzer.tone(Object.assign({}, node.tone_params, {tone_input: node.propertySelectFn(v.v, v, msg, node.context().flow, node.context().global)}),
                    function (error, analysis) {
                        requestNbr = requestNbr +1;
                        node.status({fill: "blue", shape: "ring", text: "Request: " + requestNbr + " of " + totalRequests});
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                v: v.v,
                                value: v,
                                tones: analysis
                            })
                        }
                    });
            });
        })).then(function (data) {
            var result = _.map(data, function (d) {
                msg.graph.setNode(d.v, node.propertyWriteFn(d.v, d.value, d.tones));
                return msg.graph.node(d.v);
            });
            node.status({});
            cleanScope({}, msg.graph);
            msg.payload = result;
            msg.graph_func_stack = node.buildFuncStack(msg, {
                func: 'watson-toneanalyzer-2018-09-21',
                params: {
                    filterFn: node.filterFn.toString(),
                    propertySelectFn: node.propertySelectFn.toString(),
                    propertyWriteFn: node.propertyWriteFn.toString(),
                    content_type: RED.util.evaluateNodeProperty(node.config.content_type, node.config.content_type_type, node, msg),
                    sentences: RED.util.evaluateNodeProperty(node.config.sentences, node.config.sentences_type, node, msg),
                    content_language: RED.util.evaluateNodeProperty(node.config.content_language, node.config.content_language_type, node, msg),
                    accept_language: RED.util.evaluateNodeProperty(node.config.accept_language, node.config.accept_language_type, node, msg)
                },
                result: result
            });
            node.send(msg);
        }).catch(function (err) {
            node.status({});
            console.log(err);
            node.send(msg);
        });
    };

    function WatsonToneAnalyzer(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.config = config;
        node.watson_config = RED.nodes.getNode(config.watson_config).config;
        node.toneAnalyzer = new ToneAnalyzerV3({
            version_date: '2017-09-21',
            iam_apikey: node.watson_config.iam_apikey,
            url: node.watson_config.url
        });

        node.config.tone_params = {
            content_type: node.config.content_type,
            sentences: node.config.sentences,
            content_language: node.config.content_language
        };
        node.buildFns();
        node.on('input', function (msg) {
            node.analyze(msg);
        });
    }

    RED.nodes.registerType("watson_toneanalyzer", WatsonToneAnalyzer);
};