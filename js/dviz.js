(function(window) {


var dviz = {};

/*
 * Fast array min/max functions
 */
dviz = $.extend(dviz, {
    _array_min: function(array) {return Math.min.apply( Math, array );},
    _array_max: function(array) {return Math.max.apply( Math, array );}
});

/*
 * Load javascript modules
 * 
 * Params:
 *    jsids: array of predefined script ids
 *    callback: called right after the job done.
 */
var load_reqs = function(jsids, callback) {
    var loaded = 0;
    for(var i = 0; i < jsids.length; i++) {
        load_req(jsids[i], function() {
            loaded++;
            if(loaded == jsids.length) callback();
        });
    }
};

/*
 * Load single javascript module
 * 
 * Params:
 *    jsid: predefined script id
 *    callback: called right after the job done.
 */
var load_req = function(jsid, callback) {
    var loader = load_req.loaders[jsid];
    if(loader.check()) {
        loader.callback(callback);
        return;
    }

    var script = document.createElement("script");
    script.src = loader.url;
    script.type = "text/javascript";
    script.onload = function () {
        loader.callback(callback);
    };
    document.getElementsByTagName("head")[0].appendChild(script);
};
load_req.loaders = {
    'd3': {
        'url': 'http://d3js.org/d3.v2.min.js',
        'check': function() {return !!window['d3'];},
        'callback': function(cb) {cb();}
    },
    'google-viz': {
        'url': 'https://www.google.com/jsapi',
        'check': function() {return !!window['google'];},
        'callback': function(cb) {
            google.load('visualization', '1.0', {
                'packages': ['corechart', 'table'],
                'callback': function() {cb();}
            });
        }
    },
    'opt_graph': {
        'url': 'http://akngs.github.com/dviz/js/opt_graph.js',
        'check': function() {return !!dviz.opt['graph'];},
        'callback': function(cb) {cb();}
    }
};

/*
 * Parse raw string and return array(for single line string)
 * or array of array(for multi-line string).
 * 
 * Params:
 *    raw: comma separated string or javascript function expression
 *    hasColumnLabels: true if first row is header
 *    hasRowLabels: true if first column is header
 * 
 * Returns:
 *    <raw> itself if <raw> is not a string
 *    one dimensional array if <raw> has single line
 *    two dimensional array if <raw> has multiple lines
 */
dviz.parse_data = function(raw, hasColumnLabels, hasRowLabels) {
    if(typeof(raw) != 'string') return raw;

    var lines = raw.trim().split('\n');

    // is it javascript expression?
    var first_line = lines[0].trim();
    if(first_line.substring(0, 2) == '#!' && first_line.substring(2).split(' ')[0].trim().toLowerCase() == 'javascript') {
    	lines.shift();
    	var evaled_expression = null;
    	try {
        	eval('evaled_expression = (' + lines.join('\n') + ')');
    	} catch(e) {
    		evaled_expression = [];
    	}
    	return evaled_expression;
    }

    // assume CSV and tokenize
    var table = [];
    $(lines).each(function() {
        var tokens = $(this.split(',')).map(function(i, v) {return v.trim();});
        table.push(tokens.get());
    });

    // convert data
    var rstart = hasColumnLabels ? 1 : 0;
    var cstart = hasRowLabels ? 1 : 0;
    for(var row = rstart; row < table.length; row++) {
        for(var col = cstart; col < table[row].length; col++) {
            table[row][col] = Number(table[row][col].trim());
        }
    }

    // done
    if(table.length == 1) {
        return table[0];
    } else {
        return table;
    }
};

/*
 * Extract texts from html TABLE element and return a single CSV string.
 * 
 * Params:
 *    $table: jQuery TABLE element
 * 
 * Returns:
 *    CSV string which can be parsed with `dviz.parse_data` function
 */
var table_to_csv = function($table) {
    var table_buffer = [];
    $table.find('tr').each(function() {
        var row_buffer = [];
        $(this).find('td').each(function() {
            row_buffer.push($(this).text());
        });
        table_buffer.push(row_buffer.join(','));
    });
    return table_buffer.join('\n');
};

/* Return CSS color schemes for nominal data
 * 
 * Params:
 *    nums: number of categories
 * 
 * Returns:
 *    array of CSS color strings
 */
var get_nominal_colors = function(nums) {
    var colors;
    if(nums <= 1) {
        colors = ['#555'];
    } else if(nums <= 2) {
        colors = ['#555', '#999'];
    } else {
        // From d3's category20
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
                  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
                  '#bcbd22', '#17becf', '#aec7e8', '#ffbb78',
                  '#98df8a', '#ff9896', '#c5b0d5', '#c49c94',
                  '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'];
    }
    return colors;
};

/*
 * Set of declarative visualization functions
 */
var funcs = {
    /*
     * Create div elements for grid layout and append it into current element,
     * and than move existing elements into the layout just created.
     * 
     * Params:
     *    $e: current element
     *    data: string with format "cols,rows,repeat"
     *       <cols> and <rows> specifies format of the grid
     *       <repeat> specifies # of elements each grid cell should contain
     */
    layout: function($e, data) {
        var tokens = data.split(',');
        var cols = Number(tokens[0].trim());
        var rows = Number(tokens[1].trim());
        var repeat = Number((tokens[2] || '1').trim());

        var $layout = $('<div />');
        for(var ri = 0; ri < rows; ri++) {
            var $row = $('<div />');
            $row.addClass('row-fluid');
            $layout.append($row);

            for(var ci = 0; ci < cols; ci++) {
                var $col = $('<div />');
                $col.addClass('span' + Math.floor(12 / cols));
                for(var x = 0; x < repeat; x++) {
                    $col.append($e.parent().next());
                }
                $row.append($col);
            }
        }
        $e.append($layout);
    },
    layout_requires: [],
    /*
     * Create scatter plot using Google Visualization API.
     * 
     * Params:
     *    $e: current element
     *    data: raw comma separated string
     *    options: JSON string (see Google API docs for available options)
     */
    scatter: function($e, data, options) {
        // prepare data
        var table = google.visualization.arrayToDataTable(dviz.parse_data(data, true, false));
        
        // merge default options
        var default_options = {
            colors: get_nominal_colors(table.getNumberOfColumns() - 1),
            pointSize: 3,
            hAxis: {title: table.getColumnLabel(0)}
        };
        actual_options = $.extend(default_options, options);
        
        // draw chart
        var $chart_div = $('<div />');
        $e.append($chart_div);
        var chart = new google.visualization.ScatterChart($chart_div[0]);
        chart.draw(table, actual_options);
    },
    scatter_requires: ['google-viz'],
    /*
     * Create scatter plot matrix using Google Visualization API.
     * 
     * Params:
     *    $e: current element
     *    data: raw comma separated string
     *    options: JSON string (see Google API docs for available options)
     */
    scattermatrix: function($e, data, options) {
        // prepare data
        var table = google.visualization.arrayToDataTable(dviz.parse_data(data, true, false));

        // merge default options
        var default_options = {
            colors: get_nominal_colors(1),
            pointSize: 3,
            chartArea: {
                'left': 0,
                'top': 0,
                'width': '100%',
                'height': '100%'
            },
            legend: 'none'
        };
        cell_options = $.extend(default_options, options);
        
        // render matrix and label
        var size = table.getNumberOfColumns();
        var $root = $('<div />');
        $e.append($root);

        // @TODO: remove twitter-bootstrap dependency
        for(var ri = 0; ri < size; ri++) {
            var $row = $('<div />');
            $row.addClass('row-fluid');
            $root.append($row);
            for(var ci = 0; ci < size; ci++) {
                var $col = $('<div />');
                var bootstrap_grid = 12;  // @TODO: remove magic number
                $col.addClass('span' + Math.floor(bootstrap_grid / size));
                $row.append($col);
                
                if(ri == ci) {
                    $col.css({'text-align': 'left', 'position': 'relative'});
                    if(ri != 0) $col.css('height', $col.width());
                    var $label = $('<span>' + table.getColumnLabel(ci) + '</span>');
                    $label.css({'position': 'absolute', 'bottom': 0, 'text-size': '12px'});
                    $col.html($label);
                }
            }
        }
        
        // render scatter plots
        for(var ri = 0; ri < size; ri++) {
            for(var ci = ri + 1; ci < size; ci++) {
                var $cell = $($($root.children()[ci]).children()[ri]);
                
                // extract values to be used in this cell
                var cell_values = [];
                cell_values.push([table.getColumnLabel(ri), table.getColumnLabel(ci)]);
                for(var i = 0; i < table.getNumberOfRows() - 1; i++) {
                    cell_values.push([table.getValue(i, ri), table.getValue(i, ci)]);
                }
                var cell_table = google.visualization.arrayToDataTable(cell_values);
                var chart = new google.visualization.ScatterChart($cell[0]);
                var actual_options = $.extend(cell_options, {
                    height: $cell.width()
                });
                chart.draw(cell_table, actual_options);
            }
        }
    },
    scattermatrix_requires: ['google-viz'],
    /*
     * Create horizontal bar chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    bar: function($e, data, options) {
        dviz.funcs.common_chart('BarChart', $e, data, options);
    },
    bar_requires: ['google-viz'],
    /*
     * Create line chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    line: function($e, data, options) {
        dviz.funcs.common_chart('LineChart', $e, data, options);
    },
    line_requires: ['google-viz'],
    /*
     * Create vertical bar chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    column: function($e, data, options) {
        dviz.funcs.common_chart('ColumnChart', $e, data, options);
    },
    column_requires: ['google-viz'],
    /*
     * Create area chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    area: function($e, data, options) {
        dviz.funcs.common_chart('AreaChart', $e, data, options);
    },
    area_requires: ['google-viz'],
    /*
     * Create table chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    table: function($e, data, options) {
        dviz.funcs.common_chart('Table', $e, data, options);
    },
    table_requires: ['google-viz'],
    /*
     * Create stepped area chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    steppedarea: function($e, data, options) {
        dviz.funcs.common_chart('SteppedAreaChart', $e, data, options);
    },
    steppedarea_requires: ['google-viz'],
    /*
     * Create specified corechart using Google Visualization API.
     * 
     * Params:
     *    name: name of chart function
     *          (see Google API docs for available function name)
     *    $e: current element
     *    data: raw comma separated string
     *    options: JSON string (see Google API docs for available options)
     */
    common_chart: function(name, $e, data, options) {
        // prepare data
        table = google.visualization.arrayToDataTable(dviz.parse_data(data, true, true));
        
        // merge default options
        var default_options = {
            colors: get_nominal_colors(table.getNumberOfColumns() - 1)
        };
        actual_options = $.extend(default_options, options);
        
        // render chart
        var $chart_div = $('<div />');
        $e.append($chart_div);
        var chart = new google.visualization[name]($chart_div[0]);
        chart.draw(table, actual_options);
    },
    graph: function($e, data, options) {
        dviz.opt.graph($e, data, options);
    },
    graph_requires: ['d3', 'opt_graph'],
    /*
     * Create sparkline using D3
     * 
     * Params:
     *    $e: current element
     *    data: raw comma separated string
     */
    sparkline: function($e, data) {
        // prepare data
        var parsed_data = dviz.parse_data(data);
        var lines = [];
        for(var i = 0; i < parsed_data.length - 1; i++) {
            lines.push([parsed_data[i], parsed_data[i + 1]]);
        }

        // params
        var xstep = 10; // @TODO: remove magic number
        var height = 20; // @TODO: remove magic number
        var marginy = 4; // @TODO: remove magic number
        var width = xstep * lines.length;
        var scalex = d3.scale.linear().domain([0, lines.length]).range([0, width]);
        var scaley = d3.scale.linear().domain([dviz._array_min(parsed_data), dviz._array_max(parsed_data)]).range([height - marginy, 0 + marginy]);

        
        // render
        var e = $e[0];
        var svg = d3.select(e).append('svg')
            .attr('width', width + 'px')
            .attr('height', height + 'px')
            .attr('class', 'dviz sparkline');

        svg.selectAll('line')
            .data(lines)
            .enter()
            .append('line')
            .attr('x1', function(d, i) {return scalex(i);})
            .attr('x2', function(d, i) {return scalex(i + 1);})
            .attr('y1', function(d, i) {return scaley(d[0]);})
            .attr('y2', function(d, i) {return scaley(d[1]);});
    },
    sparkline_requires: ['d3']
};


/**
 * Scan and evaluate declarative commands.
 * 
 * Params:
 *    content_selector: jQuery extended selector for content area (optional)
 *    code_selector: jQuery extended selector to select declarative commands (optional)
 */
var run = function(content_selector, code_selector) {
    content_selector = content_selector || '.dviz-content';
    code_selector = code_selector || '*:not(pre) > code';
    var p = /(.*)\(@(\w.+?)?\s?(\{.+\})?\)$/;

    // find declarations
    var $targets = $(content_selector + ' ' + code_selector).filter(function() {
        var $this = $(this);
        return !!$(this).text().match(p);
    });

    // find required libraries
    var reqs = [];
    $targets.each(function() {
        var $this = $(this);
        var m = $(this).text().match(p);
        var func_name = m[2];
        $(dviz.funcs[func_name + '_requires']).each(function(i, v) {
            if(reqs.indexOf(v) == -1) reqs.push(v);
        });
    });

    // load libraries
    load_reqs(reqs, function() {
        // evaluate declarations
        $targets.each(function() {
            var $this = $(this);
            var m = $this.text().match(p);
            var data = m[1];
            var func_name = m[2];
            var options = m[3];
            if(!(func_name in dviz.funcs)) return;

            if(!data) {
                var $data_node = $this.parent().prev();
                if($data_node.prop('nodeName').toUpperCase() == 'TABLE') {
                    data = table_to_csv($data_node);
                } else {
                    data = $data_node.text();
                }
                $data_node.remove();
            }
            
            if(options) {
                eval('options = ' + options);
            } else {
                options = {};
            }

            var wrapper = ($this.parent()[0].nodeName == 'pre') ? 'div' : 'span';
            var $e = $('<' + wrapper + ' />');
            $this.after($e);

            dviz.funcs[func_name]($e, data, options);

            var $parent = $this.parent();
            $this.remove();
            if($parent.children().length == 0) $parent.remove();
        });
    });
};

dviz = $.extend(dviz, {
    funcs: funcs,
    run: run,
    get_nominal_colors: get_nominal_colors,
    opt: {}
});

window.dviz = dviz;

// check autorun parameter
var $dviz_script = $('script').filter(function() {
    return ($(this).attr('src') || '').match(/\/dviz\.js/);
});
if($dviz_script.attr('src').match(/\?autorun=true$/)) {
    $(function() {dviz.run();});
}

})(window);
