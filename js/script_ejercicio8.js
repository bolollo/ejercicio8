//Definimos la variable map
var map;

function init() {
	//Asigamos la ruta para el archivo Proxy
	OpenLayers.ProxyHost = "../proxy/proxy2.jsp?url=";

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
	
	var format = new OpenLayers.Format.WMSCapabilities();
	
	OpenLayers.Request.GET({
        url: "http://shagrat.icc.es/lizardtech/iserv/ows?",
        params: {
            SERVICE: "WMS",
            VERSION: "1.1.1",
            REQUEST: "GetCapabilities"
        },
        success: function(request) {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            var capabilities = format.read(doc);
			console.debug(capabilities);
			
			var orto5 = new OpenLayers.Layer.WMS( "ICC ORTO5",
				"http://shagrat.icc.es/lizardtech/iserv/ows?", 
					{layers: capabilities.capability.layers[0].name, srs: 'EPSG:4326', format:'image/png', 
				transparent:'true', exceptions:"application/vnd.ogc.se_xml"},
					{'isBaseLayer':false, 'displayInLayerSwitcher':true}
			);
			map.addLayer(orto5);
			
			
			/*
            var layer = format.createLayer(capabilities, {
                layer: "medford:buildings",
                matrixSet: "EPSG:900913",
                format: "image/png",
                opacity: 0.7,
                isBaseLayer: false
            });
            map.addLayer(layer);
			*/
        },
        failure: function() {
            alert("Trouble getting capabilities doc");
            OpenLayers.Console.error.apply(OpenLayers.Console, arguments);
        }
    });
	
	
	
	map.setCenter(
		new OpenLayers.LonLat(1.1406, 41.6485).transform(
			new OpenLayers.Projection("EPSG:4326"),
			map.getProjectionObject()
		), 14
	);
}