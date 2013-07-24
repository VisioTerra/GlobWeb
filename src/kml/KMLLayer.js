
 define( ['../VectorLayer', '../GeoBound', './KMLParser2', './KMLRenderer', '../RegularOverlaysRenderer', '../FeatureStyle', '../Tile', './KMLObjects'], function(VectorLayer, GeoBound, KMLParser, KMLRenderer, RegularOverlaysRenderer, FeatureStyle, Tile, KMLObjects) {
 
	var KMLLayer = function(options)
	{

		if (options.url == undefined)
			throw 'EXCEPTION in KMLLayer constructor: No URL specified'

		this.url = options.url;
		this.baseURL = this.url.substr(0, this.url.lastIndexOf('/') + 1);
		this.opacity = options.opacity || 1;
		
		this.vectorLayer = new VectorLayer();
		
		this.features = [];
		this.geoBound = new GeoBound(-180, -90, 180, 90); // so tile.geobound.intersects(layer.geobound) returns true (RegularOverlayRenderer) ... add options.geoBound???
		var that = this;
			
		var onreadystatechange = function(e) 
		{
			if ( this.readyState == 4 )
			{
				if (this.status == 200)
				{
					if (!that.parser)
						that.parser  = new KMLParser();
					
					that.features = that.parser.parse(this.responseXML);
				}
				that.xhrFinished = true;
		
			}
		}; 

		var xhr = new XMLHttpRequest();
		
		xhr.onreadystatechange = onreadystatechange;
		xhr.open("GET", this.url);
		xhr.send()
		
		this.xhr = xhr;
		
	}

	//*************************************************************************

	/**
		Attach layer to the globe
	 */
	KMLLayer.prototype._attach = function( globe )
	{

		var renderer = globe.kmlRenderer;
		if ( !renderer )
		{
			renderer = new KMLRenderer();
			globe.kmlRenderer = renderer;
			globe.preRenderers.push(renderer);
		}
		renderer.kmlLayers.push( this );
		
		var renderer = globe.regularOverlaysRenderer;
		if ( !renderer )
		{
			renderer = new RegularOverlaysRenderer(globe.tileManager);
			globe.tileManager.addPostRenderer( renderer );
			globe.regularOverlaysRenderer = renderer;
		}
		renderer.overlays.push( this );
		
		this.globe = globe;
		this.globe.addLayer(this.vectorLayer);
	}

	//*************************************************************************

	/**
		Detach layer from the globe
	 */
	KMLLayer.prototype._detach = function( globe )
	{
		
		var prevRenderer = this.globe.kmlRenderer;
		if ( prevRenderer )
		{
			var index = prevRenderer.kmlLayers.indexOf( this );
			if ( index != - 1 )
			{
				prevRenderer.kmlLayers.splice(index,1);
				
				if ( prevRenderer.kmlLayers.length == 0 )
				{
					this.globe.preRenderers.splice(this.globe.preRenderers.lastIndexOf(prevRenderer), 1);
					this.globe.kmlRenderer = null;
				}
			}
		}
		
		var prevRenderer = this.globe.regularOverlaysRenderer;
		if ( prevRenderer )
		{
			var index = prevRenderer.overlays.indexOf( this );
			if ( index != - 1 )
			{
				prevRenderer.overlays.splice(index,1);
				
				if ( prevRenderer.overlays.length == 0 )
				{
					this.globe.tileManager.removePostRenderer( prevRenderer );
					this.globe.regularOverlaysRenderer = null;
				}
			}
		}
		
		this.globe.removeLayer(this.vectorLayer);
		this.globe = null;
		
	}

	//*************************************************************************
		
	/**
		Returns two fields object
		tilesToRender : list of the tiles ready for rendering
		tilesToRequest : list of the tiles to load
	 */
	KMLLayer.prototype.getTileArrays = function( )
	{
		return { tilesToRender : this.tilesToRender, tilesToRequest : this.tilesToRequest};
	}

	//*************************************************************************

	/**
		update depending of the current view
	 */
	KMLLayer.prototype.update = function( )
	{

		this.tilesToRequest = []
		this.tilesToRender = []
		
		if (!this.geometryFeatures)
			this.geometryFeatures = {type: 'FeatureCollection', features : []};
		
		
		if (this.geometryFeatures.features.length > 0){
			this.vectorLayer.removeAllFeatures();	
			this.geometryFeatures.features.length = 0;
		}
	
		var length =  this.features.length;
		for (var i = 0; i < length; i++)
		{
			this.visitNode(this.features[i], this.baseURL);
		}
		this.vectorLayer.addFeatureCollection(this.geometryFeatures);
		
	}

	//*************************************************************************
	
	KMLLayer.prototype.visitNode = function(node, baseURL)
	{
		if (this.isRegionVisible(node) == false)
			return;

		if (node.isKMLContainer)
		{
			var length =  node.features.length;
			for (var i = 0; i < length; i++)
			{
				this.visitNode(node.features[i], baseURL);
			}
		}
		else if (node.isKMLFeature)
		{
			if (node.__proto__ === KMLObjects.KMLGroundOverlay.prototype)
			{
			
				if (!node.state)
				{
					node.state = Tile.State.NONE;
					if (node.icon && node.icon.href)
						node.url = this.isAbsoluteURL(node.icon.href) ? node.icon.href : baseURL + node.icon.href;
					else node.url = null;
					if (node.latLonBox)
						node.geoBound = new GeoBound(node.latLonBox.west, node.latLonBox.south, node.latLonBox.east, node.latLonBox.north);
					else
						node.geoBound = new GeoBound(-180, -90, 180, 90);
				}
				if (node.state == Tile.State.NONE)
				{
					this.tilesToRequest.push(node);
				}
				else if(node.state == Tile.State.LOADED)
				{
					this.tilesToRender.push(node);
				}
			}
			else if (node.__proto__ === KMLObjects.KMLNetworkLink.prototype)
			{
				if (node.fetched)
				{
					if (node.features)
					{
						var length =  node.features.length;
						for (var i = 0; i < length; i++)
						{
							this.visitNode(node.features[i], node.baseURL);
						}
					}
					// return;
				}
				else if (this.xhrFinished && node.link && node.link.href)
				{
					this.xhrFinished = false;
					var that = this;
					this.xhr.onreadystatechange = function()
					{
						if ( this.readyState == 4 )
						{
							node.fetched = true;
							if (this.status == 200)
								node.features = that.parser.parse(this.responseXML);
							that.xhrFinished = true;
						}
					}
					var url = this.isAbsoluteURL(node.link.href) ? node.link.href : baseURL + node.link.href;
					node.baseURL = url.substr(0, url.lastIndexOf('/') + 1);
					this.xhr.open('GET', url)
					this.xhr.send();
				}
			}
			else if (node.__proto__ === KMLObjects.KMLPlacemark.prototype)
			{
				var length =  node.geometryFeatures.length;
				for (var i = 0; i < length; i++)
				{
					var obj = node.geometryFeatures[i];
					if (this.isRegionVisible(obj) == false)
						continue;
					if (obj.__proto__ == KMLObjects.KMLPolygon.prototype)
					{
						if (!obj.feature){
							var style = new FeatureStyle(); //TODO : extract style from kml  instead of default style
							obj.feature = { type : "Feature", properties : {style : style}}
							obj.feature.geometry = {type : 'Polygon', coordinates : obj.outerBoundaryIs.coordinates}
						}
						this.geometryFeatures.features.push(obj.feature);
					}
					else if (obj.__proto__ == KMLObjects.KMLPoint.prototype)
					{
						if (!obj.feature){
						
							obj.feature = { type : "Feature", properties : {style : new FeatureStyle()}}
							obj.feature.geometry = {type : 'Point', coordinates : obj.coordinates}
						}
						this.geometryFeatures.features.push(obj.feature);
					}
				}
			}
		}
	}

	//*************************************************************************
	//TODO : improve the algorithm
	KMLLayer.prototype.isRegionVisible = function(object)
	{
		if (!object.region)
			return true;
		else
		{
			var region = object.region;
			
			var pxl1 = this.globe.getPixelFromLonLat(region.latLonAltBox.west, region.latLonAltBox.north);
			var pxl2 = this.globe.getPixelFromLonLat(region.latLonAltBox.east, region.latLonAltBox.north);
			var pxl3 = this.globe.getPixelFromLonLat(region.latLonAltBox.east, region.latLonAltBox.south);
			var pxl4 = this.globe.getPixelFromLonLat(region.latLonAltBox.west, region.latLonAltBox.south);
			
			
			var minX = Math.min(
				pxl1[0],
				pxl2[0],
				pxl3[0],
				pxl4[0]
			)
			
			var minY = Math.min(
				pxl1[1],
				pxl2[1],
				pxl3[1],
				pxl4[1]
			)
			
			var maxX = Math.max(
				pxl1[0],
				pxl2[0],
				pxl3[0],
				pxl4[0]
			)
			
			var maxY = Math.max(
				pxl1[1],
				pxl2[1],
				pxl3[1],
				pxl4[1]
			)
			
			var maxW = this.globe.renderContext.canvas.width ;
			var maxH = this.globe.renderContext.canvas.height;
			var minW = 0;
			var minH = 0;
			
			if (
				minX < maxW &&
				minW < maxX &&
				minY < maxH &&
				minH < maxY
			)
			{
				var size = Math.min(
						Math.abs(pxl2[0] - pxl1[0]),
						Math.abs(pxl3[0] - pxl4[0]),
						Math.abs(pxl4[1] - pxl1[1]),
						Math.abs(pxl3[1] - pxl2[1])
					);
						

				if (region.lod.minLodPixels < size && (size < region.lod.maxLodPixels || region.lod.maxLodPixels == -1))
				{
					return true;
				}
			}

			return false;
		}
		
	}

	//*************************************************************************
	
	KMLLayer.prototype.isAbsoluteURL = function(str)
	{
		return str.substr(0,7) == 'http://' || str.substr(0,8) == 'https://';
	}
	
	return KMLLayer;
});