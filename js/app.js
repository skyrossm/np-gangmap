$(function() {
	var showCoordinations = true;


	var $types = $('.types');

	var onResize = function() {
		$types.css({
			maxHeight: $(window).height() - parseInt($types.css('marginTop'), 10) - parseInt($types.css('marginBottom'), 10) - parseInt($('header').height()) + 6
		});
	};

	onResize();

	$(window).resize(onResize);


	// window.isTourMode = false;

	// if (window.location.hash == '#tour') {
	// 	$('body').addClass('tour');
	// 	window.isTourMode = true;
	// }
	// else {
	// 	$('body').removeClass('tour');
	// 	window.isTourMode = false;
	// 	// $('#map').css({position:'absolute'});
	// }

	// $(window).on('hashchange', function() {
	// 	if (window.location.hash == '#tour') {
	// 		$('body').addClass('tour');
	// 		$('#map').css({position:'relative'});
	// 		window.isTourMode = true;
	// 		var x = locations.findWhere({ type: 'Nuclear Waste' }); 
	// 		Vent.trigger('location:clicked', x, true);
	// 	}
	// 	else {
	// 		$('body').removeClass('tour');	
	// 		$('#map').css({position:'absolute'});
	// 		window.isTourMode = false;
	// 	}
	// });
	
	var currentMarker;
	
	var assetsUrl = function() {
		return 'https://skyrossm.github.io/np-gangmap/';
	};

	Handlebars.registerHelper('assetsUrl', assetsUrl);

	var timestampToSeconds = function(stamp) {
		stamp = stamp.split(':');
		return (parseInt(stamp[0], 10) * 60) + parseInt(stamp[1], 10);
	};

	Handlebars.registerHelper('timestampToSeconds', timestampToSeconds);

	var Vent = _.extend({}, Backbone.Events);

	var LocationModel = Backbone.Model.extend({
		initialize: function() {
			var polyCoords = this.get('latlngarray');
			
			var marker = new google.maps.Polygon({
				paths: polyCoords,
				strokeColor: this.get('strokecolor'),
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: this.get('fillcolor'),
				fillOpacity: 0.35
			});
			
			var bounds = new google.maps.LatLngBounds()
			polyCoords.forEach(function(element,index){bounds.extend(element)})
			
			var mapLabel = new MapLabel({
				position: bounds.getCenter(),
				text: this.get('title'),
				strokeWeight: 1,
				strokeColor: "#000",
				fontColor: this.get('fillcolor'),
				zIndex: 10000
			});
		
			_.bindAll(this, 'markerClicked');
			google.maps.event.addListener(marker, 'click', this.markerClicked);
			this.set({ marker: marker, label: mapLabel });
			
		},

		markerClicked: function() {
			Vent.trigger('location:clicked', this);
		},

		removeHighlight: function() {
			
		},

		highlightMarker: function() {
			if (currentMarker == this) {
				Vent.trigger('location:clicked', this);
			}
			else {
				if (currentMarker) currentMarker.removeHighlight();
				mapView.closePopupLocation();
				currentMarker = this;
			}
		}
	});
	var LocationsCollection = Backbone.Collection.extend({
		model: LocationModel,
		url: 'locations.json'
	});

	var locations = window.locations = new LocationsCollection();

	var CategoryModel = Backbone.Model.extend({ });
	var CategoriesCollection = Backbone.Collection.extend({

		model: CategoryModel,

		getIcon: function(type) {
			var o = this.findWhere({ name: type });
			if (o) {
				return o.get('icon');
			}

			return assetsUrl() + (o ? o.get('icon') : 'blank.png');
		},

		forView: function(type) {
			var g = this.groupBy('type');
			return _(g).map(function(categories, type) {
				return {
					name: type,
					types: _.map(categories, function(category) { return category.toJSON(); })
				}
			});
		}

	});

	var categories = window.cats = new CategoriesCollection([
		{
			name: 'Territory Areas',
			icon: 'General/wall-breach.png',
			type: 'General',
			enabled: true
		},
		{
			name: 'Neutral Zones',
			icon: 'General/wall-breach.png',
			type: 'General',
			enabled: true
		}
	]);
	var showingLabels;
	var CategoriesView = Backbone.View.extend({

		initialize: function() {
			this.template = Handlebars.compile($('#categoriesTemplate').html());
		},

		render: function() {
			this.$el.html(this.template({
				categories: categories.forView()
			}));
			$('#typeDetails').hide();
			return this;
		},

		events: {
			'change input': 'toggleLocations',
			'click .details': 'showDetails'
		},

		toggleLocations: function(e) {
			var $e = $(e.currentTarget),
				type = $e.val(),
				showLocations = $e.is(':checked'),
				models = locations.where({ type: type });
				allLocations = locations.filter(function(loc) { return loc.get('marker').visible !== false });
				
			if(type == "labels" && showLocations){
				Vent.trigger('labels:visible', allLocations);
				showingLabels = true;
			}else if(type == "labels"){
				Vent.trigger('labels:invisible', allLocations);
				showingLabels = false;
			}
			
			if (showLocations) {
				Vent.trigger('locations:visible', models);
				if(showingLabels) Vent.trigger('labels:visible', models);
			}
			else {
				Vent.trigger('locations:invisible', models);
				if(showingLabels) Vent.trigger('labels:invisible', models);
			}
		},

		showDetails: function(e) {
			e.preventDefault();
			var typeName = $(e.currentTarget).data('name');
			this.$el.find('input[value="'+typeName+'"]').prop('checked', true).trigger('change');

			var type = categories.findWhere({ name: typeName });

			var details = new CategoryDetailsView({
				el: '#typeDetails',
				type: type
			});
			details.render();

		}

	});

	var CategoryDetailsView = Backbone.View.extend({

		initialize: function() {
			this.template = Handlebars.compile($('#categoryDetailsTemplate').html());
		},

		events: {
			'click a.back': 'goBack',
			'click li': 'showMarker'
		},

		goBack: function(e) {
			e.preventDefault();
			this.$el.empty();
			this.off();
			$('#types').show();
		},

		showMarker: function(e) {
			var location = locations.get($(e.currentTarget).data('id'));
			location.highlightMarker();
			var bounds = new google.maps.LatLngBounds()
			location.get('marker').getPath().forEach(function(element,index){bounds.extend(element)})
			map.panTo(bounds.getCenter());
			map.setZoom(7);
		},

		render: function() {
			var name = this.options.type.get('name');
			var locs = locations.where({ type: name });
			this.$el.html(this.template({
				type: this.options.type.toJSON(),
				locations: _(locs).map(function(x) {
					var d = x.toJSON();
					return d;
				})
			}));
			$('#types').hide();
			this.$el.show();
			return this;
		}

	});

	var MapView = Backbone.View.extend({

		initialize: function() {
			this.mapType = 'Atlas';
			this.mapDetails = { 'Atlas': '#0fa8d2', 'Satellite': '#143d6b', 'Road': '#1862ad' };
			this.mapOptions = {
				center: new google.maps.LatLng(66, -125),
				zoom: 5,
				disableDefaultUI: true,
				mapTypeId: this.mapType,
				backgroundColor:  'hsla(0, 0%, 0%, 0)'
			};

			_.bindAll(this, 'getTileImage', 'updateMapBackground');

			this.popupTemplate = Handlebars.compile($('#markerPopupTemplate2').html());

			this.listenTo(Vent, 'locations:visible', this.showLocations);
			this.listenTo(Vent, 'locations:invisible', this.hideLocations);
			this.listenTo(Vent, 'labels:visible', this.showLabels);
			this.listenTo(Vent, 'labels:invisible', this.hideLabels);
			this.listenTo(Vent, 'location:clicked', this.popupLocation);
		},

		render: function() {

			// Function to update coordination info windows
		    function updateCoordinationWindow(markerobject){
		        // Create new info window
				var infoWindow = new google.maps.InfoWindow;

				// onClick listener
				google.maps.event.addListener(markerobject, 'click', function(evt){
					// Set content
				    infoWindow.setOptions({
				        content: '<p>' + 'Current Lat: ' + evt.latLng.lat().toFixed(3) + '<br>' + 'Current Lng: ' + evt.latLng.lng().toFixed(3) + '<br>' + 'Zoom Level: ' + map.getZoom() + '</p>'
				    });

				    // Open the info window
				    infoWindow.open(map, markerobject);
				});

				// onDrag listener
				google.maps.event.addListener(markerobject, 'drag', function(evt){
					// Set content
				    infoWindow.setOptions({
				        content: '<p>' + 'Current Lat: ' + evt.latLng.lat().toFixed(3) + '<br>' + 'Current Lng: ' + evt.latLng.lng().toFixed(3) + '<br>' + 'Zoom Level: ' + map.getZoom() + '</p>'
				    });
				});
			}

			var map = this.map = window.map = new google.maps.Map(this.el, this.mapOptions);

			this.initMapTypes(map, _.keys(this.mapDetails));

			google.maps.event.addListener(map, 'maptypeid_changed', this.updateMapBackground);

			google.maps.event.addDomListener(map, 'tilesloaded', function() {
				if ($('#mapControlWrap').length == 0) {
					$('div.gmnoprint').last().wrap('<div id="mapControlWrap" />');
				}
			});

			window.locs = [];
			google.maps.event.addListener(map, 'rightclick', function(e) {
				var marker = new google.maps.Marker({
					map: map,
					moveable: true,
					draggable: true,
					position: e.latLng
				});
				window.locs.push(marker);
				// Check if coords mode is enabled
				if (showCoordinations) {
					// Update/create info window
					updateCoordinationWindow(marker);
				};
			});

			return this;
		},

		getMap: function() {
			return this.map;
		},

		initMapTypes: function(map, types) {
			_.each(types, function(type) {
				var mapTypeOptions = {
					maxZoom: 7,
					minZoom: 3,
					name: type,
					tileSize: new google.maps.Size(256, 256),
					getTileUrl: this.getTileImage
				};
				map.mapTypes.set(type, new google.maps.ImageMapType(mapTypeOptions));
			}, this);
		},

		updateMapBackground: function() {
			this.mapType = this.map.getMapTypeId();
			this.$el.css({
				backgroundColor: this.mapDetails[this.mapType]
			});
		},

		getTileImage: function(rawCoordinates, zoomLevel) {
			var coord = this.normalizeCoordinates(rawCoordinates, zoomLevel);
			if ( ! coord) {
				return null;
			}
			return assetsUrl() + 'tiles/' + this.mapType.toLowerCase() + '/' + zoomLevel + '-' + coord.x + '_' + coord.y + '.png';
		},

		normalizeCoordinates: function(coord, zoom) {
			var y = coord.y;
			var x = coord.x;

			// tile range in one direction range is dependent on zoom level
			// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
			var tileRange = 1 << zoom;

			// don't repeat across y-axis (vertically)
			if (y < 0 || y >= tileRange) {
				return null;
			}

			// repeat across x-axis
			if (x < 0 || x >= tileRange) {
				x = (x % tileRange + tileRange) % tileRange;
			}

			return {
				x: x,
				y: y
			};
		},

		showLocations: function(locations) {
			_.each(locations, function(location) {
				var marker = location.get('marker');
				if ( ! marker.getMap()) {
					marker.setMap(this.map);
				}
				marker.setVisible(true);
			}, this);
		},
		
		showLabels: function(locations) {
			_.each(locations, function(location) {
				var label = location.get('label');
				if(!label.getMap()){
					label.setMap(this.map);
				}
				label.set('fontSize', 16);
			}, this);
		},

		hideLocations: function(locations) {
			_.each(locations, function(location) {
				location.get('marker').setVisible(false);
			});
		},
		
		hideLabels: function(locations) {
			_.each(locations, function(location) {
				location.get('label').set('fontSize', 0);
			});
		},

		popupLocation: function(location, panTo) {
			// if (window.isTourMode) {
			// 	$('#tour-info').html(this.popupTemplate(location.toJSON()));
			// 	var n = locations.at(locations.indexOf(location) + 1);
			// 	if (n) {
			// 		$('#tour-next').text(n.get('title'));
			// 	}
			// 	var p = locations.at(locations.indexOf(location) - 1);
			// 	if (p) {
			// 		$('#tour-prev').text(p.get('title'));
			// 	}

			// 	if (panTo) {
			// 		this.map.panTo(location.get('marker').getPosition());
			// 		this.map.setZoom(5);
			// 	}
			// }
			// else {

				var infoWindow = new google.maps.InfoWindow({
					content: this.popupTemplate(location.toJSON()),
				});

			    infoWindow.setOptions({
			        maxHeight: 400
			    });

				if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				    infoWindow.setOptions({
				        maxWidth: 180,
			        	maxHeight: 300
				    });
				}
				var bounds = new google.maps.LatLngBounds()
				location.get('marker').getPath().forEach(function(element,index){bounds.extend(element)})
				infoWindow.setPosition(bounds.getCenter());
				infoWindow.open(this.map);

				this.closePopupLocation();
				this.currentInfoWindow = infoWindow;
			// }
		},

		closePopupLocation: function() {
			if (this.currentInfoWindow) {
				this.currentInfoWindow.close();
			}
		}

	});

	var mapView = new MapView({
		el: '#map'
	});


	var categoriesView = new CategoriesView({
		el: '#types',
		map: mapView.getMap()
	});

	locations.fetch().done(function() {
		mapView.render();
		categoriesView.render();

		categories.chain()
				  .filter(function(c) { return c.get('enabled'); })
				  .map(function(c) { return c.get('name'); })
				  .map(function(name) {
				  	return locations.where({ type: name })
				  })
				  .each(function(locs) {
				  	Vent.trigger('locations:visible', locs);
				  })
				  .value();
	});

	$('#tour-prev, #tour-next').click(function(e) {
		e.preventDefault();
		var navTo = $(this).text();
		var x = locations.findWhere({ title: navTo });
		if (x) Vent.trigger('location:clicked', x, true);
	});
	
});
	function printArray() {
		var msg = "[\n";
		var i;
		for(i = 0;i < window.locs.length; i++){
			msg += '{"lat": ' + window.locs[i].position.lat().toFixed(3) + ', "lng": ' + window.locs[i].position.lng().toFixed(3) + '}' + (window.locs.length-1 == i ? '' : ',') + '\n';
		}
		msg += "]";
		console.log(msg);
	}
	
	function toggleRuler() {
		addruler(window.map)
	}

function addruler(map) {
 
    ruler1 = new google.maps.Marker({
        position: map.getCenter() ,
        map: map,
        draggable: true
    });
 
    ruler2 = new google.maps.Marker({
        position: map.getCenter() ,
        map: map,
        draggable: true
    });
 
    var ruler1label = new Label({ map: map });
    var ruler2label = new Label({ map: map });
    ruler1label.bindTo('position', ruler1, 'position');
    ruler2label.bindTo('position', ruler2, 'position');
 
    rulerpoly = new google.maps.Polyline({
        path: [ruler1.position, ruler2.position] ,
        strokeColor: "#FFFF00",
        strokeOpacity: .7,
        strokeWeight: 8
    });
    rulerpoly.setMap(map);
 
    ruler1label.set('text',"0m");
    ruler2label.set('text',"0m");
 
    google.maps.event.addListener(ruler1, 'drag', function() {
        rulerpoly.setPath([ruler1.getPosition(), ruler2.getPosition()]);
        ruler1label.set('text',distance( ruler1.getPosition().lat(), ruler1.getPosition().lng(), ruler2.getPosition().lat(), ruler2.getPosition().lng()));
        ruler2label.set('text',distance( ruler1.getPosition().lat(), ruler1.getPosition().lng(), ruler2.getPosition().lat(), ruler2.getPosition().lng()));
    });
 
    google.maps.event.addListener(ruler2, 'drag', function() {
        rulerpoly.setPath([ruler1.getPosition(), ruler2.getPosition()]);
        ruler1label.set('text',distance( ruler1.getPosition().lat(), ruler1.getPosition().lng(), ruler2.getPosition().lat(), ruler2.getPosition().lng()));
        ruler2label.set('text',distance( ruler1.getPosition().lat(), ruler1.getPosition().lng(), ruler2.getPosition().lat(), ruler2.getPosition().lng()));
    });
	
	ruler1.setVisible(true);
	ruler2.setVisible(true);
	rulerpoly.setVisible(true);
}

function distance(lat1,lon1,lat2,lon2) {
    var um = "km"; // km | ft (choose the constant)
    var R = 6371;
    if (um=="ft") {
        R = 20924640; // ft
    }
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180; 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = (R * c) * 4;
    if(um=="km") {
        if (d > 1000) return Math.round(d/1000)+"km";
        else if (d > 1) return Math.round(d)+"m";
    }
    return d;
}




// Define the overlay, derived from google.maps.OverlayView
function Label(opt_options) {
	// Initialization
	this.setValues(opt_options);

	// Label specific
	var span = this.span_ = document.createElement('span');
	span.style.cssText = 'position: relative; left: 0%; top: -8px; ' +
			  'white-space: nowrap; border: 0px; font-family:arial; font-weight:bold;' +
			  'padding: 2px; background-color: #ddd; '+
				'opacity: 1; '+
				'filter: alpha(opacity=75); '+
				'-ms-filter: "alpha(opacity=75)"; '+
				'-khtml-opacity: 1; '+
				'z-index:1000';

	var div = this.div_ = document.createElement('div');
	div.appendChild(span);
	div.style.cssText = 'position: absolute; display: none';
};
Label.prototype = new google.maps.OverlayView;

// Implement onAdd
Label.prototype.onAdd = function() {
	var pane = this.getPanes().overlayLayer;
	pane.appendChild(this.div_);

	
	// Ensures the label is redrawn if the text or position is changed.
	var me = this;
	this.listeners_ = [
		google.maps.event.addListener(this, 'position_changed',
		function() { me.draw(); }),
		google.maps.event.addListener(this, 'text_changed',
		function() { me.draw(); })
	];
	
};

// Implement onRemove
Label.prototype.onRemove = function() { this.div_.parentNode.removeChild(this.div_ );
	// Label is removed from the map, stop updating its position/text.
	for (var i = 0, I = this.listeners_.length; i < I; ++i) {
		google.maps.event.removeListener(this.listeners_[i]);
	}
};

// Implement draw
Label.prototype.draw = function() {
	var projection = this.getProjection();
	var position = projection.fromLatLngToDivPixel(this.get('position'));

	var div = this.div_;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	div.style.display = 'block';

	this.span_.innerHTML = this.get('text').toString();
};