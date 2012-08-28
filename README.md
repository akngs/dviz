# DViz

by Alan Kang (@alankang)

DViz is a declarative data visualization library written in Javascript.


## What is Declarative Data Visualization?

I coined the term **declarative data visualization** to describe a way of
embedding visual representations such as sparklines or conventional
statistical charts into HTML document without using the hand-written scripts
or graph drawing tools.

All you need to do is writing an plain HTML document. DViz than automatically
detects data elements embedded in the document and turns them into cognitively
efficient visualizations on the fly.


## Documentation

### Basic Usage

See [example.html](https://github.com/akngs/dviz/blob/master/examples/examples.html).


### Dependencies

*   [jQuery](http://jquery.com/) (required)
*   [twitter-bootstrap](http://twitter.github.com/bootstrap/) (required)
*   [D3](http://d3js.org) (optional to render sparkline)
*   [Google Visualization API](https://developers.google.com/chart/interactive/docs/index) (optional to render core charts)


## Browser Support

DViz supports all major modern browsers including:

*   Safari (and Mobile Safari)
*   Chrome
*   Firefox
*   Opera
*   Internet Explorer 9+


## License

Licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
