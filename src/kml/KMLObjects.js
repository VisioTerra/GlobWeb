define(['../Utils'], function(Utils){
	/*************************        KMLAbstractObject        ********************************************/
	var KMLAbstractObject = function()
	{
	}

	KMLAbstractObject.prototype.setID = function(id)
	{
		this.id = id;
	}

	KMLAbstractObject.prototype.getID = function()
	{
		return this.id;
	}

	/*************************        KMLAbstractFeature        ********************************************/
	var KMLAbstractFeature = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractObject, KMLAbstractFeature);

	KMLAbstractFeature.prototype.setName = function(name)
	{
		this.name = name;
	}

	KMLAbstractFeature.prototype.setDescription = function(description)
	{
		this.description = description;
	}

	KMLAbstractFeature.prototype.setRegion = function(region)
	{
		this.region = region;
	}

	KMLAbstractFeature.prototype.setStyle = function(style)
	{
		this.style = style;
	}

	KMLAbstractFeature.prototype.setVisibility = function(visibility)
	{
		this.visibility = visibility;
	}
	
	KMLAbstractFeature.prototype.isKMLFeature = true;

	/*************************        KMLAbstractContainer        ********************************************/

	var KMLAbstractContainer = function()
	{
		KMLAbstractFeature.prototype.constructor.call(this);
		this.features = [];
	}

	Utils.inherits(KMLAbstractFeature, KMLAbstractContainer);

	KMLAbstractContainer.prototype.addFeature = function(feature)
	{
		this.features.push(feature);
	}

	KMLAbstractContainer.prototype.isKMLContainer = true;

	/*************************        KMLDocument        ********************************************/

	var KMLDocument = function()
	{
		KMLAbstractContainer.prototype.constructor.call(this);
		this.styles = [];
	}

	Utils.inherits(KMLAbstractContainer, KMLDocument);

	KMLDocument.prototype.addStyle = function(style)
	{
		this.styles.push(style);
	}

	/*************************        KMLNetworkLink        ********************************************/

	var KMLNetworkLink = function()
	{
		KMLAbstractFeature.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractFeature, KMLNetworkLink);

	KMLNetworkLink.prototype.setLink = function(link)
	{
		this.link = link;
	}

	/*************************        KMLLink        ********************************************/

	var KMLLink = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
		// this.href = null;
		// this.refreshMode = null;
		// this.refreshInterval = null;
		// this.viewRefreshMode = null;
		// this.viewRefreshTime = null;
		// this.viewBoundScale = null;
		// this.viewFormat = null;
	}

	Utils.inherits(KMLAbstractObject, KMLLink);

	KMLLink.prototype.setHref = function(href)
	{
		this.href = href;
	}

	KMLLink.prototype.setRefreshMode = function(refreshMode)
	{
		this.refreshMode = refreshMode
	}

	KMLLink.prototype.setRefreshInterval = function(refreshInterval)
	{
		this.refreshInterval = refreshInterval
	}

	KMLLink.prototype.setViewRefreshMode = function(viewRefreshMode)
	{
		this.viewRefreshMode = viewRefreshMode
	}

	KMLLink.prototype.setViewRefreshTime = function(viewRefreshTime)
	{
		this.viewRefreshTime = viewRefreshTime
	}

	KMLLink.prototype.setViewBoundScale = function(viewBoundScale)
	{
		this.viewBoundScale = viewBoundScale
	}

	KMLLink.prototype.setViewFormat = function(viewFormat)
	{
		this.viewFormat = viewFormat
	}

	KMLLink.prototype.setHttpQuery = function(httpQuery)
	{
		this.httpQuery = httpQuery
	}

	/*************************        KMLRegion        ********************************************/
	var KMLRegion = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractObject, KMLRegion);

	KMLRegion.prototype.setLatLonAltBox = function(latLonAltBox)
	{
		this.latLonAltBox = latLonAltBox;
	}

	KMLRegion.prototype.setLod = function(lod)
	{
		this.lod = lod;
	}

	/*************************        KMLLatLonAltBox        ********************************************/

	var KMLLatLonAltBox = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractObject, KMLLatLonAltBox);

	KMLLatLonAltBox.prototype.setNorth = function(north)
	{
		this.north = north;
	}

	KMLLatLonAltBox.prototype.setSouth = function(south)
	{
		this.south = south;
	}

	KMLLatLonAltBox.prototype.setEast = function(east)
	{
		this.east = east;
	}

	KMLLatLonAltBox.prototype.setWest = function(west)
	{
		this.west = west;
	}

	KMLLatLonAltBox.prototype.setMinAltitude = function(minAltitude)
	{
		this.minAltitude = minAltitude;
	}

	KMLLatLonAltBox.prototype.setMaxAltitude = function(maxAltitude)
	{
		this.maxAltitude = maxAltitude;
	}

	KMLLatLonAltBox.prototype.setAltitudeMode = function(altitudeMode)
	{
		this.altitudeMode = altitudeMode;
	}

	/*************************        KMLLod        ********************************************/

	var KMLLod = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractObject, KMLLod);

	KMLLod.prototype.setMinLodPixels = function(minLodPixels)
	{
		this.minLodPixels = minLodPixels;
	}

	KMLLod.prototype.setMaxLodPixels = function(maxLodPixels)
	{
		this.maxLodPixels = maxLodPixels;
	}

	KMLLod.prototype.setMinFadeExtent = function(minFadeExtent)
	{
		this.minFadeExtent = minFadeExtent;
	}

	KMLLod.prototype.setMaxFadeExtent = function(maxFadeExtent)
	{
		this.maxFadeExtent = maxFadeExtent;
	}

	/*************************        KMLAbstractOverlay        ********************************************/

	var KMLAbstractOverlay = function()
	{
		KMLAbstractFeature.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractFeature, KMLAbstractOverlay);

	KMLAbstractOverlay.prototype.setColor = function(color)
	{
		this.color = color;
	}

	KMLAbstractOverlay.prototype.setDrawOrder = function(drawOrder)
	{
		this.drawOrder = drawOrder;
	}

	KMLAbstractOverlay.prototype.setIcon = function(icon)
	{
		this.icon = icon;
	}

	/*************************        KMLGroundOverlay        ********************************************/

	var KMLGroundOverlay = function()
	{
		KMLAbstractOverlay.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractOverlay, KMLGroundOverlay);

	KMLGroundOverlay.prototype.setAltitude = function(altitude)
	{
		this.altitude = altitude;
	}

	KMLGroundOverlay.prototype.setAltitudeMode = function(altitudeMode)
	{
		this.altitudeMode = altitudeMode;
	}

	KMLGroundOverlay.prototype.setLatLonBox = function(latLonBox)
	{
		this.latLonBox = latLonBox;
	}

	/*************************        KMLIcon       ********************************************/

	var KMLIcon = function()
	{
		KMLLink.prototype.constructor.call(this);
	}

	Utils.inherits(KMLLink, KMLIcon);

	/*************************        KMLLatLonBox        ********************************************/

	var KMLLatLonBox = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractObject, KMLLatLonBox);

	KMLLatLonBox.prototype.setNorth = function(north)
	{
		this.north = north;
	}

	KMLLatLonBox.prototype.setSouth = function(south)
	{
		this.south = south;
	}

	KMLLatLonBox.prototype.setEast = function(east)
	{
		this.east = east;
	}

	KMLLatLonBox.prototype.setWest = function(west)
	{
		this.west = west;
	}

	KMLLatLonBox.prototype.setRotation = function(rotation)
	{
		this.rotation = rotation;
	}

	/*************************        KMLPlacemark        ********************************************/

	var KMLPlacemark = function()
	{
		KMLAbstractFeature.prototype.constructor.call(this);
		this.geometryFeatures = [];
	}

	Utils.inherits(KMLAbstractFeature, KMLPlacemark);

	KMLPlacemark.prototype.addGeometry = function(geometry)
	{
		this.geometryFeatures.push(geometry);
	}

	/*************************        KMLAbstractGeometry        ********************************************/

	var KMLAbstractGeometry = function()
	{
		KMLAbstractObject.prototype.constructor.call(this);
		
	}

	Utils.inherits(KMLAbstractObject, KMLAbstractGeometry);

	KMLAbstractGeometry.prototype.isKMLGeometry = true;

	/*************************        KMLPoint        ********************************************/

	var KMLPoint = function()
	{
		KMLAbstractGeometry.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractGeometry, KMLPoint);

	KMLPoint.prototype.setExtrude = function(extrude)
	{
		this.extrude = extrude;
	}

	KMLPoint.prototype.setAltitudeMode = function(altitudeMode)
	{
		this.altitudeMode = altitudeMode;
	}

	KMLPoint.prototype.setCoordinates = function(coordinates)
	{
		this.coordinates = coordinates;
	}

	/*************************        KMLLinearRing        ********************************************/

	var KMLLinearRing = function()
	{
		KMLAbstractGeometry.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractGeometry, KMLLinearRing);

	KMLLinearRing.prototype.setExtrude = function(extrude)
	{
		this.extrude = extrude;
	}

	KMLLinearRing.prototype.setTessellate= function(tessellate)
	{
		this.tessellate = tessellate;
	}

	KMLLinearRing.prototype.setAltitudeMode = function(altitudeMode)
	{
		this.altitudeMode = altitudeMode;
	}

	KMLLinearRing.prototype.setCoordinates = function(coordinates)
	{
		this.coordinates = coordinates;
	}


	/*************************        KMLPolygon        ********************************************/

	var KMLPolygon = function()
	{
		KMLAbstractGeometry.prototype.constructor.call(this);
	}

	Utils.inherits(KMLAbstractGeometry, KMLPolygon);

	KMLPolygon.prototype.setExtrude = function(extrude)
	{
		this.extrude = extrude;
	}

	KMLPolygon.prototype.setTessellate= function(tessellate)
	{
		this.tessellate = tessellate;
	}

	KMLPolygon.prototype.setAltitudeMode = function(altitudeMode)
	{
		this.altitudeMode = altitudeMode;
	}

	KMLPolygon.prototype.setOuterBoundaryIs= function(outerBoundaryIs)
	{
		this.outerBoundaryIs = outerBoundaryIs;
	}

	KMLPolygon.prototype.setInnerBoundaryIs = function(innerBoundaryIs)
	{
		this.innerBoundaryIs = innerBoundaryIs;
	}


	/*************************        KMLObjects        ********************************************/

	var KMLObjects = {}

	KMLObjects.KMLDocument = KMLDocument;
	KMLObjects.KMLNetworkLink = KMLNetworkLink;
	KMLObjects.KMLLink = KMLLink;
	KMLObjects.KMLRegion = KMLRegion;
	KMLObjects.KMLLatLonAltBox = KMLLatLonAltBox;
	KMLObjects.KMLLod = KMLLod;
	KMLObjects.KMLGroundOverlay = KMLGroundOverlay;
	KMLObjects.KMLIcon = KMLIcon;
	KMLObjects.KMLLatLonBox = KMLLatLonBox;
	KMLObjects.KMLPlacemark = KMLPlacemark;
	KMLObjects.KMLPoint = KMLPoint;
	KMLObjects.KMLLinearRing = KMLLinearRing;
	KMLObjects.KMLPolygon = KMLPolygon;


	return KMLObjects;

});