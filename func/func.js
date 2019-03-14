var graphlib = require("../lib");

module.exports = function (RED) {
    //TODO: more descriptive & flexible structure (contains only lookups)

    /**
     * Holds function names and corresponding arguments
     * e.g. function node(v) -> [arg_v]
     */
    const ARG_PATTERNS = {
        all: ['arg_value', 'arg_v', 'arg_w', 'arg_label', 'weightFn', 'edgeFn','changeFn','filterFn'],
        isDirected: [],
        isMultigraph: [],
        isCompound: [],
        graph: [],
        nodeCount: [],
        edgeCount: [],
        nodes: [],
        edges: [],
        sources: [],
        setDefaultNodeLabel: ['arg_value'],
        setDefaultEdgeLabel: ['arg_value'],
        hasNode: ['arg_v'],
        node: ['arg_v'],
        removeNode: ['arg_v'],
        predecessors: ['arg_v'],
        successors: ['arg_v'],
        neighbors: ['arg_v'],
        parent: ['arg_v'],
        children: ['arg_v'],
        inEdges: ['arg_v', 'arg_w'],
        outEdges: ['arg_v', 'arg_w'],
        nodeEdges: ['arg_v', 'arg_w'],
        hasEdge: ['arg_v', 'arg_w'],
        edge: ['arg_v', 'arg_w'],
        setParent: ['arg_v', 'arg_w'],
        removeEdge: ['arg_v', 'arg_w'],
        setNode: ['arg_v', 'arg_label'],
        setEdge: ['arg_v', 'arg_w', 'arg_label'],
        components: [],
        findCycles: [],
        isAcyclic: [],
        tarjan: [],
        topsort: [],
        postorder: ['arg_v'],
        preorder: ['arg_v'],
        dijkstra: ['arg_v', 'weightFn', 'edgeFn'],
        dijkstraAll: ['weightFn', 'edgeFn'],
        floydWarshall: ['weightFn', 'edgeFn'],
        prim: ['weightFn'],
        nodeObj: ['arg_v'],
        nodeObjs: ['arg_v'],
        selectNodeObjs: ['filterFn'],
        filterNodeObjs: ['filterFn'],
        modifyNodeObjs: ['changeFn','filterFn'],
        setNodeObj: ['arg_nodeObjs']
    };

    /**
     * Holds scope for functions to call on graphlib. Either graph or alg.
     */
    const FUNC_PATTERNS = {
        isDirected: 'graph',
        isMultigraph: 'graph',
        isCompound: 'graph',
        graph: 'graph',
        nodeCount: 'graph',
        edgeCount: 'graph',
        nodes: 'graph',
        edges: 'graph',
        sources: 'graph',
        setDefaultNodeLabel: 'graph',
        setDefaultEdgeLabel: 'graph',
        hasNode: 'graph',
        node: 'graph',
        removeNode: 'graph',
        predecessors: 'graph',
        successors: 'graph',
        neighbors: 'graph',
        parent: 'graph',
        children: 'graph',
        inEdges: 'graph',
        outEdges: 'graph',
        nodeEdges: 'graph',
        hasEdge: 'graph',
        edge: 'graph',
        setParent: 'graph',
        removeEdge: 'graph',
        setNode: 'graph',
        setEdge: 'graph',
        components: 'alg',
        findCycles: 'alg',
        isAcyclic: 'alg',
        tarjan: 'alg',
        topsort: 'alg',
        postorder: 'alg',
        preorder: 'alg',
        dijkstra: 'alg',
        dijkstraAll: 'alg',
        floydWarshall: 'alg',
        prim: 'alg',
        nodeObj: 'graph',
        nodeObjs: 'graph',
        selectNodeObjs: 'graph',
        filterNodeObjs: 'graph',
        modifyNodeObjs: 'graph',
        setNodeObj: 'graph'
    };

    FuncNode.prototype.setGraph = require('../lib/func').set_graph;

    /**
     * Extracts function args for graphlib from message, flow or global.
     *
     * @param {NodeRED Message} msg - The message to get the function args from.
     * @returns {Object} arg_obj - The Arguments to pass to graphlib.
     */
    FuncNode.prototype.getFuncArgs = function (msg) {
        var node = this;
        var arg_obj = {};
        var args = ARG_PATTERNS[node.config.func];
        args.forEach(function (arg, index) {
            arg_obj[arg] = node.buildFuncArg(RED.util.evaluateNodeProperty(node.config[arg], node.config[arg + "_type"], node, msg), arg);
        });

        return arg_obj;
    };

    /**
     * Builds callback function for filterFn, weightFn or edgeFn.
     *
     * @param arg
     * @param paramName
     * @returns {Function} arg - Callback to call on graphlib weigthFn, edgeFn or filterFn.
     */
    FuncNode.prototype.buildFuncArg = function (arg, paramName) {
        if (paramName === 'edgeFn') {
            arg = new Function('v', 'g', 'msg', 'flow', 'global', arg);
        } else if (paramName === 'weightFn') {
            arg = new Function('e', 'g', 'msg', 'flow', 'global', arg)
        } else if (paramName === 'filterFn' || paramName === 'changeFn') {
            arg = new Function('v', 'value', 'g_old','g_new', 'msg', 'flow', 'global', arg)
        }
        return arg;
    };

    /**
     * Calls function on graphlib.
     *
     * @Todo dragScope and cleanScope exploit apply(this,...) to make msg,flow and global properties available to underlying graphlib functions and callbacks. Needs to be refactored.
     *
     * @param {NodeRED Message} msg - Message to use for calling the node´s function.
     * @returns {Object} result - Object holding the result of the called function, and used params.
     */
    FuncNode.prototype.callFunc = function (msg) {
        var node = this;
        var func_args;
        var result = {};
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
            func_args = node.getFuncArgs(msg);

            // Actual Result
            if (FUNC_PATTERNS[node.config.func] === 'alg') {
                result.result = graphlib.alg[node.config.func].apply(dragScope(graphlib.alg), [node.graph].concat(Object.keys(func_args).map((k) => func_args[k])));
                result = cleanScope(result, graphlib.alg);
            } else if (FUNC_PATTERNS[node.config.func] === 'graph') {
                result.result = node.graph[node.config.func].apply(dragScope(node.graph), Object.keys(func_args).map((k) => func_args[k]));
                result = cleanScope(result, node.graph);
            } else {
                throw "Strange function " + node.config.func;
            }

            // Stack Object
            result.func = {
                func: node.config.func,
                params: func_args,
                result: result.result // Keep copy of result for trace TODO: might cause issues with graph modifiers.
            };

            return result;
    };

    /**
     * Builds trace for called functions on graph in flow.
     *
     * @param {NodeRED Message} msg
     * @param {Object} stack_obj - Holds function name, params, result and graph for traceability.
     * @returns {Array<Object>>} Each call of func_node adds another stack_obj to the msg.graph_func_stack.
     */
    FuncNode.prototype.buildFuncStack = function (msg, stack_obj) {
        var node = this;
        var func_stack = [];

        if (typeof msg.graph_func_stack !== 'undefined' && msg.graph_func_stack.length && typeof msg.graph_func_stack.push === 'function') {
            func_stack = msg.graph_func_stack;
        }
        func_stack.push(stack_obj);
        return func_stack;
    };

    /**
     * Builds message to pass along the flow.
     *
     * @param orig_msg
     * @returns {*}
     */
    FuncNode.prototype.buildMsg = function (orig_msg) {
        var node = this;

        var result = node.callFunc(orig_msg);
        orig_msg.payload = result.result || {};
        orig_msg.graph = (result.result && result.result.graph ? result.result : node.graph); // Depending on callFunc() graph has been changed. TODO: cleanup.
        orig_msg.graph_func_stack = node.buildFuncStack(orig_msg, result.func);
        return orig_msg;
    };

    /**
     *
     * @param config
     * @constructor
     */
    function FuncNode(config) {
        try {
            RED.nodes.createNode(this, config);
            var node = this;
            node.config = config;
            node.config.weightFn_type = 'str'; // helper for evaluateNodeProperty
            node.config.edgeFn_type = 'str';
            node.config.filterFn_type = 'str';

            this.on('input', function (msg) {
                node.setGraph(msg);
                node.send(node.buildMsg(msg));
            });

        } catch (e) {
            console.log(e);
        }
        node.on("close", function () {

        });
    }

    // register ui_list node
    RED.nodes.registerType('graphlib_func', FuncNode);
};
