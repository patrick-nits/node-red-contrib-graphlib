var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var graphlib = require("../lib");
var _ = require('lodash');

module.exports = function (RED) {

    WatsonNlp.prototype.buildNlpParams = function (msg) {
        var node = this;
        var params = {features: {}};
        var concept = !!RED.util.evaluateNodeProperty(node.config.opt_concept, node.config.opt_concept_type, node, msg);

        if (concept) {
            params.features.concepts = {
                limit: RED.util.evaluateNodeProperty(node.config.opt_concept_limit, node.config.opt_concept_limit_type, node, msg) || 3
            }
        }
        return params;
    };

    WatsonNlp.prototype.buildFns = function () {
        var node = this;
        node.filterFn = new Function('v', 'value', 'g_old', 'g_new', 'msg', 'flow', 'global', node.config.filterFn);
        node.propertySelectFn = new Function('v', 'value', 'msg', 'flow', 'global', node.config.propertySelectFn);
        node.propertyWriteFn = new Function('v', 'value', 'analysis', 'msg', 'flow', 'global', node.config.propertyWriteFn);
    };

    /**
     * Builds trace for called functions on graph in flow.
     *
     * @param {NodeRED Message} msg
     * @param {Object} stack_obj - Holds function name, params, result and graph for traceability.
     * @returns {Array<Object>>} Each call of func_node adds another stack_obj to the msg.graph_func_stack.
     */
    WatsonNlp.prototype.buildFuncStack = function (msg, stack_obj) {
        var node = this;
        var func_stack = [];

        if (typeof msg.graph_func_stack !== 'undefined' && msg.graph_func_stack.length && typeof msg.graph_func_stack.push === 'function') {
            func_stack = msg.graph_func_stack;
        }
        func_stack.push(stack_obj);
        return func_stack;
    };

    WatsonNlp.prototype.analyze = function (msg) {
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
                node.nlpProcessor.analyze(Object.assign({}, node.config.nlp_params, {text: node.propertySelectFn(v.v, v, msg, node.context().flow, node.context().global)}),
                    function (error, analysis) {
                        requestNbr = requestNbr + 1;
                        node.status({
                            fill: "blue",
                            shape: "ring",
                            text: "Request: " + requestNbr + " of " + totalRequests
                        });
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                v: v.v,
                                value: v,
                                analysis: analysis
                            })
                        }
                    });
            });
        })).then(function (data) {
            var result = _.map(data, function (d) {
                msg.graph.setNode(d.v, node.propertyWriteFn(d.v, d.value, d.analysis));
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
                    concept: RED.util.evaluateNodeProperty(node.config.concept, node.config.concept_type, node, msg),
                    concept_limit: RED.util.evaluateNodeProperty(node.config.concept_limit, node.config.concept_limit_type, node, msg)
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

    function WatsonNlp(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.config = config;
        node.watson_config = RED.nodes.getNode(config.watson_config).config;
        node.nlpProcessor = new NaturalLanguageUnderstandingV1({
            version_date: '2018-11-16',
            iam_apikey: node.watson_config.iam_apikey,
            url: node.watson_config.url
        });
        node.buildFns();
        node.on('input', function (msg) {
            node.config.nlp_params = node.buildNlpParams(msg);
            node.analyze(msg);
        });
    }

    RED.nodes.registerType("watson_nlp", WatsonNlp);
};