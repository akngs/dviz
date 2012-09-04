# DViz

by Alan Kang (@alankang)

DViz is a declarative data visualization library written in Javascript.

See [live example](http://akngs.tumblr.com/post/30393301015/declarative-data-visualization) on tumblr.


## What is Declarative Data Visualization?

I coined the term **declarative data visualization** to describe a way of
embedding visual representations such as sparklines or conventional
statistical charts into HTML document without using the hand-written scripts
or graph drawing tools.

All you need to do is writing a plain HTML document. DViz then automatically
detects data elements embedded in the document and turns them into cognitively
efficient visualizations on the fly.


## Documentation

### Basic Usage

Paste following code into the `<head>` element of your HTML:

    <link rel="stylesheet" href="http://akngs.github.com/dviz/css/dviz.css" />
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.0.min.js"></script>
    <script type="text/javascript" src="http://twitter.github.com/bootstrap/assets/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="http://akngs.github.com/dviz/js/dviz.js"></script>
    <script type="text/javascript">$(function() {dviz.run();});</script>

Or you can add `?autorun=true` parameter instead of direct call to `dviz.run`:

    <link rel="stylesheet" href="http://akngs.github.com/dviz/css/dviz.css" />
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.8.0.min.js"></script>
    <script type="text/javascript" src="http://twitter.github.com/bootstrap/assets/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="http://akngs.github.com/dviz/js/dviz.js?autorun=true"></script>

And add `dviz-content` class to somewhere in the `<body>` tag. DViz will scan and process all elements in there:

    <div class="dviz-content"> ... </div>

Now you can do some magic. Add following code into `dviz-content` area:

    <p>Here goes sparkline: <code>1,3,6,3,5,2,4 (@sparkline)</p>

It will replace the `<code>` element into a sparkline.

Or you can draw a bar chart:

    <pre>
       <code>
       Name, A, B
       Apple, 1323, 1232
       Orange, 3563, 2452
       Banana, 1356, 3222
       </code>
    </pre>
    <p><code>(@bar)</code></p>

DViz currently supports following declarations:

*   scatter (scatter plot)
*   scattermatrix (scatter plot matrix)
*   bar (horizontal bar chart)
*   line (line chart)
*   column (vertical bar chart)
*   area (area chart)
*   steppedarea (stepped area chart)
*   sparkline (sparkline)
*   table (table chart)
*   graph (force-directed graph)

See following examples:

*   [Basic](https://github.com/akngs/dviz/blob/master/examples/basic.html)
*   [Lazy loading](https://github.com/akngs/dviz/blob/master/examples/lazyload.html)
*   [Autorun](https://github.com/akngs/dviz/blob/master/examples/autorun.html)
*   [Force-directed graph](https://github.com/akngs/dviz/blob/master/examples/opt_graph.html)


### Dependencies

*   [jQuery](http://jquery.com/) (required)
*   [twitter-bootstrap](http://twitter.github.com/bootstrap/) (required)
*   [D3](http://d3js.org) (optional to render sparkline)
*   [Google Visualization API](https://developers.google.com/chart/interactive/docs/index) (optional to render core charts)

You can explicitly load optional javascript files using `script` tags, but you
can also let DViz to load them when they are needed.

## Browser Support

DViz supports all major modern browsers including:

*   Safari (and Mobile Safari)
*   Chrome
*   Firefox
*   Opera
*   Internet Explorer 9+


## License

Licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
