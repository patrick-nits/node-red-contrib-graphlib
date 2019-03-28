var LanguageTranslatorV3 = require('watson-developer-cloud/language-translator/v3');
var graphlib = require("../../lib");
var _ = require('lodash');

module.exports = function (RED) {

    WatsonTranslator.prototype.buildTranslationParams = function (msg) {
        var node = this;

        var target_lang = RED.util.evaluateNodeProperty(node.config.opt_target_lang, node.config.opt_target_lang_type, node, msg);
        var source_lang = RED.util.evaluateNodeProperty(node.config.opt_source_lang, node.config.opt_source_lang_type, node, msg);

        return {model_id: [source_lang, target_lang].join('-')}
    };

    WatsonTranslator.prototype.buildFns = function () {
        var node = this;
        node.filterFn = new Function('v', 'value', 'g_old', 'g_new', 'msg', 'flow', 'global', node.config.filterFn);
    };

    /**
     * Builds trace for called functions on graph in flow.
     *
     * @param {NodeRED Message} msg
     * @param {Object} stack_obj - Holds function name, params, result and graph for traceability.
     * @returns {Array<Object>>} Each call of func_node adds another stack_obj to the msg.graph_func_stack.
     */
    WatsonTranslator.prototype.buildFuncStack = function (msg, stack_obj) {
        var node = this;
        var func_stack = [];

        if (typeof msg.graph_func_stack !== 'undefined' && msg.graph_func_stack.length && typeof msg.graph_func_stack.push === 'function') {
            func_stack = msg.graph_func_stack;
        }
        func_stack.push(stack_obj);
        return func_stack;
    };

    WatsonTranslator.prototype.translate = function (msg) {
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

        // thx https://stackoverflow.com/questions/47062922/how-to-get-all-keys-with-values-from-nested-objects
        function getKeys(object) {
            function iter(o, p) {
                if (Array.isArray(o)) {
                    return;
                }
                if (o && typeof o === 'object') {
                    var keys = Object.keys(o);
                    if (keys.length) {
                        keys.forEach(function (k) {
                            iter(o[k], p.concat(k));
                        });
                    }
                    return;
                }
                result.push(p.join('.'));
            }

            var result = [];
            iter(object, []);
            return result;
        }

        var nodes = _.map(msg.graph.selectNodeObjs(node.filterFn), function (v) {
            return v
        });
        dragScope(msg.graph);
        Promise.all(_.map(nodes, function (v) {
            var keys = [];

            if (node.config.opt_text_source_type === 'all') {
                //gather all keys
                keys = getKeys(v)
            } else {
                keys = (RED.util.evaluateNodeProperty(node.config.opt_text_source, node.config.opt_text_source_type, node, msg) || "").split(',');
            }

            return Promise.all(_.map(keys, function (key) {
                return new Promise(function resolver(resolve, reject) {
                    node.translator.translate(Object.assign({}, node.config.translate_params, {text: _.get(v, key.split('.'))}),
                        function (error, translation) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(translation);
                            }
                        });
                }).then(function (translation) {
                    // Todo: Translation Selector
                    // todo add delay
                    msg.graph.setNode(v.v, _.setWith(v, key.split('.'), translation.translations[0].translation));
                }).catch(function (err) {
                    // Todo: incorporate retry & delay // handle missing translation
                    throw err;
                });
            }));

        })).then(function (data) {
            node.status({});
            msg.payload = msg.graph.selectNodeObjs(node.filterFn);
            msg.graph_func_stack = node.buildFuncStack(msg, {
                func: 'watson-translatorv3-2018-05-01',
                params: {
                    filterFn: node.filterFn.toString(),
                    opt_text_source_type: node.config.opt_text_source_type,
                    opt_text_source: (RED.util.evaluateNodeProperty(node.config.opt_text_source, node.config.opt_text_source_type, node, msg) || "").split(',')
                }
            });
            cleanScope({}, msg.graph);
            node.send(msg);
        });
    };

    function WatsonTranslator(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.config = config;
        node.watson_config = RED.nodes.getNode(config.watson_config).config;
        node.translator = new LanguageTranslatorV3({
            version: '2018-05-01',
            iam_apikey: node.watson_config.iam_apikey,
            url: node.watson_config.url
        });
        node.buildFns();
        node.on('input', function (msg) {
            node.config.translate_params = node.buildTranslationParams(msg);
            node.translate(msg);
        });
    }

    RED.nodes.registerType("watson_translator", WatsonTranslator);
};