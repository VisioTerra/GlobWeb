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
 
/**
 Declare GlobWeb namespace
 */
var GlobWeb = GlobWeb || {};

// Declare function to load all javascript files for GlobWeb
(function()
{
	// Get script location
	var r = new RegExp("(^|(.*?\\/))GlobWeb\.js$"),
		s = document.getElementsByTagName('script');
	var host = "";
	for(var i=0; i<s.length; i++) {
		var src = s[i].getAttribute('src');
		if (src) {
			var m = src.match(r);
			if(m) {
				host = m[1];
				break;
			}
		}
	}
	
	var jsFiles = [
		"glMatrix.js",
		"Utils.js",
		"Stats.js",
		"GeoBound.js",
		"BaseNavigation.js",
		"AttributionHandler.js",
		"MouseNavigationHandler.js",
		"KeyboardNavigationHandler.js",
		"BoundingBox.js",
		"Numeric.js",
		"Animation.js",
		"InterpolatedAnimation.js",
		"SegmentedAnimation.js",
		"CoordinateSystem.js",
		"PathAnimation.js",
		"Frustum.js",
		"Navigation.js",
		"TrackballNavigation.js",
		"RenderContext.js",
		"Mesh.js",
		"Program.js",
		"FeatureStyle.js",
		"RendererTileData.js",
		"VectorRendererManager.js",
		"PointRenderer.js",
		"PointSpriteRenderer.js",
		"ConvexPolygonRenderer.js",
		"TiledVectorRenderable.js",
		"TiledVectorRenderer.js",
		"PolygonRenderable.js",
		"LineStringRenderable.js",
		"BaseLayer.js",
		"AtmosphereLayer.js",
		"VectorLayer.js",
		"EquatorialCoordinateSystem.js",
		"EquatorialGridLayer.js",
		"Triangulator.js",
		"GroundOverlayLayer.js",
		"GroundOverlayRenderer.js",
		"RasterOverlayRenderer.js",
		"TileIndexBuffer.js",
		"Tile.js",
		"TilePool.js",
		"GeoTiling.js",
		"HEALPixTiling.js",
		"MercatorTiling.js",
		"TileManager.js",
		"RasterLayer.js",
		"WMSLayer.js",
		"WMTSLayer.js",
		"WCSElevationLayer.js",
		"OSMLayer.js",
		//"BasicElevationLayer.js",
		"BingLayer.js",
		"HEALPixLayer.js",
		"TileWireframeLayer.js",
		"TileRequest.js",
		"Globe.js",
		"AstroNavigation.js",
		"HEALPixTables.js",
		"HEALPixBase.js",
		"Long.js",
		"InertiaAnimation.js",
		"KMLParser.js",
		"AnotherKMLParser.js"
		];

	// use "parser-inserted scripts" for guaranteed execution order
	// http://hsivonen.iki.fi/script-execution/
	var scriptTags = new Array(jsFiles.length);
	for (var i=0; i<jsFiles.length; i++) {
		scriptTags[i] = "<script src='" + host + jsFiles[i] + "' type='text/javascript'></script>"; 
	}
	if (scriptTags.length > 0) {
		document.write(scriptTags.join(""));
	}
	

})();  
