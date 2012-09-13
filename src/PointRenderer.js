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
	Basic module to generate texture from text
 */	
GlobWeb.Text = (function()
{
	var fontSize = 18;
	var margin = 1;
	var canvas2d = null;
	
	var initialize = function()
	{
		canvas2d = document.createElement("canvas");
		canvas2d.width = 512;
		canvas2d.height = fontSize  + 2 * margin;
	}
	
	var generateImageData = function(text, textColor)
	{
		if (!canvas2d)
			initialize();
		
		if(!textColor)
			textColor = '#fff';
		
		var ctx = canvas2d.getContext("2d");
		ctx.clearRect(0,0,canvas2d.width,canvas2d.height);
		ctx.fillStyle = textColor;
		ctx.font = fontSize + 'px sans-serif';
		ctx.textBaseline = 'top';
		ctx.shadowColor = '#000';
		ctx.shadowOffsetX = 1;
		ctx.shadowOffsetY = 1;
		ctx.shadowBlur = 2;
		ctx.fillText(text, margin, margin);
		//ctx.lineWidth = 1.0;
		//ctx.strokeText(text, margin, margin);
		
		var metrics = ctx.measureText(text);
		return ctx.getImageData(0,0, Math.floor(metrics.width)+2*margin,canvas2d.height)
	}
	
	
	return { generateImageData: generateImageData };
})();


/**************************************************************************************************************/

/** @constructor
	POI Renderer constructor
 */
GlobWeb.PointRenderer = function(tileManager)
{
	// Store object for rendering
	this.renderContext = tileManager.renderContext;
	this.tileConfig = tileManager.tileConfig;
	
	// Bucket management for rendering : a bucket is a texture with its points
	this.buckets = [];
	
	// For stats
	this.numberOfRenderPoints = 0;
 	
	var vertexShader = "\
	attribute vec3 vertex; // vertex have z = 0, spans in x,y from -0.5 to 0.5 \n\
	uniform mat4 viewProjectionMatrix; \n\
	uniform vec3 poiPosition; // world position \n\
	uniform vec2 poiScale; // x,y scale \n\
	uniform vec2 tst; \n\
	\n\
	varying vec2 texCoord; \n\
	\n\
	void main(void)  \n\
	{ \n\
		// Generate texture coordinates, input vertex goes from -0.5 to 0.5 (on x,y) \n\
		texCoord = vertex.xy + vec2(0.5) + tst; \n\
		// Invert y \n\
		texCoord.y = 1.0 - texCoord.y; \n\
		\n\
		// Compute poi position in clip coordinate \n\
		gl_Position = viewProjectionMatrix * vec4(poiPosition, 1.0); \n\
		gl_Position.xy += vertex.xy * gl_Position.w * poiScale; \n\
	} \n\
	";
	
	var fragmentShader = "\
	#ifdef GL_ES \n\
	precision highp float; \n\
	#endif \n\
	\n\
	varying vec2 texCoord; \n\
	uniform sampler2D texture; \n\
	\n\
	void main(void) \n\
	{ \n\
		gl_FragColor = texture2D(texture, texCoord); \n\
	} \n\
	";

    this.program = new GlobWeb.Program(this.renderContext);
    this.program.createFromSource(vertexShader, fragmentShader);
  
    this.mesh = new GlobWeb.Mesh(this.renderContext);
    var vertices = [-0.5, -0.5, 0.0,
                    -0.5,  0.5, 0.0,
                     0.5,  0.5, 0.0,
                     0.5, -0.5, 0.0];
    var indices = [0, 3, 1, 1, 3, 2];
    this.mesh.setVertices(vertices);
    this.mesh.setIndices(indices);
}

/**************************************************************************************************************/

/*
	Build a texture from an image and store in a bucket
 */
GlobWeb.PointRenderer.prototype._buildTextureFromImage = function(bucket,image)
{  	
	bucket.texture = this.renderContext.createNonPowerOfTwoTextureFromImage(image);
	bucket.textureWidth = image.width;
	bucket.textureHeight = image.height;
}

/**************************************************************************************************************/

/*
	Add a point to the renderer
 */
GlobWeb.PointRenderer.prototype.addFeature = function(feature,style)
{
	if ( style )
	{
		var bucket = this.getOrCreateBucket( style );
		
		if ( style.label )
		{
			var imageData = GlobWeb.Text.generateImageData(feature['properties']['name'], feature['properties']['textColor']);
			this._buildTextureFromImage(bucket,imageData);
		}

		
		var posGeo = feature['geometry']['coordinates'];
		var pos3d = GlobWeb.CoordinateSystem.fromGeoTo3D( posGeo );
		var vertical = vec3.create();
		vec3.normalize(pos3d, vertical);
		
		var pointRenderData = { pos3d: pos3d,
							vertical: vertical,
							feature: feature };

		bucket.points.push( pointRenderData );
	}
}

/**************************************************************************************************************/

/*
	Remove a point from renderer
 */
GlobWeb.PointRenderer.prototype.removeFeature = function(feature)
{
	for ( var i = 0; i < this.buckets.length; i++ )
	{
		var bucket = this.buckets[i];
		for ( var j = 0; j < bucket.points.length; j++ )
		{
			if ( bucket.points[j].feature == feature )
			{
				bucket.points.splice( j, 1 );
				return;
			}
		}
	}
}

/**************************************************************************************************************/

/*
	Get or create bucket to render a point
 */
GlobWeb.PointRenderer.prototype.getOrCreateBucket = function(style)
{
	// Find an existing bucket for the given style, except if label is set, always create a new one
	if ( !style.label )
	{
		for ( var i = 0; i < this.buckets.length; i++ )
		{
			var bucket = this.buckets[i];
			if ( bucket.style.isEqualForPoint(style) )
			{
				return bucket;
			}
		}
	}

	// Create a bucket
	var bucket = {
		texture: null,
		points: [],
		style: style
	};
		
	// Initialzie bucket : create the texture
	if ( style['iconUrl'] )
	{
		var image = new Image();
		var self = this;
		image.onload = function() {self._buildTextureFromImage(bucket,image); }
		image.src = style.iconUrl;
	}
	else if ( style['icon'] )
	{
		this._buildTextureFromImage(bucket,style.icon);
	}
	
	this.buckets.push( bucket );
	
	return bucket;
}

/**************************************************************************************************************/

/*
	Render all the POIs
 */
GlobWeb.PointRenderer.prototype.render = function()
{
	if (this.buckets.length == 0)
	{
		return;
	}
	
	this.numberOfRenderPoints = 0;
	
	var renderContext = this.renderContext;
	var gl = this.renderContext.gl;
	
    // Setup states
   // gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Setup program
    this.program.apply();
	
    // The shader only needs the viewProjection matrix, use GlobWeb.modelViewMatrix as a temporary storage
    mat4.multiply(renderContext.projectionMatrix, renderContext.viewMatrix, renderContext.modelViewMatrix)
    gl.uniformMatrix4fv(this.program.uniforms["viewProjectionMatrix"], false, renderContext.modelViewMatrix);
	gl.uniform1i(this.program.uniforms["texture"], 0);

    // Compute eye direction from inverse view matrix
    mat4.inverse(renderContext.viewMatrix, renderContext.modelViewMatrix);
    var camZ = [renderContext.modelViewMatrix[8], renderContext.modelViewMatrix[9], renderContext.modelViewMatrix[10]];
    vec3.normalize(camZ);
	vec3.scale(camZ, this.tileConfig.cullSign, camZ);
	
	// Compute pixel size vector to offset the points from the earth
	var pixelSizeVector = renderContext.computePixelSizeVector();

	for ( var n = 0; n < this.buckets.length; n++ )
	{
		var bucket = this.buckets[n];
		
		if ( bucket.texture == null || bucket.points.length == 0 )
			continue;
		
		// Bind point texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, bucket.texture);

		// 2.0 * because normalized device coordinates goes from -1 to 1
		var scale = [2.0 * bucket.textureWidth / renderContext.canvas.width,
					 2.0 * bucket.textureHeight / renderContext.canvas.height];
		gl.uniform2fv(this.program.uniforms["poiScale"], scale);
		gl.uniform2fv(this.program.uniforms["tst"], [ 0.5 / (bucket.textureWidth), 0.5 / (bucket.textureHeight)  ]);

		for (var i = 0; i < bucket.points.length; ++i)
		{
			// Poi culling
			var worldPoi = bucket.points[i].pos3d;
			var poiVec = bucket.points[i].vertical;
			var scale = bucket.textureHeight * ( pixelSizeVector[0] * worldPoi[0] + pixelSizeVector[1] * worldPoi[1] + pixelSizeVector[2] * worldPoi[2] + pixelSizeVector[3] );
			scale *= this.tileConfig.cullSign;
			var scaleInKm = (scale / GlobWeb.CoordinateSystem.heightScale) * 0.001;
			if ( scaleInKm > bucket.style.pointMaxSize )
				continue;
				
			if ( vec3.dot(poiVec, camZ) > 0 
				&& renderContext.worldFrustum.containsSphere(worldPoi,scale) >= 0 )
			{
				var x = poiVec[0] * scale + worldPoi[0];
				var y = poiVec[1] * scale + worldPoi[1];
				var z = poiVec[2] * scale + worldPoi[2];
				
				gl.uniform3f(this.program.uniforms["poiPosition"], x, y, z);
				
				this.mesh.render(this.program.attributes);
				
				this.numberOfRenderPoints++;
			}
		}
	}

//    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
}

/**************************************************************************************************************/

// Register the renderer
GlobWeb.VectorRendererManager.registerRenderer({
										creator: function(globe) { return new GlobWeb.PointRenderer(globe.tileManager); },
										canApply: function(type,style) {return type == "Point"; }
									});