// variable for leaflet map in order to have programmatic access to it from anywhere within the program
let map;
// variable for layer control in order to have programmatic access to it from anywhere within the program
let layerControl;

// variable for dynakically loaded WFS data
let dynamicWfsDataLayer_points;
let dynamicWfsDataLayer_polygons;

function initControls() {

    if (map) {

        // static attribution
        let attributionControl = map.attributionControl;
        attributionControl.addAttribution("HSBO Viewer");

        // scale control
        scaleControl = L.control.scale(
            { maxWidth: 500, metric: true, imperial: false }
        );
        scaleControl.addTo(map);

        // layer control
        let baseLayers = {};
        let overlayLayers = {};
        layerControl = L.control.layers(baseLayers, overlayLayers);
        layerControl.addTo(map)

    }

};

function initBackgroundData() {
    var wmsLayer_osm = L.tileLayer.wms(
        'https://maps.heigit.org/osm-wms/service?',
        {
            format: 'image/png', layers: 'osm_auto:all',
            attribution: '&copy; <a href="www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

    layerControl.addBaseLayer(wmsLayer_osm, "OSM WMS");

    // OSM tile Layer - add directly to map as default layer
    var tileLayer_osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    layerControl.addBaseLayer(tileLayer_osm, "OSM Tile Layer");

    // NRW DTK Sammeldienst, source Geobasis NRW
    var wmsLayer_nrw_dtk_col = L.tileLayer.wms(
        'https://www.wms.nrw.de/geobasis/wms_nw_dtk?',
        {
            format: 'image/png', layers: 'nw_dtk_col',
            attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/webdienste/geodatendienste/">Bez.regierung K&ouml;ln - Geobasis NRW</a>'
        });
    var wmsLayer_nrw_dtk_sw = L.tileLayer.wms(
        'https://www.wms.nrw.de/geobasis/wms_nw_dtk?',
        {
            format: 'image/png', layers: 'nw_dtk_sw',
            attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/webdienste/geodatendienste/">Bez.regierung K&ouml;ln - Geobasis NRW</a>'
        });

    layerControl.addBaseLayer(wmsLayer_nrw_dtk_col, "NRW DTK - Farbe");
    layerControl.addBaseLayer(wmsLayer_nrw_dtk_sw, "NRW DTK - Graustufen");
};

function initOverlayData() {
    // creation of custom icon from web URL image 
    var uniIcon = L.icon({
        iconUrl: 'https://cdn.icon-icons.com/icons2/510/PNG/512/university_icon-icons.com_49967.png',
        shadowUrl: '',

        iconSize: [30, 30], // size of the icon
        shadowSize: [0, 0], // size of the shadow
        iconAnchor: [25, 25], // point of the icon which will correspond to marker's location
        shadowAnchor: [0, 0],  // the same for the shadow
        popupAnchor: [-6, -26] // point from which the popup should open relative to the iconAnchor
    });

    // add custom marker layer with new icon + set popup content when clicked 
    let hsboMarker = L.marker([51.44756, 7.2708], { icon: uniIcon }).addTo(map).bindPopup("Standort der <b>Hochschule Bochum</b>.");

    layerControl.addOverlay(hsboMarker, "Hochschule Bochum (Standort)");

    // local data from local geoserver

    // Vogelschutzgebiete
    var wmsLayer_vogelschutzgebiete = L.tileLayer.wms(
        'http://localhost:8080/geoserver/gi_ii/wms?',
        {
            format: 'image/png', layers: 'Vogelschutzgebiete_NRW',
            transparent: true, // necessary to set white background to transparent color
            attribution: '&copy; local Geoserver data'
        });
    // Windenergiestandorte
    var wmsLayer_windenergiestandorte = L.tileLayer.wms(
        'http://localhost:8080/geoserver/gi_ii/wms?',
        {
            format: 'image/png', layers: 'Windenergiestandorte',
            transparent: true, // necessary to set white background to transparent color
            attribution: '&copy; local Geoserver data'
        });

    layerControl.addOverlay(wmsLayer_vogelschutzgebiete, "Vogelschutzgebiete NRW");
    layerControl.addOverlay(wmsLayer_windenergiestandorte, "Windkraftanlagen NRW");
};

// initMap method which contains several other init methods to separate parts of instantation process
function initMap() {
    map = L.map('map').setView([51.447, 7.27], 14);

    initControls();

    initBackgroundData();

    initOverlayData();

}

function enableDeleteButton(){
    document.getElementById("removeWfsLayer").removeAttribute("disabled");
}

function disableDeleteButton(){
    document.getElementById("removeWfsLayer").setAttribute("disabled", true);
}
function showLoadingIcon (){
    document.getElementById("loadingSpinner").style.display = "block";    
}
function hideLoadingIcon (){
    document.getElementById("loadingSpinner").style.display = "none";    
}

function onEachFeature_asTable(feature, layer) {
    if (feature.properties) {
        let html = "<div class='table-responsive'><table class='table table-striped table-sm'>";

        html += "<thead>"

        html += "<tr>";
        html += "<th><b>Attributname</b></th>"
        html += "<th><b>Wert</b></th>"
        html += "</tr>";

        html += "</thead>"
        html += "<tbody>"

        for (const key in feature.properties) {
            if (Object.hasOwnProperty.call(feature.properties, key)) {
                const element = feature.properties[key];
                html += "<tr>";
                html += "<td>" + key + "</td>"
                html += "<td>" + element + "</td>"
                html += "</tr>";
            }
        }

        html += "</tbody>"
        html += "</table></div>";

        layer.bindPopup(html);
    }
    else {
        layer.bindPopup("No properties found");
    }

}

function loadExamplePointData() {
    var wfsGetFeatureRequestUrl = "http://localhost:8080/geoserver/gi_ii/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Windenergiestandorte&outputFormat=application%2Fjson";

    // URL should return JSON Format
    fetch(wfsGetFeatureRequestUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data)

            // now use GeoJSON in order to add a new Layer to our map

            // tutorial: https://leafletjs.com/examples/geojson/

            dynamicWfsDataLayer_points = L.geoJSON(data, {
                onEachFeature: onEachFeature_asTable,
                pointToLayer: function (feature, latlng) {    
                    var pointStyle = {
                        radius: 8,
                        fillColor: "#ff0000",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };
        
                    // set color depending on feature property "leistung"
                    if (feature.properties && feature.properties.leistung) {
                        if (feature.properties.leistung < 100) {
                            pointStyle.fillColor = "#ff0000";
                            pointStyle.radius = 4;
                        }
                        else if (feature.properties.leistung >= 100 && feature.properties.leistung < 3000) {
                            pointStyle.fillColor = "#0000ff";
                            pointStyle.radius = 8;
                        }
                        else if (feature.properties.leistung >= 3000) {
                            pointStyle.fillColor = "#00ff00";
                            pointStyle.radius = 12;
                        }
        
                    }            
                    return L.circleMarker(latlng, pointStyle);
                }
            }).addTo(map);

            // add layer to LayerControl
            layerControl.addOverlay(dynamicWfsDataLayer_points, "WFS Example Point Data");
        
            enableDeleteButton();
            hideLoadingIcon();
        })
        .catch(function (error) {
            console.error('Error:', error);
            hideLoadingIcon();
            alert("Error!\n" + error);
        });
}

function loadExamplePolygonData() {
    var wfsGetFeatureRequestUrl = "http://localhost:8080/geoserver/gi_ii/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Vogelschutzgebiete_NRW&outputFormat=application%2Fjson";

    // URL should return JSON Format
    fetch(wfsGetFeatureRequestUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data)

            // now use GeoJSON in order to add a new Layer to our map

            // tutorial: https://leafletjs.com/examples/geojson/

            dynamicWfsDataLayer_polygons = L.geoJSON(data, {
                onEachFeature: onEachFeature_asTable,
                style: function(feature) {
                    // available options https://leafletjs.com/reference.html#path-option
                    var polygonStyle = {
                        fillColor: "#ff0000",
                        color: "#000",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.7,
                        dashArray: "7 7"
                    };
                    return polygonStyle;
                }
            }).addTo(map);

            // add layer to LayerControl
            layerControl.addOverlay(dynamicWfsDataLayer_polygons, "WFS Example Polygon Data");
        
            enableDeleteButton();
            hideLoadingIcon();
        })
        .catch(function (error) {
            console.error('Error:', error);
            hideLoadingIcon();
            alert("Error!\n" + error);
        });
}

function onLoadWfsDataCLicked() {

    // display loading icon as visual feedback to the user
    // the loading and display of dynamic data may take some time
    showLoadingIcon();

    // use the FETCH API which is already integrated into modern browsers
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch 

    if (map && layerControl) {
        loadExamplePolygonData();
        loadExamplePointData();
    }

}

function onRemoveWfsLayerClicked() {
    if(map && layerControl){
        if(map.hasLayer(dynamicWfsDataLayer_points)){
            map.removeLayer(dynamicWfsDataLayer_points);
        }
        if(map.hasLayer(dynamicWfsDataLayer_polygons)){
            map.removeLayer(dynamicWfsDataLayer_polygons);
        }
        layerControl.removeLayer(dynamicWfsDataLayer_points);
        layerControl.removeLayer(dynamicWfsDataLayer_polygons);
    }

    disableDeleteButton();
}

// function to add EventListeners to WFS buttons
function initButtonListeners() {
    document.getElementById("loadWfsData").addEventListener("click", onLoadWfsDataCLicked);
    document.getElementById("removeWfsLayer").addEventListener("click", onRemoveWfsLayerClicked);
};

// a function where initial stuff can happen AFTER THE DOM WAS LOADED COMPLETELY
function onDomLoaded(event) {
    initMap();

    initButtonListeners();
}

// we should ensure that whole DOM is loaded before we init map container
// otherwise the code might be executed too early and the requird DOM node might not be present at that moment in time
document.addEventListener("DOMContentLoaded", onDomLoaded);