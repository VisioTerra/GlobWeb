//*************************************************************************
define(['./GeoBound', './RegularOverlaysRenderer', './Tile'], function(GeoBound, RegularOverlaysRenderer, Tile)
{
	/** @constructor
		@export
		This layer draws an image overlay draped onto the terrain
		Arg : options
			url : url of the image to drape on the terrain
			north : north value of the extent of the image
			south : south value of the extent of the image
			east : east value of the extent of the image
			west : west value of the extent of the image
			opacity : opacity of the layer
	 */
	RegularOverlayLayer = function( options )
	{
		this.quad = options.quad;
		this.opacity = options.opacity || 1.0;
			
		this.geoBound = new GeoBound(options.west, options.south, options.east, options.north);
		this.state = Tile.State.NONE;
		this.url = options.url;
		this.globe = null;
		this.visible = true;
	}

	//*************************************************************************

	/**
		Attach layer to the globe
	 */
	RegularOverlayLayer.prototype._attach = function( globe )
	{
		var renderer = globe.regularOverlaysRenderer;
		if ( !renderer )
		{
			renderer = new RegularOverlaysRenderer(globe.tileManager);
			globe.tileManager.addPostRenderer( renderer );
			globe.regularOverlaysRenderer = renderer;
		}
		renderer.overlays.push( this );
		
		this.globe = globe;
	}

	//*************************************************************************

	/**
		Dtach layer from the globe
	 */
	RegularOverlayLayer.prototype._detach = function( globe )
	{
		// Remove layer from the globe renderer for ground overlay
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
	}

	//*************************************************************************

	/**
		Returns two fields object
		tilesToRender : list of the tiles ready for rendering
		tilesToRequest : list of the tiles to load
	 */
	RegularOverlayLayer.prototype.getTileArrays = function( globe )
	{
		var tilesToRequest = []
		var tilesToRender = []
		
		if (this.state == Tile.State.NONE)
		{
			tilesToRequest.push(this);
			this.state = Tile.State.REQUESTED;
		}else if (this.state == Tile.State.LOADED)
		{
			tilesToRender.push(this);
		}
		
		return { tilesToRender : tilesToRender, tilesToRequest : tilesToRequest};
	}



	return RegularOverlayLayer;
});

