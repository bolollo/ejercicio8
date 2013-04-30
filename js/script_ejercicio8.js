//Definimos la variable map
var map;

function init() {
	//Creamos un nuevo objeto map en el div con el id = map
	map = new OpenLayers.Map('map');
	
	var osm_layer = new OpenLayers.Layer.OSM( "Simple OSM Map");;
	//Agregamos la capa creada al mapa
	map.addLayer(osm_layer);
	
	map.setCenter(
		new OpenLayers.LonLat(1.1406, 41.6485).transform(
			new OpenLayers.Projection("EPSG:4326"),
			map.getProjectionObject()
		), 14
	);
}