define([], function(){
	
	var KMLRenderer = function()
	{
		this.kmlLayers = [];
	}

	//*************************************************************************

	KMLRenderer.prototype.preRender = function()
	{
		for (var i = 0; i < this.kmlLayers.length; i++)
		{
			var kmlLayer = this.kmlLayers[i];		
			kmlLayer.update();
		}
	}
	
	return KMLRenderer;

});
