//*************************************************************************

define(['./Tile', './Program'],
 function(Tile, Program)
{

	/**
	 * Constructor of TileRequest objects
	*/
	var TileRequest = function(cb)
	{	
		this.failed = false;
		this.tile = null;
		this.imageLoaded = false;
		this.callback = cb;

		var that = this;
		
		this.image = new Image();
		this.image.crossOrigin = '';
		
		var handleLoadedImage = function() 
		{
			that.imageLoaded = true;
			that.callback();
		}
		
		var handleErrorImage = function(){
				this.tile.state = Tile.State.ERROR;
				this.tile = null;
			};
		
		this.image.onload = function() { handleLoadedImage(); };
		this.image.onerror = function()  { handleErrorImage(); };

		this.launch = function(imageUrl)
		{
			this.failed = false;
			
			this.imageLoaded = false;
			this.image.src = imageUrl;
		}
	}
	
	/**************************************************************************************************************/

	/** 
		@constructor
		RegularOverlayRenderer constructor
	 */
	var RegularOverlaysRenderer = function(tileManager)
	{
	
		this.renderContext = tileManager.renderContext;
		this.tileIndexBuffer = tileManager.tileIndexBuffer;
		// Tile requests : limit to 4 at a given time
		this.maxRequests = 4;
		this.availableRequests = [];
		var rc = this.renderContext;
		for ( var i=0; i < this.maxRequests; i++ )
		{
			this.availableRequests[i] = new TileRequest(
				function(){
					this.tile.texture = rc.createNonPowerOfTwoTextureFromImage(this.image);
					this.tile.state = Tile.State.LOADED;
					this.tile = null;
				}
			);

		}
		
		var vertexShader = "\
		attribute vec3 vertex;\n\
		attribute vec2 tcoord;\n\
		uniform mat4 modelViewMatrix;\n\
		uniform mat4 projectionMatrix;\n\
		\
		varying vec2 texCoord;\n\
		\
		void main(void) \n\
		{\n\
			gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);\n\
			texCoord.xy = tcoord.xy;\n\
		}\n\
		";

		var fragmentShader = "\
		#ifdef GL_ES\n\
		precision highp float;\n\
		#endif\n\
		\n\
		varying vec2 texCoord;\n\
		uniform sampler2D overlayTexture;\n\
		uniform float opacity; \n\
		uniform vec2 scale; \n\
		uniform vec2 shift; \n\
		\n\
		void main(void)\n\
		{\n\
			\n\
			vec2 tc = vec2(scale.x * texCoord.x + shift.x , scale.y * texCoord.y + shift.y ); \n\
			if ((tc.x >= 0.0 && tc.x <= 1.0 && tc.y >= 0.0 && tc.y <= 1.0) == false) discard;\n\
			gl_FragColor.rgba = texture2D(overlayTexture, tc); \n\
			gl_FragColor.a *= opacity; \n\
			\n\
		}\n\
		";
		
		this.program = new Program(this.renderContext);
		this.program.createFromSource( vertexShader, fragmentShader );
		
		this.overlays = [];
		this.globe = tileManager.globe;
		this.needsOffset = true;
	}

	//*************************************************************************

	/*
		Render the regular overlays layers above the tiles in parameter
	 */
	RegularOverlaysRenderer.prototype.render = function( tiles )
	{
		var gl = this.renderContext.gl;

		// Setup program
		this.program.apply();
		
		var attributes = this.program.attributes;
			
		gl.uniformMatrix4fv(this.program.uniforms["projectionMatrix"], false, this.renderContext.projectionMatrix);
		gl.uniform1i(this.program.uniforms["overlayTexture"], 0);
		gl.enable(gl.BLEND);
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.depthFunc( gl.LEQUAL );
		
		var modelViewMatrix = mat4.create();
		
		var currentIB = null;
		var tilesLength = tiles.length;

		this.tilesToRequest = [];
		var overlaysLength = this.overlays.length;
		for ( var j=0; j < overlaysLength; j++ )
		{
			var grid = this.overlays[j];
			if (grid.visible == false)
				continue;
			
			var arrays = grid.getTileArrays();
			var tilesToRender = arrays.tilesToRender;
			this.tilesToRequest = this.tilesToRequest.concat(arrays.tilesToRequest);
			var tilesToRenderLength = tilesToRender.length;
			gl.uniform1f(this.program.uniforms["opacity"], grid.opacity );
			
			for ( var i = 0; i < tilesLength; i++ )
			{
				var tile = tiles[i];
				if ( grid.geoBound.intersects( tile.geoBound ) == true)
				{
					var extent = (tile.state == Tile.State.LOADED) ? tile.geoBound : tile.parent.geoBound;
			
					mat4.multiply( this.renderContext.viewMatrix, tile.matrix, modelViewMatrix );
					gl.uniformMatrix4fv(this.program.uniforms["modelViewMatrix"], false, modelViewMatrix);

					// Bind the vertex buffer
					gl.bindBuffer(gl.ARRAY_BUFFER, tile.vertexBuffer);
					gl.vertexAttribPointer(attributes['vertex'], 3, gl.FLOAT, false, 0, 0);
					
					// Bind the index buffer only if different (index buffer is shared between tiles)
					var indexBuffer = ( tile.state == Tile.State.LOADED ) ? this.tileIndexBuffer.getSolid() : this.tileIndexBuffer.getSubSolid(tile.parentIndex);
					if ( currentIB != indexBuffer )
					{
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
						currentIB = indexBuffer;
					}

					for (var kl = 0; kl < tilesToRenderLength; kl++){
						var overlay = tilesToRender[kl];
						if (tile.geoBound.intersects(overlay.geoBound) == true){
							
							var transform = this.calculateTransform(overlay.geoBound, extent);
							gl.uniform2f(this.program.uniforms["scale"], transform.HScale, transform.VScale);
							gl.uniform2f(this.program.uniforms["shift"], transform.HShift, transform.VShift);

							gl.activeTexture(gl.TEXTURE0);
							gl.bindTexture(gl.TEXTURE_2D, overlay.texture);

							// Finally draw the tiles
							gl.drawElements(gl.TRIANGLES, indexBuffer.numIndices, gl.UNSIGNED_SHORT, 0);
						}
					}
				}
			}
			
		}
		
		this.launchRequests();

		gl.disable(gl.BLEND);
	}

	//*************************************************************************

	/**
		Request tiles
	 */
	 RegularOverlaysRenderer.prototype.launchRequests = function()
	 {
		var _sortTilesByDistance = function(t1,t2){ return t1.distance - t2.distance;};
		
		// Process request
		this.tilesToRequest.sort( _sortTilesByDistance );
		
		var trl = this.tilesToRequest.length; 
		for ( var i = 0; i < trl; i++ )
		{
			var tile = this.tilesToRequest[i];
			this.launchRequest( tile );
		}
	}

	//****************************************************************************

	/**
		Launch the HTTP request for a tile
	 */
	RegularOverlaysRenderer.prototype.launchRequest = function(tile)
	{
		var tileRequest = null;
		// Find a 'free' request
		var availableRequestsLength = this.availableRequests.length;
		for ( var i = 0; i < availableRequestsLength; i++ )
		{
			if ( !this.availableRequests[i].tile )
			{
				tileRequest = this.availableRequests[i];
				break;
			}
		}
		
		// Process the request
		if ( tileRequest )
		{
			tileRequest.tile = tile;
			tileRequest.launch( tile.url, null );

			tile.state = Tile.State.LOADING;
		}
		else
		{
			tile.state = Tile.State.NONE;
		}
	}
	
		//*************************************************************************

	/**
	 * Returns shift and scale values for a given extent
	*/ 
	RegularOverlaysRenderer.prototype.calculateTransform = function(baseExtent, extent)
	{
		var vscale, hscale, vshift, hshift;

		var geobound = baseExtent;

		vscale = 1/((geobound.north - geobound.south) /(extent.north - extent.south) );
		hscale = 1/((geobound.east - geobound.west) / (extent.east - extent.west) );

		vshift = (geobound.north - extent.north) / (extent.north - extent.south)  * vscale ;
		hshift = -(geobound.west - extent.west) / (extent.east - extent.west)  * hscale;

		return {
				VScale : vscale,
				HScale : hscale,
				VShift : vshift,
				HShift : hshift

		};
	}
	
	return RegularOverlaysRenderer;
});

