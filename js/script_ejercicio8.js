//Definimos la variable map
var map;
var elemento_activo;
var popup;
var capaEdicion;

function init() {
	//Asigamos la ruta para el archivo Proxy
	OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";

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
	
	//defnimos el estilo para los puntos
	var style = new OpenLayers.Style(
        // el primer argumento es un simbolo base
        // todos los otros estilo basados en la reglas extienden este estilo
        {
            graphicWidth: 21,
            graphicHeight: 25,
            graphicYOffset: -28 //movemos la imagen 28 pixels hacia arriba
        },
        // el segundo argumento incluye todo las reglas de estilo
        {
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "tipo", // el atributo "tipo" de elemento es el que se usa para hacer la comparación
                        value: 'accidente'
                    }),
                    // si el elemento cumple con el filotr de usa el siguiente symbolizer
                    symbolizer: {
                        externalGraphic: "img/caraccident.png"
                    }
                }),
                new OpenLayers.Rule({
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "tipo",
                        value: 'mobiliario'
                    }),
                    symbolizer: {
                        externalGraphic: "img/picnic-2.png"
                    }
                }),
                new OpenLayers.Rule({
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "tipo",
                        value: 'contenedor'
                    }),
                    symbolizer: {
                        externalGraphic: "img/recycle.png"
                    }
                }),
                new OpenLayers.Rule({
                    // apply this rule if no others apply
                    elseFilter: true,
                    symbolizer: {
                        externalGraphic: "img/comment-map-icon.png"
                    }
                })
            ]
        }
    );
	
	
	
	
	//Creamos la capa de tipo Vector donde editaremos
	capaEdicion =  new OpenLayers.Layer.Vector("Editable", {
        styleMap: new OpenLayers.StyleMap(style)
    });
	
	//registramos el evento featureadded para detectar cuando se agregar un elemento a la capa
	capaEdicion.events.register('featureadded', capaEdicion, agregarElemento);
	
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
	
	var controlAddWms = new OpenLayers.Control({
		type: OpenLayers.Control.TYPE_BUTTON,
		trigger: function() {
			//mostramos el div que contiene el formulario para agregar el WMS 
			document.getElementById('addwms').style.display = 'block';			
		},
		displayClass: 'addWms'
	});
	
	barraControles.addControls([navigation, controlPunto, controlAddWms]);
	
	map.addControl(barraControles);
	
	map.setCenter(
		new OpenLayers.LonLat(1.1406, 41.6485).transform(
			new OpenLayers.Projection("EPSG:4326"),
			map.getProjectionObject()
		), 14
	);
}

function leerCapabilitiesWMS(){
	var url = document.getElementById('wmsurl').value;
	var format = new OpenLayers.Format.WMSCapabilities();
	OpenLayers.Request.GET({
        url: url,
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
			//aqui lo ideal es que se muestre el listado de capas al usuario puede ser un select y que este seleccione cual capa agregar.
			//Desde el select se debe llamar a la funcion de agregarWMS.
			agregarWMS(url,capabilities.capability.layers[0].name);
			
        },
        failure: function() {
            alert("Problemas leer capabilities doc");
            OpenLayers.Console.error.apply(OpenLayers.Console, arguments);
        }
    });
	
}

function agregarWMS(url, capa){
	var orto5 = new OpenLayers.Layer.WMS( "ICC ORTO5",
		url, 
			{layers: capa, srs:'EPSG:4326', format:'image/png', 
		transparent:'true', exceptions:"application/vnd.ogc.se_xml"},
			{'isBaseLayer':false, 'displayInLayerSwitcher':true}
	);
	map.addLayer(orto5);

	ocultarAddwms();		
}

function ocultarAddwms(){
	document.getElementById('addwms').style.display = 'none';
}

function agregarElemento(evento){
	var feature = evento.feature;
	elemento_activo = feature;
	var form = "<FORM>"+
	"<H2><b>ATRIBUTOS DEL ELEMENTO</b></h2>\n" +
	"Tipo de incidente: <br/> \n" +
	"Tipo:<select id='tipo'>\n"+
	"<option value='accidente'>Accidentes de tráfico</option>\n"+
	"<option value='mobiliario'>Mobiliario urbano en mal estado</option>\n"+
	"<option value='contenedor'>Contenedor de basura lleno</option>\n"+
	"<option value='otros'>Otros</option>\n"+
	"</select><br/>\n" +
	"<input type='button' value='Guardar' onclick='guardarElemento()'><br/>\n" +
	"</FORM>";
	popup = new OpenLayers.Popup.FramedCloud(
		"Info vec",
		feature.geometry.getBounds().getCenterLonLat(),
		null,
		form,
		null, 
		true 
	);
	feature.popup = popup;
	map.addPopup(popup);
}

function guardarElemento(){
	var feature = elemento_activo;
	feature.attributes.tipo = document.getElementById('tipo').value;
	capaEdicion.redraw();
	feature.popup = null;
	map.removePopup(popup);
}
