// Based on http://mbostock.github.com/d3/ex/force.js
(function() {
    dviz.opt['graph'] = function($e, data, options) {
        var data = parse_graph(data);
        var width = $e.parent().width();
        var height = width * 0.6;
        var color_scheme = dviz.get_nominal_colors(data.group_length);
        var color = function(n) {
            return color_scheme[n];
        };
        // @TODO: remove magic numbers
        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(50)
            .size([width, height]);

        var e = $e[0];
        var svg = d3.select(e).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "graph");

        force
            .nodes(data.nodes)
            .links(data.links)
            .start();

        var link = svg.selectAll("line.link")
            .data(data.links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function(d) { return Math.sqrt(d.value); });

        // @TODO: remove magic number for "r"
        var node = svg.selectAll("circle.node")
            .data(data.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 15)
            .style("fill", function(d) { return color(d.group); })
            .call(force.drag);

        var text = svg.selectAll("text.node")
            .data(data.nodes)
            .enter().append("text")
            .attr("class", "node")
            .text(function(d) {return d.name;});

        node.append("title")
            .text(function(d) { return d.name; });

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
            text.attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        });
    };
    
    var parse_graph = function(raw) {
        var p_link = /^(.+?)-+(?:\((-?\d+)\)-+)?(.+)$/;
        var lines = raw.trim().split('\n');

        var node_to_index = {};
        var nodes = [];
        var links = [];

        var add_node = function(node, group) {
            if(!(node in node_to_index)) {
                node_to_index[node] = nodes.length;
                nodes.push({'name': node, 'group': group});
            }
        };

        for(var i = 0; i < lines.length; i++) {
            var m = lines[i].match(p_link);
            var from = m[1].trim();
            var value = parseInt(m[2] || '1');
            var to = m[3].trim();
            // @TODO: implement this
            var group = 0;

            add_node(from, group);
            add_node(to, group);
            links.push({
                'source': node_to_index[from],
                'target': node_to_index[to],
                'value': value
            });
        }
        return {
            'nodes': nodes,
            'links': links,
            // @TODO: implement this
            'group_length': 1
        };
    };
})();
