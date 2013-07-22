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

 define(['./Tile'], function(Tile) {
 
/**************************************************************************************************************/

/** @constructor
	TileRequest constructor
 */
var TileRequest = function(tileManager)
{
	// Private variables
	var _imageLoaded = false;
	var _elevationLoaded = true;
	var _xhr = new XMLHttpRequest();

	// Public variables
	this.tile = null;
	this.image = null;
	this.elevations = null;

	var self = this;
	
	// Setup the XHR callback
	_xhr.onreadystatechange = function(e)
	{
		if ( _xhr.readyState == 4 )
		{
			if ( _xhr.status == 200 )
			{
				_handleLoadedElevation();
			}
			else
			{
				_handleErrorElevation();
			}
		}
	};
	

	/**************************************************************************************************************/

	/**
		Handle when image is loaded
	 */
	var _handleLoadedImage = function() 
	{
		// The method can be called twice when the image is in the cache (see launch())
		if (!_imageLoaded)
		{
			_imageLoaded = true;
			if ( _elevationLoaded )
			{
				tileManager.completedRequests.push(self);
				tileManager.renderContext.requestFrame();
			}
		}
	};

	/**************************************************************************************************************/

	/**
		Handle when loading image failed
	 */
	var _handleErrorImage = function() 
	{
		console.log( "Error while loading " + this.src );
		self.tile.state = Tile.State.ERROR;
		tileManager.availableRequests.push(self);
	}

	/**************************************************************************************************************/

	/**
		Abort request
	 */
	var _handleAbort = function() 
	{
		self.tile.state = Tile.State.NONE;
		tileManager.availableRequests.push(self);
	}

	/**************************************************************************************************************/

	/**
		Handle when elevation is loaded
	 */
	var _handleLoadedElevation = function() 
	{
		self.elevations = tileManager.elevationProvider.parseElevations(_xhr.responseText);	
		_elevationLoaded = true;
		
		if ( _imageLoaded )
		{
			tileManager.completedRequests.push(self);
			tileManager.renderContext.requestFrame();
		}
	}

	/**************************************************************************************************************/

	/**
		Handle when loading elevation failed
	 */
	var _handleErrorElevation = function() 
	{
		self.elevations = null;
		_elevationLoaded = true;
		
		if ( _imageLoaded )
		{
			tileManager.completedRequests.push(self);
			tileManager.renderContext.requestFrame();
		}
	}

	/**************************************************************************************************************/

	/**
		Launch the HTTP request for a tile
	 */
	this.launch = function(tile)
	{
		this.tile = tile;
		
		// Request the elevation if needed
		if ( tileManager.elevationProvider )
		{
			_elevationLoaded = false;
			_xhr.open("GET", tileManager.elevationProvider.getUrl(tile) );
			_xhr.send();
		}
		else
		{
			_elevationLoaded = true;
		}
		
		_imageLoaded = false;
		// Launch the request
		if (tileManager.imageryProvider.hasNoOverlay)
		{
			this.image = {};
			this.image.hasImage = false;
			_handleLoadedImage();
		}
		else if ( tileManager.imageryProvider.customLoad )
		{
			tileManager.imageryProvider.customLoad(this, tileManager.imageryProvider.getUrl(tile), _handleLoadedImage, _handleErrorImage);
		}
		else
		{
			// Image by default
			this.image = new Image();
			this.image.crossOrigin = '';
			this.image.onload = _handleLoadedImage;
			this.image.onerror = _handleErrorImage;
			this.image.onabort = _handleAbort;
			this.image.src = tileManager.imageryProvider.getUrl(tile);
			this.image.hasImage = true;
		}
	    
	};
	
};

/**************************************************************************************************************/

return TileRequest;

});
