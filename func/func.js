/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var graphlib = require("../lib");

module.exports = function (RED) {
    //TODO: more descriptive & flexible structure (contains only lookups)
    const ARG_PATTERNS = {
        all: ['arg_value', 'arg_v', 'arg_w', 'arg_label', 'weightFn', 'edgeFn'],
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
    };
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
    };

    FuncNode.prototype.setGraph = function (msg) {
        var node = this;
        if (typeof msg.graph.nodes === 'function') {
            node.graph = msg.graph;
        } else {
            throw "Cannot call graphlib function. No Graph in Message. " + msg;
        }
    };

    FuncNode.prototype.getFuncArgs = function (msg) {
        var node = this;
        var arg_obj = {};
        var args = ARG_PATTERNS[node.config.func];
        args.forEach(function (arg, index) {
            arg_obj[arg] = node.buildFuncArg(RED.util.evaluateNodeProperty(node.config[arg], node.config[arg + "_type"], node, msg), arg);
        });

        return arg_obj;
    };

    FuncNode.prototype.buildFuncArg = function (arg, paramName) {
        if (paramName === 'edgeFn') {
            arg = new Function('v', 'g', 'msg', 'flow', 'global', arg);
        } else if (paramName === 'weightFn') {
            arg = new Function('e', 'g', 'msg', 'flow', 'global', arg)
        } else if (paramName === 'filterFn') {
            arg = new Function('v', 'value', 'g_old','g_new', 'msg', 'flow', 'global', arg)
        }
        return arg;
    };

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
            if (result.result.graph) {
                delete result.result.graph.msg;
                delete result.result.graph.flow;
                delete result.result.graph.global;
            }
            return result;
        };

        try {
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
        } catch (e) {
            throw "Could not call func " + node.config.func + " Error " + e;
        }

    };

    FuncNode.prototype.buildFuncStack = function (msg, stack_obj) {
        var node = this;
        var func_stack = [];

        if (typeof msg.graph_func_stack !== 'undefined' && msg.graph_func_stack.length && typeof msg.graph_func_stack.push === 'function') {
            func_stack = msg.graph_func_stack;
        }
        func_stack.push(stack_obj);
        return func_stack;
    };

    FuncNode.prototype.buildMsg = function (orig_msg) {
        var node = this;

        var result = node.callFunc(orig_msg);
        orig_msg.payload.graph_func_return = result.result;
        orig_msg.graph = (result.result.graph ? result.result : node.graph); // Depending on callFunc() graph has been changed. TODO: cleanup.
        orig_msg.graph_func_stack = node.buildFuncStack(orig_msg, result.func);
        return orig_msg;

    };

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
