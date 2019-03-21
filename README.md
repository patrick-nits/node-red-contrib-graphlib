# NodeRED Graphlib Nodes & Dashboard

Implementation of [dagrejs/graphlib](https://github.com/dagrejs/graphlib) Nodes for [Node-RED](https://github.com/node-red/node-red). 
Graph visualisation is handled by [visj](https://github.com/almende/vis) and extends [node-red-dashboard](https://github.com/node-red/node-red-dashboard).

*Note: These nodes are in pre alpha state. Use with caution.*

## Getting Started

To install the recent version use the  `Menu - Manage Palette` option and search for `node-red-contrib-graphlib`, 
or run the following command in your Node-RED user directory (typically `~/.node-red`):

```console
npm i node-red-contrib-graphlib
```

Restart your Node-RED instance and you should have the following nodes available: 

* `Create Graphlib Graph`
* `Graphlib Function`
* `Graphlib Draw`

### Prerequisites

The `node-red-contrib-graphlib` nodes require [Node-RED](https://github.com/node-red/node-red) as well as 
[node-red-dashboard](https://github.com/node-red/node-red-dashboard) to be installed.

## Usage

### Import / Create

Graphs can be imported or created via the `Create Graphlib Graph` nodes. The node requires a `Graph Config` node to 
import a list of nodes and edges and create a `graphlib.Graph`. Relevant parameters for importing are:
* `Node Array key` specifies which key of the `msg` object contains the list of nodes.
* `Edge Array key` specifies which key of the `msg` object contains the list of edges.
* `Node ID Key` - specifies where the ID of each individual node in `msg.<Node Array key>` is stored.
* `Edge TO Key` - specifies where the target of each individual edge in `msg.<Edge Array key>` is stored.
* `Node FROM Key` - specifies where the source of each individual edge in `msg.<Edge Array key>` is stored.
* `Node LABEL Key` - specifies where the label of each individual edge in `msg.<Edge Array key>` is stored.
* `Node ID Key` - specifies where the ID of each individual edge in `msg.<Edge Array key>` is stored. Leave blank for auto generated unique IDs.

Example input `msg`.
```javascript
msg = {
    nodes: [
        {
            id: 1,
            some: "more",
            really: "important information"
        },
        {
                    id: 2,
                    even: "more",
                    totally: "important information"
        }
    ],
    edges: [
        {label: "important edge",
         source: 2,
         target: 1
        }
    ]
}
```
 The output `msg` will contain a `graphlib.Graph` Object in `msg.graph`. 
 See [dagrejs/graphlib](https://github.com/dagrejs/graphlib) for available methods.
 
 **Note:** The `msg.payload` will not be changed by the `Create Graphlib Node`.
 
### Using Functions & Algorithms
The `Graphlib Function` node provides all functions defined by [dagrejs/graphlib](https://github.com/dagrejs/graphlib/wiki/API-Reference).
Function nodes can be chained. Each node uses the graph stored in `msg.graph`. 
Each function node will store the following information in an array in `msg.graph_func_stack`:

```javascript
msg = {
    graph: '...',
    graph_func_stack: [
        {
        func: 'The called function.',
        params: 'The params passed to that function.',
        result: 'The result of the function.'
        }
    ]
}
```
The result of the function is also stored in `msg.payload`.

**Note**: The payload will be overwritten.

**Note**: Some function modify the given graph. Hence, `msg.graph` will be modified. These functions also return the graph itself. 
It will be in `msg.payload`, `msg.graph_func_stack[0].result` and in `msg.graph`.
 
Each function will require different parameters. These are visible when editing the node. Some functions allow or require to define callback or weighting functions, e.g. *Dijkstra*.
In these function you have a variety of local variables available to enhance your calculations, e.g. `global`, `flow` or `msg`.
However, keep in mind when you modify `msg.graph` that these changes will be applied to the next execution of the given function. 
Which may or may not result in *interesting* behaviour. 

### Drawing

Using the `Graphlib Draw` node the previously imported and modified graph can be drawn with [visj](https://github.com/almende/vis).
You have all options via the configuration node `draw-config` available. See  [visjs network docs](http://visjs.org/docs/network/).

**Note**: You cannot define functions when using JSON as input format, obviously.

Furthermore, you can define which elements *visjs* should use to draw the graph. This is similar to the import configuration.
Use `labelFn`, `titleFn` and `groupFn` to provide *visjs* with the respective properties. 

By using `graphCallbackFns` you can enhance the canvas / `visjs.Network` with additional functionality, e.g. *Event Handlers*. 

**Note:** These will only be called and applied once. 

**Note:** Feel free to use multiple `Graphlib Draw` nodes. Each will use their own canvas, with their own callbacks, etc.

## Contributing
Feel free to submit pull requests to further improve functionality and fix issues.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details