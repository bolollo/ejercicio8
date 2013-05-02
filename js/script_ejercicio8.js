//Definimos la variable map
var map;

function init() {
	//Asigamos la ruta para el archivo Proxy
	OpenLayers.ProxyHost = "../proxy/proxy2.jsp?url=";

	//Sobrescribir el método para manejar multiples SRS.
	OpenLayers.Layer.WMS.prototype.getFullRequestString = function(newParams, altUrl) {
		var projectionCode = this.map.getProjection();
		if (this.params.SRS){
			if (this.params.SRS != projectionCode){
				var point1 = new OpenLayers.LonLat(newParams.BBOX[0], newParams.BBOX[1]);
				point1 = point1.transform(new OpenLayers.Projection(projectionCode), new OpenLayers.Projection(this.params.SRS));
				var point2 = new OpenLayers.LonLat(newParams.BBOX[2], newParams.BBOX[3]);
				point2 = point2.transform(new OpenLayers.Projection(projectionCode), new OpenLayers.Projection(this.params.SRS));
				newParams.BBOX[0] = point1.lon;
				newParams.BBOX[1] = point1.lat;
				newParams.BBOX[2] = point2.lon;
				newParams.BBOX[3] = point2.lat;
			}else{
				this.params.SRS = (projectionCode == "none") ? null : projectionCode;
			}
		}else{
			this.params.SRS = (projectionCode == "none") ? null : projectionCode;
	       }
		return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(this, arguments);
	};
		
	var options = {
        div: "map",
        projection: "EPSG:900913",
        displayProjection: "EPSG:4326",
        numZoomLevels: 18
    }
	
	//Creamos un nuevo objeto map en el div con el id = map
	map = new OpenLayers.Map(options);
	
	var osm_layer = new OpenLayers.Layer.OSM( "Simple OSM Map");;
	//Agregamos la capa creada al mapa
	map.addLayer(osm_layer);
	
	//Creamos la capa de tipo Vector donde editaremos
	var capaEdicion =  new OpenLayers.Layer.Vector("Editable");
	
	//Agregamos la capa creada al mapa
	map.addLayer(capaEdicion);
	
	//agregar el control de leyenda al mapa
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	
	//map.addControl(new OpenLayers.Control.EditingToolbar(capaEdicion));
	
	var barraControles = new OpenLayers.Control.Panel({displayClass: 'olControlEditingToolbar'});
	
	var navigation = new OpenLayers.Control.Navigation();
	
	var controlPunto = new OpenLayers.Control.DrawFeature(capaEdicion, OpenLayers.Handler.Point, {
        displayClass: 'olControlDrawFeaturePoint'
    });
	
	barraControles.addControls([navigation, controlPunto]);
	
	map.addControl(barraControles);
	
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
			//vemos en la consola de firebug el capability
			console.debug(capabilities.capability);
			
			//en este caso estamos agregando la primera capa del WMS 
			var orto5 = new OpenLayers.Layer.WMS( "ICC ORTO5",
				"http://shagrat.icc.es/lizardtech/iserv/ows?", 
					{layers: capabilities.capability.layers[0].name, srs:'EPSG:4326', format:'image/png', 
				transparent:'true', exceptions:"application/vnd.ogc.se_xml"},
					{'isBaseLayer':false, 'displayInLayerSwitcher':true}
			);
			map.addLayer(orto5);
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