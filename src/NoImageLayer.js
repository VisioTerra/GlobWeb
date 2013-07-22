define(['./GeoTiling'], function(GeoTiling){

	var NoImageLayer = function(options){
		this.tiling = new GeoTiling( 4, 2 );
		this.tilePixelSize = 256;
		this.numberOfLevels = 21;
		this._ready = true;
		this.hasNoOverlay = true;
	};

	NoImageLayer.prototype._attach = function( globe )
	{
		this.globe = globe;
	}
	
	NoImageLayer.prototype._detach = function()
	{
	
	}

	return NoImageLayer;
});