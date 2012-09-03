var dviz = (function() {


/*
 * Fast array min/max functions
 */
var array_min = function(array) {return Math.min.apply( Math, array );};
var array_max = function(array) {return Math.max.apply( Math, array );};

/*
 * Parse raw string and return array(for single line string)
 * or array of array(for multi-line string).
 * 
 * Params:
 *    raw: raw comma separated string
 *    hasColumnLabels: true if first row is header
 *    hasRowLabels: true if first column is header
 * 
 * Returns:
 *    <raw> itself if <raw> is not a string
 *    one dimensional array if <raw> has single line
 *    two dimensional array if <raw> has multiple lines
 */
var parse_csv = function(raw, hasColumnLabels, hasRowLabels) {
    if(typeof(raw) != 'string') return raw;

    // tokenize
    var table = [];
    $(raw.trim().split('\n')).each(function() {
        table.push(this.split(','));
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
 *    CSV string which can be parsed with parse_csv function
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
        colors = ['rgb(31,119,180)', 'rgb(255,127,14)', 'rgb(44,160,44)', 'rgb(214,39,40)', 'rgb(148,103,189)', 'rgb(140,86,75)'];
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
        var table = google.visualization.arrayToDataTable(parse_csv(data, true, false));
        
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
        var table = google.visualization.arrayToDataTable(parse_csv(data, true, false));

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
    /*
     * Create horizontal bar chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    bar: function($e, data, options) {
        dviz.funcs.common_chart('BarChart', $e, data, options);
    },
    /*
     * Create line chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    line: function($e, data, options) {
        dviz.funcs.common_chart('LineChart', $e, data, options);
    },
    /*
     * Create vertical bar chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    column: function($e, data, options) {
        dviz.funcs.common_chart('ColumnChart', $e, data, options);
    },
    /*
     * Create area chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    area: function($e, data, options) {
        dviz.funcs.common_chart('AreaChart', $e, data, options);
    },
    /*
     * Create table chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    table: function($e, data, options) {
        dviz.funcs.common_chart('Table', $e, data, options);
    },
    /*
     * Create stepped area chart using Google Visualization API.
     * See <dviz.funcs.common_chart> for more details.
     */
    steppedarea: function($e, data, options) {
        dviz.funcs.common_chart('SteppedAreaChart', $e, data, options);
    },
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
        table = google.visualization.arrayToDataTable(parse_csv(data, true, true));
        
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
    /*
     * Create sparkline using D3
     * 
     * Params:
     *    $e: current element
     *    data: raw comma separated string
     */
    sparkline: function($e, data) {
        // prepare data
        var parsed_data = parse_csv(data);
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
        var scaley = d3.scale.linear().domain([array_min(parsed_data), array_max(parsed_data)]).range([height - marginy, 0 + marginy]);

        
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
    }
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

        if(!google['visualization']) {
            google.setOnLoadCallback(function() {
                dviz.funcs[func_name]($e, data, options);
            });
        } else {
            dviz.funcs[func_name]($e, data, options);
        }

        var $parent = $this.parent();
        $this.remove();
        if($parent.children().length == 0) $parent.remove();
    });
};


var dviz = {
    funcs: funcs,
    run: run
};


return dviz;

})();
