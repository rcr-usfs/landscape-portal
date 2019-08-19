function createMap(){
	// Load map settings from cache if available
	if(typeof(Storage) !== "undefined"){
		map_settings = JSON.parse(localStorage.getItem("map_settings"));
	}

	if(map_settings != null && map_settings.center != null && map_settings.zoom != null){
		center = map_settings.center;
		zoom  = map_settings.zoom;
	}
	else{
		center = {lat: 44.205, lng: -119.013};
		zoom = 8;
	}

	var mapOptions = {
		fullscreenControlOptions:{position: google.maps.ControlPosition.LEFT_TOP},
	    streetViewControlOptions:{position: google.maps.ControlPosition.LEFT_TOP},
	    zoomControlOptions:{position: google.maps.ControlPosition.LEFT_TOP},
	    tilt:0,
	    mapTypeId: 'satellite',
	    controlSize: 25,
	    center: center,
		zoom: zoom,
		streetViewControl: true,
		scaleControl: true
	}
	// Create two new Google Maps
	map1 = new google.maps.Map(document.getElementById('map1'), mapOptions);

	studyAreaLayer = new google.maps.Data();
	trainingDataLayer = new google.maps.Data();
	infowindow = new google.maps.InfoWindow({
			         content : 'testContent',
			          maxWidth: 200
			        });
	map2 = new google.maps.Map(document.getElementById('map2'), mapOptions);

	// Add center and zoom listeners
	function addListeners(listeners){
		listeners.map(function(listener){
			map1.addListener(listener, function() {
				var z = map1.getZoom();
				var c = map1.getCenter();
				map2.setZoom(z);
				map2.setCenter(c);
			});

			map2.addListener(listener, function() {
				var z = map2.getZoom();
				var c = map2.getCenter();
				map1.setZoom(z);
				map1.setCenter(c);
			});
		})
	}

	addListeners(['drag','tilesloaded','click'])

	// Update cache for zoom and center when changed
	google.maps.event.addListener(map1,'bounds_changed',function(){
		if(typeof(Storage) == "undefined") return;
		localStorage.setItem("map_settings",JSON.stringify({center:{lat:map1.getCenter().lat(),lng:map1.getCenter().lng()},zoom:map1.getZoom()}));
	});
}
function concatGeoJSON(g1, g2){
    return { 
        "type" : "FeatureCollection",
        "features": g1.features.concat(g2.features)
    }
}
function batchConcatGeoJSON(geoJSONs){
	var out;
	// if(geoJSONs.length <= 1){out = geoJSONs}
	// else{
		out = concatGeoJSON(geoJSONs[0], geoJSONs[1])
		var i = 2;
		while(i < geoJSONs.length-1){
			out = concatGeoJSON(out, geoJSONs[i]);
			i++;
		}
	// }
	return out
}
//Function to convert csv, kml, shp to geoJSON
function convertToGeoJSON(formID){
	var url = 'https://ogre.adc4gis.com/convert'
//
	var data = new FormData();
	data.append("targetSrs","EPSG:4326");
	jQuery.each(jQuery('#'+formID)[0].files, function (i, file) {
		data.append("upload", file);
	
	})
	
	
	

	var out= $.ajax({
		type: 'POST',
		url: url,
		data: data,
		processData: false,
		contentType: false
	});

	return out;
}	
function batchConvertToGeoJSON(formID){
	var allOut = [];
	var merged;
	jQuery.each(jQuery('#'+formID)[0].files, function (i, file) {
		
		var t = convertToGeoJSON(file);//.done(function(converted){allOut.push(converted)})
	// 	console.log(t);
	// 	allOut.push(t);

	})
	// .done(function(){
	// 	console.log('hello');
	// 	console.log(allOut);
	// 	merged = batchConcatGeoJSON(allOut);
	// 	console.log(merged);
		
	// });
	// return allOut;
	
	
}
function setToInt(feature,props){
  var outValues  = props.map(function(prop){return ee.Number.parse(feature.get(prop))});
  var outDict = ee.Dictionary.fromLists(props, outValues);
  var outFeature = feature.setMulti(outDict);
  return outFeature;
}
function updateColorPairs(){
	$('#class-color-pairs').empty();
	coverClass = $('.coverClassSelect option:selected').text();
	percentCoverField = coverClass;
	var coverClassIndex = classList.indexOf(coverClass);
	if (canopyBreaks.length == 2){
		var canopyBreaksPlus = [parseInt(canopyBreaks[0]) + 1, parseInt(canopyBreaks[1]) + 1];
		var fullClassList = classList.slice(0,coverClassIndex).concat(
			coverClass + ' 0-' + canopyBreaks[0] + '% CC', 
			coverClass + ' ' + canopyBreaksPlus[0] + '-' + canopyBreaks[1] + '% CC', 
			coverClass + ' ' + canopyBreaksPlus[1] + '-100% CC',
			classList.slice(coverClassIndex+1,classList.length)
		);
	} else if (canopyBreaks.length == 3){
		var canopyBreaksPlus = [parseInt(canopyBreaks[0]) + 1, parseInt(canopyBreaks[1]) + 1, parseInt(canopyBreaks[2]) + 1];
		var fullClassList = classList.slice(0,coverClassIndex).concat(
			coverClass + ' 0-' + canopyBreaks[0] + '% CC', 
			coverClass + ' ' + canopyBreaksPlus[0] + '-' + canopyBreaks[1] + '% CC',
			coverClass + ' ' + canopyBreaksPlus[1] + '-' + canopyBreaks[2] + '% CC',
			coverClass + ' ' + canopyBreaksPlus[2] + '-100% CC',
			classList.slice(coverClassIndex+1,classList.length)
		);
	}
	var fullClassListSeq = Array.apply(null, {length: fullClassList.length}).map(Function.call, Number);
	
	createClassColorPairs(fullClassListSeq, fullClassList);
}
function createLayers(){
	// Define visualization parameters
	switch (compositeBandVal) { // Multiplied by 10000 for 16-bit output
		case "0": var vizComposite = {'min': 300,'max': [2000,2000,2000], 'bands': 'red,green,blue', 'gamma': 1.6}; break; 
		case "1": var vizComposite = {'min': 0.05,'max': [3000,3000,3000], 'bands': 'nir,red,green', 'gamma': 1.6}; break;
		case "2": var vizComposite = {'min': 0.05,'max': [3000,4000,4000], 'bands': 'swir1,nir,red', 'gamma': 1.6}; break;
	}
	
	var vizClassified = {'min': 0, 'max': classList.length + canopyBreaks.length - 1, 'palette': colorList};
	var vizChange = {'min': 0, 'max': 2, 'palette': '82d074, 000000, 8d3d77'};
	var vizMask = {'min': 1, 'max': 1, 'palette': '000000'};

	// Add layers to map
	layerStartRunTime = new Date();

	addToMap(preComposite, vizComposite, preYear.toString() + ' Composite', true, map1);
	addToMap(preComposite, vizComposite, preYear.toString() + ' Composite', false, map2);
	addToMap(postComposite, vizComposite, postYear.toString() + ' Composite', true, map1);
	addToMap(postComposite, vizComposite, postYear.toString() + ' Composite', false, map2);
	
	addToMap(diffThematic, vizChange, 'Change/No-Change', false, map1);
	addToMap(diffThematic, vizChange, 'Change/No-Change', false, map2);

	addToMap(preClassified, vizClassified, preYear.toString() + ' Classified', false, map1);
	addToMap(preClassified, vizClassified, preYear.toString() + ' Classified', true, map2);
	addToMap(prePostClassified, vizClassified, postYear.toString() + ' Classified', false, map1);
	addToMap(prePostClassified, vizClassified, postYear.toString() + ' Classified', true, map2);

	addToMap(changeClassification, vizMask, 'Mask Non-Change', false, map1);
	addToMap(changeClassification, vizMask, 'Mask Non-Change', false, map2);

	// addToMap(changeMask, vizMask, 'Mask Non-Change', false, map1);
	// addToMap(changeMask, vizMask, 'Mask Non-Change', false, map2);

}

// Function to refresh layers with new visualization parameters
function refreshLayers(){
	// Clear layers
	Object.keys(layerStructure).map(function(key){
		var currentMap = layerStructure[key].map;
		var currentLayerID = layerStructure[key].layerID;
		currentMap.overlayMapTypes.setAt(currentLayerID,null);
	});

	// Reset structure
	layerStructure = {};
	layerID = 1;

	// Clear dropdown menus
	$('#dropdown-menu-left').empty();
	$('#dropdown-menu-right').empty();

	// Create layers again
	startRunTime = new Date();
	createLayers();
}

// Function to add a layer to the map
function addToMap(eeObject,vizParams,name,visible,map){
	// Create layer row for dropdown menu
	var stringCheckboxChecked = '<input type="checkbox" class="layer-checkbox" id="layer-checkbox-'+ layerID.toString() + '" name="lyr-check" field="'+ layerID.toString() +'" onclick = "toggleLayer(this)" style="display:none;" checked>';
	var stringCheckboxUnchecked = '<input type="checkbox" class="layer-checkbox" id="layer-checkbox-'+ layerID.toString() + '" name="lyr-check" field="'+ layerID.toString() +'" onclick = "toggleLayer(this)" style="display:none;">';
	var stringSpinner = '<img src="img/GEE_logo_transparent.png" class="fa-spin layerSpinner" id="layer-spinner-'+ layerID.toString() + '" alt="Gear Spinner" style="width: 25px; height: 25px;">';
	var stringText = '<h5>' + name + '</h5>';
	var stringSlider = '<input type="range" class="layer-slider" id = "layer-slider-' + layerID.toString() + '" value="1" min="0" max="1" step = "0.05" field="'+ layerID.toString() +'" oninput="changeOpacity(this)">';
	var currentLayer = {};
	currentLayer.htmlChecked = '<li class="list-layer">' + stringCheckboxChecked + stringSpinner + stringText + stringSlider + '</li>';
	currentLayer.htmlUnchecked = '<li class="list-layer">' + stringCheckboxUnchecked + stringSpinner + stringText + stringSlider + '</li>';

	// Display layer on correct map if visible is set to true, and add layer to dropdown menu
	if (visible){
		if (map == map1){
			$('#dropdown-menu-left').prepend(currentLayer.htmlChecked);
		} else {
			$('#dropdown-menu-right').prepend(currentLayer.htmlChecked);
		}
	} else {
		if (map == map1) {
			$('#dropdown-menu-left').prepend(currentLayer.htmlUnchecked);
		} else{
			$('#dropdown-menu-right').prepend(currentLayer.htmlUnchecked);
		}
	}
	var currentLayerID = layerID;
	layerID++;

	var layerSuccess = 0;
	getMapWrapper(eeObject,vizParams,name,visible,map,layerSuccess,currentLayer,currentLayerID);
	
}

function getMapWrapper(eeObject,vizParams,name,visible,map,layerSuccess,currentLayer,currentLayerID){
	console.log('Attempting to add layer: ' + name);
	var currentRunTime = new Date();
	if ((layerSuccess == 0) && (currentRunTime - startRunTime < maxRunTime)){
		eeObject.getMap(vizParams, function(mapItem){
			try{
				layerSuccess = 1;
				var highWaterMark = 0;
				var percent = 0;

				var layer = new ee.MapLayerOverlay('https://earthengine.googleapis.com/map', mapItem['mapid'], mapItem['token'], {});

				layer.addTileCallback(function(event){
					// console.log(event);
					if(event.count > highWaterMark){
						highWaterMark = event.count;
					}
					percent = 100 - ((event.count / highWaterMark) * 100);
					var progressStyle = [
						'background: -webkit-linear-gradient(left, #e2edff '+ percent +'%, white '+ percent +'%)',
						'background: -moz-linear-gradient(left, #e2edff '+ percent +'%, white '+ percent +'%)',
						'background: -ms-linear-gradient(left, #e2edff '+ percent +'%, white '+ percent +'%)',
						'background: linear-gradient(left, #e2edff '+ percent +'%, white '+ percent +'%)'
					].join(';');
					$('input[type="checkbox"][field="'+ currentLayerID.toString() +'"]').parent()[0].setAttribute('style', progressStyle);
				});

				// Set current layer properties
				currentLayer.layer = layer;
				currentLayer.layerID = currentLayerID;
				currentLayer.name = name;
				currentLayer.map = map;

				// Display layer on correct map if visible is set to true, and add layer to dropdown menu
				if (visible){
					map.overlayMapTypes.setAt(currentLayerID,layer);
				}

				// Add current layer to layer structure
				layerStructure[currentLayerID] = currentLayer;
				$('#layer-spinner-' + currentLayerID.toString()).hide();
				$('#layer-checkbox-' + currentLayerID.toString()).show();
				$('#layer-slider-' + currentLayerID.toString()).show();
				console.log('Succeeded in adding layer: ' + name);
			}
			catch(err){
				console.log(err);
				layerSuccess = 0;
				getMapWrapper(eeObject,vizParams,name,visible,map,layerSuccess,currentLayer,currentLayerID);
			}
		});
	} else {
		console.log('Failed to add layer: ' + name);
		$('input[type="checkbox"][field="'+ currentLayerID.toString() +'"]').parent()[0].setAttribute('style', 'background: #D85656');
		$('#layer-spinner-' + currentLayerID.toString()).hide();
		$('#layer-checkbox-' + currentLayerID.toString()).show().attr('disabled', true);
		$('#layer-slider-' + currentLayerID.toString()).attr('disabled', true);
	}
}

// Function to toggle a layer on and off with a checkbox
function toggleLayer(thisCheckbox){
	var thisLayerID = $(thisCheckbox).attr('field');
	var thisLayer = layerStructure[thisLayerID].layer;
	var thisMap = layerStructure[thisLayerID].map;
	if ($(thisCheckbox)[0].checked){
		thisMap.overlayMapTypes.setAt(thisLayerID,thisLayer);
	} else {
		thisMap.overlayMapTypes.setAt(thisLayerID,null);
	}
}

// Function to change the opacity of a layer with a slider
function changeOpacity(thisSlider){
	var thisLayerID = $(thisSlider).attr('field');
	var thisLayer = layerStructure[thisLayerID].layer;
	thisLayer.setOpacity(thisSlider.value)
}