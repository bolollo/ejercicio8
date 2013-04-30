//Definimos la variable map
var map;

function init() {
	//Creamos un nuevo objeto map en el div con el id = map
	map = new OpenLayers.Map('map');
	
	var osm_layer = new OpenLayers.Layer.OSM( "Simple OSM Map");;
	//Agregamos la capa creada al mapa
	map.addLayer(osm_layer);
	
	//Creamos la capa de tipo Vector donde editaremos
	var capaEdicion =  new OpenLayers.Layer.Vector("Editable");
	
	//Agregamos la capa creada al mapa
	map.addLayer(capaEdicion);
	
	//agregar el control de leyenda al mapa
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	
	map.setCenter(
		new OpenLayers.LonLat(1.1406, 41.6485).transform(
			new OpenLayers.Projection("EPSG:4326"),
			map.getProjectionObject()
		), 14
	);
}