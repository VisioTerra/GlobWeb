/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

/**************************************************************************************************************/

/** @constructor
	KMLParser constructor
 */
GlobWeb.AnotherKMLParser = (function()
{
	var featureCollection = { type: "FeatureCollection",
				features: [] };
				
	var styles = {};
	
	var fetched = {};
	
	var parseColor = /^(\w{2})(\w{2})(\w{2})(\w{2})$/;
	
	/*
	 * Parse a color string
	 * @param color_string : the color string
	 * @return the color
	 */
	var fromStringToColor = function(color_string)
	{
		var match = parseColor.exec(color_string);
		if ( match )
		{
			return [ parseInt(match[4],16) / 255.0, parseInt(match[3],16) / 255.0, parseInt(match[2],16) / 255.0, parseInt(match[1],16) / 255.0 ];
		}
		
		return [ 1., 1., 1., 1. ];
	};
		
	/*
	 * Parse coordinates, split them and return an array of coordinates in GeoJSON format
	 * @param coordsText : the text node value for coordinates
	 */
	var parseCoordinates = function(coordsText)
	{
		var coordinates = [];
		// Trim the coordinates, then split them
		var coords = coordsText.trim().split(/[\s,]+/);
		for ( var i = 0; i < coords.length; i += 3 )
		{
			coordinates.push( [ parseFloat(coords[i]), parseFloat(coords[i+1]) ] );
		}
		return coordinates;
	};
	
	/*
	 * Parse KML geometry, return a GeoJSON geometry
	 * @param node : a candiate node for geoemtry
	 */
	var checkAndParseGeometry = function(node)
	{
		switch ( node.nodeName )
		{
			case "MultiGeometry":
			{
				var geoms = [];
				
				var children = node.childNodes;
				for (var i = 0; i < children.length; i++)
				{
					var geometry = checkAndParseGeometry(children[i]);
					if ( geometry )
					{
						geoms.push( geometry );
					}
				}
				
				return 	{ type: "GeometryCollection", geometries: geoms };
			}
			break;
			case "LineString":
			{
				var coordNode = node.getElementsByTagName("coordinates");
				if ( coordNode.length == 1 )
				{
					return { type: "LineString",
							coordinates: parseCoordinates( coordNode[0].textContent ) };
				}
			}
			break;
			case "Polygon":
			{
				// TODO : manage holes
				var coordNode = node.getElementsByTagName("coordinates");
				if ( coordNode.length == 1 )
				{
					return { type: "Polygon",
							coordinates: [ parseCoordinates( coordNode[0].textContent ) ] };
				}
			}
			break;
			case "Point":
			{
				var coordNode = node.getElementsByTagName("coordinates");
				if ( coordNode.length == 1 )
				{
					var coord = coordNode[0].textContent.split(",");
					return { type: "Point",
							coordinates: [ coord[0], coord[1] ] };
				}
			}
			break;
		}
	
		return null;
	};
	
	/*
	 * Parse placemark
	 */
	var parsePlacemark = function(node)
	{
		// Create a feature
		var feature = { type: "Feature",
					properties: {},
					geometry: null };
		
		var shareStyle = false;
		var child = node.firstElementChild;
		while ( child )
		{
			switch ( child.nodeName )
			{
			case "name":
				feature.properties.name = child.childNodes[0].nodeValue;
				break;
			case "styleUrl":
				{
					var id = child.childNodes[0].nodeValue;
					if ( styles.hasOwnProperty(id) ) 
					{
						feature.properties.style = styles[id];
						shareStyle = true;
					}
				}
				break;
			case "Style":
				{
					var style = parseStyle(child,feature.properties.name);
					if ( style )
					{
						feature.properties.style = style;
					}
				}
				break;
			default:
				// Try with geometry
				if ( feature.geometry == null )
				{
					feature.geometry = checkAndParseGeometry(child);
				}
			}
			child = child.nextElementSibling;
		}
		
		if ( feature.geometry )
		{
			// Manage the fact that labels are always active with KML
			var style = feature.properties.style;
			if ( style && style.textColor[3] > 0.0 && feature.geometry.type == "Point" )
			{
				style["pointMaxSize"]= 150; 
				
				if ( shareStyle )
				{
					style = feature.properties.style = new GlobWeb.FeatureStyle(style);
				}

				if(!style.iconUrl){
					style.label = feature.properties.name;
				}
				else{
					style.fillColor=[1,1,1,1];
				}
			}
			
			featureCollection.features.push( feature );
		}
	};
	
	/*
	 * Parse line style
	 */
	var parseLineStyle = function(node,style)
	{
		var child = node.firstElementChild;
		while ( child )
		{
			switch ( child.nodeName )
			{
			case "color":
				style.strokeColor = fromStringToColor( child.childNodes[0].nodeValue );
				break;
			case "width":
				style.strokeWidth = parseFloat( child.childNodes[0].nodeValue );
				break;
			}
			child = child.nextElementSibling;
		}
	};
	
	/*
	 * Parse poly style
	 */
	var parsePolyStyle = function(node,style)
	{
		var child = node.firstElementChild;
		while ( child )
		{
			switch ( child.nodeName )
			{
			case "color":
				style.fill = true;
				style.fillColor = fromStringToColor( child.childNodes[0].nodeValue );
				break;
			}
			child = child.nextElementSibling;
		}
	};
	
	/*
	 * Parse icon style
	 */
	var parseIconStyle = function(node,style)
	{
		var child = node.firstElementChild;
		while ( child )
		{
			switch ( child.nodeName )
			{
			case "Icon":
				style.iconUrl = parseProperty(child, "*", "href");
				break;
			}
			child = child.nextElementSibling;
		}
	};

	/*
	 * Parse label style
	 */
	var parseLabelStyle = function(node,style)
	{
		var child = node.firstElementChild;
		while ( child )
		{
			switch ( child.nodeName )
			{
			case "color":
				var labelColor = fromStringToColor( child.textContent.trim() );
				if ( labelColor[3] == 0 )
				{
					style.label = null;
					style.textColor = labelColor;
				}
				break;
			}
			child = child.nextElementSibling;
		}
	};
	
	/*
	 * Parse style
	 */
	var parseStyle = function(node)
	{
		var style = null;
		var id = '#' + node.getAttribute("id");

		if ( styles.hasOwnProperty(id) ) 
		{
			style = styles[id];
		}
		else{
			style = new GlobWeb.FeatureStyle();
			styles[id] = style;
			
			// Iterate through child to manage all different style element
			var child = node.firstElementChild;
			while ( child )
			{
				switch ( child.nodeName )
				{
				case "LineStyle":
					parseLineStyle(child,style);
					break;
				case "IconStyle":
					parseIconStyle(child,style);
					break;
				case "LabelStyle":
					parseLabelStyle(child,style);
					break;
				case "PolyStyle":
					parsePolyStyle(child,style);
					break;
				}
				child = child.nextElementSibling;
			}
		}
			
		return style;
	};

	/**
     * Method: parseStyles
     * Looks for <Style> nodes in the data and parses them
     * Also parses <StyleMap> nodes, but only uses the 'normal' key
     * 
     * Parameters: 
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * 
     */
    var parseStyles = function(nodes) {
        for(var i=0, len=nodes.length; i<len; i++) {
            parseStyle(nodes[i]);
        }
    };
    
    /**
     * Method: parsePlacemarks
     * Looks for <Placemarks> nodes in the data and parses them
     * 
     * Parameters: 
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * 
     */
    var parsePlacemarks = function(nodes) {
        for(var i=0, len=nodes.length; i<len; i++) {
            parsePlacemark(nodes[i]);
        }
    };
    
    
    /**
     * Function: getXmlNodeValue
     * 
     * Parameters:
     * node - {XMLNode}
     * 
     * Returns:
     * {String} The text value of the given node, without breaking in firefox or IE
     */
    var getXmlNodeValue = function(node) {
        var val = node.text;
        if (!val) {
            val = node.textContent;
        }
        if (!val) {
            val = node.firstChild.nodeValue;
        }
        return val;
    };
	
    /**
     * Method: parseProperty
     * Convenience method to find a node and return its value
     *
     * Parameters:
     * xmlNode    - {<DOMElement>}
     * namespace  - {String} namespace of the node to find
     * tagName    - {String} name of the property to parse
     * 
     * Returns:
     * {String} The value for the requested property (defaults to null)
     */    
    var parseProperty= function(xmlNode, namespace, tagName) {
        var value;
        var nodeList = xmlNode.getElementsByTagNameNS(namespace, tagName);
        try {
            value = getXmlNodeValue(nodeList[0]);
        } catch(e) {
            value = null;
        }
     
        return value;
    };
    
    /**
     * Method: parseStyleMaps
     * Looks for <Style> nodes in the data and parses them
     * Also parses <StyleMap> nodes, but only uses the 'normal' key
     * 
     * Parameters: 
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * 
     */
    var parseStyleMaps= function(nodes) {
        // Only the default or "normal" part of the StyleMap is processed now
        // To do the select or "highlight" bit, we'd need to change lots more

        for(var i=0, len=nodes.length; i<len; i++) {
            var node = nodes[i];
            var pairs = node.getElementsByTagName("Pair");

            var id = node.getAttribute("id");
            for (var j=0, jlen=pairs.length; j<jlen; j++) {
                var pair = pairs[j];
                // Use the shortcut in the SLD format to quickly retrieve the 
                // value of a node. Maybe it's good to have a method in 
                // Format.XML to do this
                var key = parseProperty(pair, "*", "key");
                var styleUrl = parseProperty(pair, "*", "styleUrl");

                if (styleUrl && key == "normal") {
                    styles["#" + id] =
                        styles[styleUrl];
                }

            }
        }

    };
    
    /**
     * Method: parseLinks
     * Finds URLs of linked KML documents and fetches them
     * 
     * Parameters: 
     * nodes   - {Array} of {DOMElement} data to read/parse.
     * options - {Object} Hash of options
     * 
     */
    var parseLinks= function(nodes) {
        // Fetch external links <NetworkLink> and <Link>

        for(var i=0, len=nodes.length; i<len; i++) {
            var href = parseProperty(nodes[i], "*", "href");
            if(href && !fetched[href]) {
                fetched[href] = true; // prevent reloading the same urls
                var data = fetchLink(href);
                if (data) {
            		featureCollection.features = featureCollection.features.concat(parse(data).features);
                }
            } 
        }

    };
    
    /**
     * Method: fetchLink
     * Fetches a URL and returns the result
     * 
     * Parameters: 
     * href  - {String} url to be fetched
     * 
     */
    var fetchLink= function(href) {
    	//TODO: handle CORS
    	var xhr = new XMLHttpRequest();
    	xhr.open("GET", href, false);
    	xhr.send();
    	return xhr.responseXML;
    	
    };
    
    
	/*
	 * Parse a KML document
	 */
	var parse = function(data)
	{
		// Loop throught the following node types in this order and
        // process the nodes found 
        var types = ["Link", "NetworkLink", "Style", "StyleMap", "Placemark"];
        for(var i=0, len=types.length; i<len; ++i) {
            var type = types[i];

            var nodes = data.getElementsByTagName(type);
            //var nodes = this.getElementsByTagNameNS(data, "*", type);

            // skip to next type if no nodes are found
            if(nodes.length == 0) { 
                continue;
            }

            switch (type.toLowerCase()) {

	            // Fetch external links 
	            case "link":
	            case "networklink":
	                parseLinks(nodes);
	                break;

                // parse style information
                case "style":
                    parseStyles(nodes);
                    break;
                case "stylemap":
                    parseStyleMaps(nodes);
                    break;
                // parse features
                case "placemark":
                    parsePlacemarks(nodes);
                    break;
            }
        }
		return featureCollection;
	};
	
	return { parse: parse };
})();
