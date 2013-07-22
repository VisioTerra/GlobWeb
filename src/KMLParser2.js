define(['./KMLObjects'], function(KMLObjects){
	 var KMLFactory = function()
	 {
	 
	 }
	 
	 KMLFactory.prototype.createObjectFromNode = function(node)
	{
		var functionName = 'create' + node.nodeName.toUpperCase();
		var func = this[functionName];
		if (typeof func === 'function')
			 return this[functionName](node);
			
		return null;
	}

	KMLFactory.prototype.createDOCUMENT = function(node)
	{

		var document = new KMLObjects.KMLDocument();
		document.setID(node.getAttribute('id'));
		if (node.hasChildNodes())
		{
			var length =  node.childNodes.length;
			for (var i = 0; i < length; i++)
			{
				var object = this.createObjectFromNode(node.childNodes[i]);

				if (object && object.isKMLFeature)
					document.addFeature(object);
					
				if (object && object.isKMLStyle)
					document.addStyle(object);
					
			}
			
			this.setAbstractFeatureParameters(node, document);
		}
		
		return document;

	}

	KMLFactory.prototype.createNETWORKLINK = function(node)
	{
		var link = this.getChildNodeByTagName(node, 'Link');
		if (link == null)
		{
			//TODO to remove
			/**/
			var go = this.getChildNodeByTagName(node, 'GroundOverlay');
			if (go){
				goObj = this.createGROUNDOVERLAY(go);
				if (goObj)
				{
					this.setAbstractFeatureParameters(node, goObj);
				}
				return goObj;
			}
			/**/
			return null;
		}
			
		var linkObject = new KMLObjects.KMLLink();
		this.setLinkParameters(link, linkObject);

		var res = new KMLObjects.KMLNetworkLink();
		res.setLink(linkObject);
		
		this.setAbstractFeatureParameters(node, res);

		return res;

	}

	KMLFactory.prototype.createGROUNDOVERLAY = function(node)
	{
		var res = new KMLObjects.KMLGroundOverlay();
		
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'color');
		if (paramNode) res.setColor(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'drawOrder');
		if (paramNode) res.setDrawOrder(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'Icon');
		if (paramNode) 
		{
			var icon = new KMLObjects.KMLIcon();
			this.setLinkParameters(paramNode, icon)
			res.setIcon(icon);
		}
		
		paramNode = this.getChildNodeByTagName(node, 'altitude');
		if (paramNode) res.setAltitude(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'altitudeMode');
		if (paramNode) res.setAltitudeMode(paramNode.textContent);
		
		
		paramNode = this.getChildNodeByTagName(node, 'LatLonBox');
		if (paramNode) 
		{
			var box = this.createLatLonBox(paramNode);
			res.setLatLonBox(box);
		}
		
		if (!res.latLonBox) //TODO to remove
		{
			paramNode = this.getChildNodeByTagName(node, 'LatLonAltBox');
			if (paramNode) 
			{
				var box = this.createLatLonAltBox(paramNode);
				res.setLatLonBox(box);
			}
		}
		
		this.setAbstractFeatureParameters(node, res);
		
		return res;
	}

	KMLFactory.prototype.createPLACEMARK = function(node)
	{
		var res = new KMLObjects.KMLPlacemark();
		
		if (node.hasChildNodes())
		{
			var length =  node.childNodes.length;
			for (var i = 0; i < length; i++)
			{
				
				var object = this.createObjectFromNode(node.childNodes[i]);
				
				if (object && object.isKMLGeometry)
				{
					object.region = this.getRegion(node.childNodes[i]);
					res.addGeometry(object);
				}
			}
		}
		this.setAbstractFeatureParameters(node, res);
		
		return res;
	}

	KMLFactory.prototype.createLINEARRING = function(node)
	{
		var paramNode;

		paramNode = this.getChildNodeByTagName(node, 'coordinates');
		if (paramNode)
		{	
			var res = new KMLObjects.KMLLinearRing();
			var coord = this.parseCoordinates(paramNode.textContent);
			res.setCoordinates([coord]);
		}
		else return null;
		
		paramNode = this.getChildNodeByTagName(node, 'extrude');
		if (paramNode) res.setExtrude(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'tessellate');
		if (paramNode) res.setTessellate(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'altitudeMode');
		if (paramNode) res.setAltitudeMode(paramNode.textContent);
		
		return res;
	}

	KMLFactory.prototype.createPOINT = function(node)
	{
		var paramNode;
			paramNode = this.getChildNodeByTagName(node, 'coordinates');
		if (paramNode)
		{	
			var res = new KMLObjects.KMLPoint();
			var coord = this.parseCoordinates(paramNode.textContent);
			res.setCoordinates(coord[0]);
		}
		else return null;
		
		paramNode = this.getChildNodeByTagName(node, 'extrude');
		if (paramNode) res.setExtrude(paramNode.textContent);

		paramNode = this.getChildNodeByTagName(node, 'altitudeMode');
		if (paramNode) res.setAltitudeMode(paramNode.textContent);
		
		return res;
	}

	KMLFactory.prototype.createPOLYGON = function(node)
	{
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'outerBoundaryIs');
		if (paramNode)
		{	
			linNode = this.getChildNodeByTagName(paramNode, 'LinearRing');
			if (linNode)
			{
				var linearRing =  this.createLINEARRING(linNode);
				if (linearRing)
				{
					var res = new KMLObjects.KMLPolygon();
					res.setOuterBoundaryIs(linearRing);
				}
				else return null;
			}
			else return null;
		}
		else return null;
		
		paramNode = this.getChildNodeByTagName(node, 'extrude');
		if (paramNode) res.setExtrude(paramNode.textContent);

		paramNode = this.getChildNodeByTagName(node, 'altitudeMode');
		if (paramNode) res.setAltitudeMode(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'tessellate');
		if (paramNode) res.setTessellate(paramNode.textContent);
		
		return res;
	}

	KMLFactory.prototype.parseCoordinates = function(coordsText)
	{
		var coordinates = [];
		// Trim the coordinates, then split them
		var coords = coordsText.trim().split(/[\s,]+/);
		var length =  coords.length;
		for ( var i = 0; i < length; i += 3 )
		{
			coordinates.push( [ parseFloat(coords[i]), parseFloat(coords[i+1]) ] );
		}
		return coordinates;
	};

	KMLFactory.prototype.setLinkParameters = function(node, res)
	{
		
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'href');
		if (paramNode) res.setHref(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'refreshMode');
		if (paramNode) res.setRefreshMode(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'refreshInterval');
		if (paramNode) res.setRefreshInterval(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'viewRefreshMode');
		if (paramNode) res.setViewRefreshMode(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'viewRefreshTime');
		if (paramNode) res.setViewRefreshTime(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'viewBoundScale');
		if (paramNode) res.setViewBoundScale(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'viewFormat');
		if (paramNode) res.setViewFormat(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'httpQuery');
		if (paramNode) res.setHttpQuery(paramNode.textContent);

	}

	KMLFactory.prototype.createRegion = function(node)
	{
		var llab = this.getChildNodeByTagName(node, 'LatLonAltBox');
		if (llab == null)
			return null;

		var llabObject = this.createLatLonAltBox(llab);
		if (llabObject == null)
			return null;
			
		
		var res = new KMLObjects.KMLRegion();
		
		res.setLatLonAltBox(llabObject);
		
		var lod = this.getChildNodeByTagName(node, 'Lod');
		if (lod)
		{
			var lodObject = this.createLod(lod);
			if (lodObject != null)
				res.setLod(lodObject);
		}
		return res;
		
	}

	KMLFactory.prototype.createLatLonAltBox = function(node)
	{
		var res = new KMLObjects.KMLLatLonAltBox();
		
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'north');
		if (paramNode) res.setNorth(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'east');
		if (paramNode) res.setEast(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'west');
		if (paramNode) res.setWest(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'south');
		if (paramNode) res.setSouth(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'minAltitude');
		if (paramNode) res.setMinAltitude(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'maxAltitude');
		if (paramNode) res.setMaxAltitude(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'altitudeMode');
		if (paramNode) res.setAltitudeMode(paramNode.textContent);
		
		if (!res.north || !res.south || !res.east || !res.west) 
			return null;
			
		return res;
		
	}

	KMLFactory.prototype.createLatLonBox = function(node)
	{
		var res = new KMLObjects.KMLLatLonBox();
		
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'north');
		if (paramNode) res.setNorth(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'east');
		if (paramNode) res.setEast(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'west');
		if (paramNode) res.setWest(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'south');
		if (paramNode) res.setSouth(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'rotation');
		if (paramNode) res.setRotation(paramNode.textContent);

		
		if (!res.north || !res.south || !res.east || !res.west) 
			return null;
			
		return res;
		
	}

	KMLFactory.prototype.createLod = function(node)
	{
		var res = new KMLObjects.KMLLod();
		
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'minLodPixels');
		if (paramNode) res.setMinLodPixels(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'maxLodPixels');
		if (paramNode) res.setMaxLodPixels(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'minFadeExtent');
		if (paramNode) res.setMinFadeExtent(paramNode.textContent);
		paramNode = this.getChildNodeByTagName(node, 'maxFadeExtent');
		if (paramNode) res.setMaxFadeExtent(paramNode.textContent);

		
		if (!res.minLodPixels) 
			return null;
			
		return res;
	}

	KMLFactory.prototype.getRegion = function(node)
	{
		var region = this.getChildNodeByTagName(node, 'Region');
		if (region == null)
			return null;
		
		return this.createRegion(region);
	}

	KMLFactory.prototype.setAbstractFeatureParameters = function(node, object)
	{
		var paramNode;
		
		paramNode = this.getChildNodeByTagName(node, 'name');
		if (paramNode) object.setName(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'description');
		if (paramNode) object.setDescription(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'visibility');
		if (paramNode) object.setVisibility(paramNode.textContent);
		
		paramNode = this.getChildNodeByTagName(node, 'Region');
		if (paramNode) object.setRegion(this.getRegion(node));

	}

	KMLFactory.prototype.getChildNodeByTagName = function(node, nodeName)
	{
		var res = null;
		
		if (node.hasChildNodes())
		{
			var length =  node.childNodes.length;
			for (var i = 0; i < length; i++)
			{
				var currentNode = node.childNodes[i];
				if (currentNode.nodeName == nodeName)
				{
					res = currentNode;
					break;
				}
			}
		}
		
		return res;

	}

	/**************************************************************************************************************/

	/** @constructor
		KMLParser constructor
	 */
	var KMLParser = function()
	{
		this.factory = new KMLFactory();
	} 


	KMLParser.prototype.parse = function(data)
	{
		features = [];
		if (data.firstChild.nodeName.toLowerCase() != 'kml')
			throw 'not a kml file';
			
		if (data.firstChild.hasChildNodes())
		{
			var length =  data.firstChild.childNodes.length;
			for( var i = 0; i < length; i++)
			{
				var object = this.factory.createObjectFromNode(data.firstChild.childNodes[i]);
				
				if (object)
					features.push(object);
			
			}
		}
		return features;
	}

	return KMLParser;

});