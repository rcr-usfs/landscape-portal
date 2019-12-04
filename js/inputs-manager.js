function createInputs(){
	// Get cached settings
	if (typeof(Storage) !== "undefined"){
		input_settings = JSON.parse(localStorage.getItem("input_settings"));
	}
	if (input_settings != null){
		// if (input_settings.trainingDataFTID != null){
			// trainingDataFusionTableID.value = input_settings.trainingDataFTID;
		// }
		if (input_settings.trainingYearVal != null){
			// trainingYearSlider.value = input_settings.trainingYearVal;
			// trainingYearOut.value = input_settings.trainingYearVal;
		}
		if (input_settings.canopyBreaksVal != null){
			var canopyLowOut = document.getElementById('canopyLowOut');
			var canopyMedOut = document.getElementById('canopyMedOut');
			var canopyHighOut = document.getElementById('canopyHighOut');
			canopyLowOut.value = input_settings.canopyBreaksVal[0];
			canopyMedOut.value = input_settings.canopyBreaksVal[1];
			canopyHighOut.value = input_settings.canopyBreaksVal[2];
			canopyBreaksCached = true;
		}
		// if (input_settings.studyAreaFTID != null){
		// 	studyAreaUpload.value = input_settings.studyAreaFTID;
		// }
		if (input_settings.studyAreaNameVal != null){
			studyAreaName.value = input_settings.studyAreaNameVal;
		}
		if (input_settings.startDateVal != null){
			startDate.value = input_settings.startDateVal;
			startDateOut.value = dateFromDay(input_settings.startDateVal);
		}
		if (input_settings.endDateVal != null){
			endDate.value = input_settings.endDateVal;
			endDateOut.value = dateFromDay(input_settings.endDateVal);
		}
		if (input_settings.comparisonYearVal != null){
			comparisonYearSlider.value = input_settings.comparisonYearVal;
			comparisonYearOut.value = input_settings.comparisonYearVal;
		}
		if (input_settings.sensorCheckboxVals != null){
			$.each(input_settings.sensorCheckboxVals, function(key, value) {
				$("#" + key).prop('checked', value);
			});
		}
		if (input_settings.changeIndexVals != null){
			$.each(input_settings.changeIndexVals, function(key, value) {
				$("#" + key).prop('checked', value);
			});
		}
		if (input_settings.gainLossPercentilesVal != null){
			var gainPercentileOut = document.getElementById('gainPercentileOut');
			var lossPercentileOut = document.getElementById('lossPercentileOut');
			gainPercentileOut.value = input_settings.gainLossPercentilesVal[0];
			lossPercentileOut.value = input_settings.gainLossPercentilesVal[1];
			gainLossPercentilesCached = true;
		}
		if (input_settings.mapArrangeVals != null){
			$.each(input_settings.mapArrangeVals, function(key, value) {
				$("#" + key).prop('checked', value);
			});
		}
		if (input_settings.compVizVals != null){
			$.each(input_settings.compVizVals, function(key, value) {
				$("#" + key).prop('checked', value);
			});
		}
		if (input_settings.yearsOfImageryVal != null){
			$('input[name=yearsOfImagery]').val(input_settings.yearsOfImageryVal);
		}
		if (input_settings.cloudThresholdVal != null){
			cloudThreshold.value = input_settings.cloudThresholdVal;
			cloudThresholdOut.value = input_settings.cloudThresholdVal;
		}
		if (input_settings.compositeBufferVal != null){
			compositeBuffer.value = input_settings.compositeBufferVal;
			compositeBufferOut.value = input_settings.compositeBufferVal;
		}
		if (input_settings.compositePercentileVal != null){
			compositePercentile.value = input_settings.compositePercentileVal;
			compositePercentileOut.value = input_settings.compositePercentileVal;
		}
		if (input_settings.rfTreesVal != null){
			rfTrees.value = input_settings.rfTreesVal;
			rfTreesOut.value = input_settings.rfTreesVal;
		}
		if (input_settings.reducerScaleVal != null){
			reducerScaleSlider.value = input_settings.reducerScaleVal;
			reducerScaleOut.value = input_settings.reducerScaleVal;
		}
		if (input_settings.tileScaleVal != null){
			$('input[name=tileScale]').val(input_settings.tileScaleVal);
		}
		if (input_settings.epsgVal != null){
			epsgNumber.value = input_settings.epsgVal;
		}
	} else {
		if (typeof(Storage) !== "undefined"){
			input_settings = {};
			localStorage.setItem("input_settings",JSON.stringify(input_settings));
		}
	}

	// Create canopy breaks dual slider
	var canopyBreaksDualSlider = document.getElementById('canopyBreaksDualSlider');
	
	// Use cached values if available, else set to defaults
	if (canopyBreaksCached){
		noUiSlider.create(canopyBreaksDualSlider, {
			start: [canopyLowOut.value, canopyMedOut.value, canopyHighOut.value],
			step: 1,
			range: {
				'min': [ 1 ],
				'max': [ 99 ]
			},
			connect: false,
			tooltips: true,
			format: {
				to: function (value) {
					return parseInt(value);
				},
				from: function (value) {
					return parseInt(value);
				}
			}
		});
	} else {
		var canopyLowOut = document.getElementById('canopyLowOut');
		var canopyMedOut = document.getElementById('canopyMedOut');
		var canopyHighOut = document.getElementById('canopyHighOut');
		noUiSlider.create(canopyBreaksDualSlider, {
			start: [15, 40, 80],
			step: 1,
			range: {
				'min': [ 1 ],
				'max': [ 99 ]
			},
			connect: false,
			tooltips: true,
			format: {
				to: function (value) {
					return parseInt(value);
				},
				from: function (value) {
					return parseInt(value);
				}
			}
		});
	}
	
	canopyBreaks = [canopyLowOut.value, canopyMedOut.value, canopyHighOut.value];
	var nBreaks = canopyBreaks.length;
	canopyBreaksDualSlider.noUiSlider.on('update', function(values) {
		canopyLowOut.value = parseInt(values[0]);
		canopyMedOut.value = parseInt(values[1]);
		canopyHighOut.value = parseInt(values[2]);
		canopyBreaks = [canopyLowOut.value, canopyMedOut.value, canopyHighOut.value];
		// If the training data has been loaded, update class names for color palette
		if (loadTrainingData) {
			$('#class-color-pairs').empty();
			var coverClassIndex = classList.indexOf(coverClass);
			if (nBreaks == 2){
				var canopyBreaksPlus = [parseInt(canopyBreaks[0]) + 1, parseInt(canopyBreaks[1]) + 1];
				var fullClassList = classList.slice(0,coverClassIndex).concat(
					coverClass + ' 0-' + canopyBreaks[0] + '% CC', 
					coverClass + ' ' + canopyBreaksPlus[0] + '-' + canopyBreaks[1] + '% CC', 
					coverClass + ' ' + canopyBreaksPlus[1] + '-100% CC',
					classList.slice(coverClassIndex+1,classList.length)
				);
			} else if (nBreaks == 3){
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
	});

	// Create gain loss percentile dual slider
	var gainLossPercentilesDualSlider = document.getElementById('gainLossPercentilesDualSlider');
	
	if (gainLossPercentilesCached){
		noUiSlider.create(gainLossPercentilesDualSlider, {
			start: [gainPercentileOut.value, lossPercentileOut.value],
			step: 1,
			range: {
				'min': [ 1 ],
				'max': [ 99 ]
			},
			connect: true
		});
	} else {
		var gainPercentileOut = document.getElementById('gainPercentileOut');
		var lossPercentileOut = document.getElementById('lossPercentileOut');
		noUiSlider.create(gainLossPercentilesDualSlider, {
			start: [10, 90],
			step: 1,
			range: {
				'min': [ 1 ],
				'max': [ 99 ]
			},
			connect: true
		});
	}

	gainLossPercentiles = [gainPercentileOut.value, lossPercentileOut.value];
	gainLossPercentilesDualSlider.noUiSlider.on('update', function(values) {
		gainPercentileOut.value = parseInt(values[0]);
		lossPercentileOut.value = parseInt(values[1]);
		gainLossPercentiles = [gainPercentileOut.value, lossPercentileOut.value];
	});

	// For numeric up/down incrementer, on plus click
	$('.qtyplus').click(function(e){
		// Stop acting like a button
		e.preventDefault();
		// Get the field name
		var fieldName = $(this).attr('field');
		// Get its current value
		var currentVal = parseInt($('input[name='+fieldName+']').val());
		// If is not undefined
		if (!isNaN(currentVal)) {
			// Increment
			$('input[name='+fieldName+']').val(currentVal + 1);
		} else {
			// Otherwise put a 1 there
			$('input[name='+fieldName+']').val(1);
		}
	});

	// For numeric up/down decrementer, on minus click, decrement the value till 1
	$(".qtyminus").click(function(e) {
		// Stop acting like a button
		e.preventDefault();
		// Get the field name
		var fieldName = $(this).attr('field');
		// Get its current value
		var currentVal = parseInt($('input[name='+fieldName+']').val());
		// If it isn't undefined or its greater than 0
		if (!isNaN(currentVal) && currentVal > 1) {
			// Decrement one
			$('input[name='+fieldName+']').val(currentVal - 1);
		} else {
			// Otherwise put a 1 there
			$('input[name='+fieldName+']').val(1);
		}
	});

	// Get list of possible sensors
	possibleSensors = [];
	$.each($("input[name='optcheck']:checked"), function(){            
		possibleSensors.push($(this).val());
	});

	// On checking a check box, update list of sensors
	$('.checkbox-inline').click(function(){
		possibleSensors = [];
		$.each($("input[name='optcheck']:checked"), function(){            
			possibleSensors.push($(this).val());
		});
	})

	var geometryPolygonOptions = {
		fillColor: '#000000',
		fillOpacity: '0.2',
		strokeColor: '#000000',
		strokeOpacity: 1,
		strokeWeight: 2,
		draggable: true,
		editable: true,
		geodesic: true,
	};

	// On changing the study area radio button
	var studyAreaVal = $("input[name='studyradio']:checked").val();
	$('#studyAreaRadio').change(function(){
		studyAreaVal = $("input[name='studyradio']:checked").val();
		// If load fusion table is chosen
		if (studyAreaVal == '0'){
			$('#studyarea-ft-group').show();
			$('#studyarea-geom-group').hide();
			map1.setOptions({draggableCursor:''});
			map1.setOptions({disableDoubleClickZoom: false });

			// Hide geometry if already drawn
			if (geometryPolygon != undefined){
				geometryPolygon.setMap(null);
				polygonVisible = false;
			}

			// Display study area if already loaded
			if (studyAreaPolgyon != undefined){
				studyAreaPolgyon.setMap(map1);
				studyAreaVisible = true;
			}

		// If draw geometry is chosen
		} else if (studyAreaVal == '1'){
			$('#studyarea-ft-group').hide();
			$('#studyarea-geom-group').show();
			map1.setOptions({draggableCursor:'crosshair'});
			map1.setOptions({disableDoubleClickZoom: true });
			// Hide study area if already defined
			if (studyAreaPolgyon != undefined){
				studyAreaPolgyon.setMap(null);
				studyAreaVisible = false;
			}

			// Create geometry polygon
			if (geometryPolygon == undefined){
				geometryPolygon = new google.maps.Polygon(geometryPolygonOptions);
			}
			geometryPolygon.setMap(map1);
			polygonVisible = true;

			map1.addListener('click', function(event) {
				if (polygonVisible){
					var path = geometryPolygon.getPath();
					var yx = event.latLng;
					path.push(yx);
				}
			});
		}
	});

	// On clicking the geometry show/hide button
	$('#geometryShowHideButton').click(function(){
		if (geometryPolygon.getPath().length > 0) {
			if (polygonVisible){
				geometryPolygon.setMap(null);
				polygonVisible = false;
			} else {
				geometryPolygon.setMap(map1);
				polygonVisible = true;
			}
		}
	});

	// On clicking the reset geometry button
	$('#geometryResetButton').click(function(){
		geometryPolygon.setMap(null);
		geometryPolygon = new google.maps.Polygon(geometryPolygonOptions);
		geometryPolygon.setMap(map1);
	});

	// On clicking the load study area button
	$('#studyAreaUpload').change(function(){
		var name = jQuery('#studyAreaUpload')[0].files[0].name.split('.')[0];
		studyAreaName.value = name;
		$('#gearSpinner').show();
		setTimeout(function(){
			// If a study area has already been loaded, reset
			if(studyAreaPolgyon != undefined){
				studyAreaPolgyon.setMap(null);
				studyAreaVisible = false;
			}
			// Add study area to left map
			// studyAreaPolgyon = new google.maps.FusionTablesLayer({
			// 	query: {
			// 		select: '\'Geocodable address\'',
			// 		from: studyAreaFusionTableID.value
			// 	},
			// 	styles: [{
			// 		polygonOptions: {
			// 			fillColor: '#000000',
			// 			fillOpacity: 0.1,
			// 			strokeColor: '#000000',
			// 			strokeOpacity: 1,
			// 			strokeWeight: 2
			// 		}
			// 	}]
			// });

			// Get study area
			
				convertToGeoJSON('studyAreaUpload').done(function(converted){
					console.log('successfully converted to JSON');
					// console.log(converted);
					studyArea = parseFT(JSON.stringify(converted));
					studyAreaPolgyon = studyAreaLayer;
					
					studyAreaPolgyon.addGeoJson(studyArea.getInfo());
					// Center map on study area
		
					loadStudyArea = centerObject(studyArea,map1);
					if (loadStudyArea){
						studyArea = studyArea.geometry();
						studyAreaVisible = true;
						studyAreaPolgyon.setMap(map1);

						// Update cache
						if(typeof(Storage) == "undefined") {
							return;
						} else {
							input_settings.studyAreaFTID = $('#studyAreaUpload')[0];
							localStorage.setItem("input_settings",JSON.stringify(input_settings));
						}

					} else {
						studyArea = undefined;
						studyAreaVisible = false;
					}

					$('#gearSpinner').hide();
					
				});
				
				
						
			
		}, 50);

	}); // End study area load

	// On clicking the study area show/hide button
	$('#studyAreaShowHideButton').click(function(){
		if (studyAreaPolgyon != undefined) {
			if (studyAreaVisible){
				studyAreaPolgyon.setMap(null);
				studyAreaVisible = false;
			} else {
				studyAreaPolgyon.setMap(map1);
				studyAreaVisible = true;
			}
		}
	});

	// On changing the map arrangement radio button
	mapArrangeVal = $("input[name='mapradio']:checked").val();
	$('#mapArrangeRadio').change(function(){
		mapArrangeVal = $("input[name='mapradio']:checked").val();
		// Left-right
		if (mapArrangeVal == '0'){
			$('#map2').css({'width': '50%', 'height': '100%'});
			$('#rightLayerSelect').css({'left': 'calc(50% + 335px)', 'top': '70px'});
			if ($('#map2').is(':visible')){
				$('#map1').css({'width': '50%', 'height': '100%'});
				var currentCenter = map1.getCenter()
				google.maps.event.trigger(map1, 'resize');
				google.maps.event.trigger(map2, 'resize');
				map1.setCenter(currentCenter);
				map2.setCenter(currentCenter);
			}
		// Top-bottom
		} else if (mapArrangeVal == '1'){
			$('#map2').css({'width': '100%', 'height': '50%'});
			$('#rightLayerSelect').css({'left': '570px', 'top': 'calc(50% + 13px)'});
			if ($('#map2').is(':visible')){
				$('#map1').css({'width': '100%', 'height': '50%'});
				var currentCenter = map1.getCenter()
				google.maps.event.trigger(map1, 'resize');
				google.maps.event.trigger(map2, 'resize');
				map1.setCenter(currentCenter);
				map2.setCenter(currentCenter);
			}
		}
	});

	// On changing the composite bands radio button
	compositeBandVal = $("input[name='bandradio']:checked").val();
	$('#compositeBandsRadio').change(function(){
		compositeBandVal = $("input[name='bandradio']:checked").val();
	});

	// On clicking the load training data button
	$('#trainingDataUpload').change(function(){
		$('#gearSpinner').show();
		setTimeout(function(){
			// Load training data
			convertToGeoJSON('trainingDataUpload').done(function(converted){
				console.log('successfully converted to JSON');
	
			console.log(converted);
			allTrainingData = parseFT(JSON.stringify(converted));
			
			
			trainingDataLayer.addGeoJson(allTrainingData.getInfo());

			// Set mouseover event for each feature.
			trainingDataLayer.addListener('click', function(event) {
				var values = event.feature.l;
				var outText = '';
				Object.keys(values).map(function(k){
					outText = outText + k + ': '+values[k] + '\n';
				});
				// $('#errorModal p').text(outText);
				// $('#errorModal').modal('show');
				
         		// var feat = event.feature;
         		
     			// var html = "<b>"+feat.getProperty('name')+"<b>"+
        //         "<b><br>Non Tree: "+Number.parseFloat(feat.getProperty('Non Tree')*100).toFixed(2)+"%<b>"+
        //         "<b><br>Tree: "+Number.parseFloat(feat.getProperty('Tree')*100).toFixed(2)+"%<b>";
     			// console.log(html)
			     // // html += "<br><a class='normal_link' target='_blank' href='"+feat.getProperty('link')+"'>link</a>";
			     
			     infowindow.setContent(outText);
			     infowindow.setPosition(event.latLng);
			     infowindow.setOptions({pixelOffset: new google.maps.Size(0,-34)});
			     infowindow.open(map1);
			});
			
			trainingDataLayer.setStyle(
					 {
						icon: {
					    path: google.maps.SymbolPath.CIRCLE,
					    fillColor: 'red',
					    fillOpacity: .8,
					    scale: 4.5,
					    strokeColor: 'white',
					    strokeWeight: 1
						}
					})
			// Center map on training data

			loadTrainingData = centerObject(allTrainingData,map1);
			if (loadTrainingData){
				// Get the selection dropdowns
				$('#trainingDataDropdowns').show();
				var trainingYearSelect = $('.trainingYearSelect');
				var coverClassSelect = $('.coverClassSelect');

				// Remove current options
				coverClassSelect.empty();
				trainingYearSelect.empty();

				// If a training data layer has already been loaded, reset
				if(trainingDataLayer != undefined){
					trainingDataLayer.setMap(null);
					trainingDataVisible = false;
				}

				// // Add training data layer to left map
				// trainingDataLayer = new google.maps.FusionTablesLayer({
				// 	query: {
				// 		select: '\'Geocodable address\'',
				// 		from: trainingDataFusionTableID.value
				// 	},
				// });
				trainingDataLayer.setMap(map1);
				trainingDataVisible = true;

				// Remove unanalyzed plots
				// trainingData = trainingData.filter(ee.Filter.eq('ANALYSES',1));

				// Select land cover columns
				var columns = allTrainingData.first().propertyNames().sort();
				// PLOT_ID,CENTER_LON,CENTER_LAT,SIZE_M,SHAPE,FLAGGED,ANALYSES,SAMPLE_POINTS,USER_ID,COLLECTION_TIME,ANALYSIS_DURATION,PL_LONGITUDE,PL_LATITUDE,PL_PLOTID
				// var notList = ['FLAGGED','USER_ID','SHAPE','ANALYSES','PLOT_ID','SAMPLE_POINTS','CENTER_LON','CENTER_LAT','LON','LAT','SIZE_M','system:index'];
				var selectors = columns.getInfo();

				//Parse field names into years and simplified version
				var fromNames;
				var toNames;
				var trainingYears;

				
				function getSelectors(fromYear){
					fromNames = [];
					toNames = [];
					trainingYears = [];

					selectors.map(function(fromName){
						var year;
						if(fromName.indexOf('LAND COVER')> -1 && fromName.indexOf(':')> -1 && fromName.indexOf('m:index') == -1){
							if(fromName.indexOf('LAND COVER:') > -1){
								// alert(fromYear);
								if(fromYear !== null && fromYear !== undefined){

									toName = fromYear+ ' '+fromName.split('LAND COVER:')[1];
									year = fromYear;
									console.log(toName);
								}
								else{toName = null;year = null;}
								
								// year = null;//'2015';
							}else{
								toName = fromName.split('LAND COVER ')[1];
								toName = toName.replace(':',' ');
								year = fromName.split(':')[0];
					  			year = year.split(' ');
					  			year = year[year.length-1];	
							}
							
					  		
						}
					else{
							toName = null;
							fromName = null;
							year = null;
						};
						if(toName !== null){toNames.push(toName)};
						if(fromName !== null){fromNames.push(fromName)};
						if(year !== null && trainingYears.indexOf(year) == -1){trainingYears.push(year)};
					  	
					});
				};

				function getSelectors2(fromYear){
					alert(fromYear)
				}
				getSelectors(null);

				var hasYears = trainingYears.length !== 0;
				var currentYear = new Date().getFullYear();

				if(hasYears){theRest();}
				else{
					function provideYearPlease(){
						$('#yearModal').modal('show');

						$('#yearModal').on('hidden.bs.modal', function () {
							// alert('its hidden');
						 year = $('#modal-year-value').val();
						 var yearInt = parseInt(year);
						 if(yearInt > 1984 && yearInt <= currentYear.toString()){
						 	getSelectors(year);
						 	theRest();
						 }
						 else{
						 	$('#errorModal p').html('<ul>Please provide a valid year (1984-'+currentYear.toString()+')</ul>');
							$('#errorModal').modal('show');
							$('#errorModal').on('hidden.bs.modal',function(){provideYearPlease()});
						 	
						 }
						
						})

						}
					provideYearPlease();
					}
				function theRest(){
				console.log('has years');console.log(hasYears);
				console.log(fromNames);
				console.log(toNames);
				console.log(trainingYears);

				//Select training data with new names
				allTrainingData = allTrainingData.select(fromNames,toNames).map(function(feature){return setToInt(feature,toNames)});

				//Find which fields have dominance and get rid of any that don't have any samples with dom of that field
				// function setDom(feature,names){
				// 	feature = ee.Feature(feature);
				
				// 	var vals = feature.toArray(names).toList();
				// 	var maxVal = vals.reduce(ee.Reducer.max());
				// 	var ind = vals.indexOf(maxVal);
				// 	var dom_cover = ee.String(ee.List(names).get(ind));
				// 	feature = feature.set(classificationField,dom_cover);
				// 	return feature;
				// }
				// function smartSetDom(features){
				// 	var coverData = features.filter(ee.Filter.gte(coverClass,10));
				// 	var nonCoverData = features.filter(ee.Filter.lt(coverClass,10));
				// 	var classes = ee.List(classList);

				// 	// For cover data, set the dominant cover to the cover class
				// 	coverData = coverData.map(function(feature){
				// 		feature = ee.Feature(feature);
				// 		feature = feature.set(classificationField,coverClass);
				// 		return feature;
				// 	});

				// 	// For non-cover data, set the dominant cover to the class with the highest
				// 	// percent cover value
				// 	nonCoverData = nonCoverData.map(function(feature){
				// 		feature = ee.Feature(feature);
				// 		var vals = feature.toArray(classes).toList();
				// 		var maxVal = vals.reduce(ee.Reducer.max());
				// 		var ind = vals.indexOf(maxVal);
				// 		var dom_cover = ee.String(classes.get(ind));
				// 		feature = feature.set(classificationField,dom_cover);
				// 		return feature;
				// 	});
				// }

				
				
				
				// fieldsWithValues = [];

				// trainingYears.map(function(yr){
				// 	var tempFields = [];
				// 	toNames.map(function(tn){if(tn.indexOf(yr) > -1){tempFields.push(tn)}});
				// 	console.log(tempFields);
				// 	var allTrainingDataT = allTrainingData.filter(ee.Filter.lt('LIVE TREE',10)).map(function(feature){return setDom(feature,tempFields)});
				// 	console.log(allTrainingDataT.getInfo());
				// 	ee.Dictionary(allTrainingDataT.aggregate_histogram(classificationField)).keys().getInfo().map(function(i){fieldsWithValues.push(i)});
				// // allTrainingData = allTrainingData.select(fieldsWithValues)
				// });

				yearNameDict = {};
				trainingYears.map(function(yr){
					var yearListFrom = [];
					var yearListTo = [];
					toNames.map(function(tn){
						if(tn.indexOf(yr) > -1){
							var tnT = tn.split(yr+' ');
							tnT = tnT[tnT.length-1];
							yearListFrom.push(tn);
							yearListTo.push(tnT);
						}
					})
					yearNameDict[yr] = [yearListFrom,yearListTo];
				})

				console.log(yearNameDict);
				
				var trainingYearSeq = Array.apply(null, {length: trainingYears.length}).map(Function.call, Number);
				
				trainingYearSeq.map(function(i){
					var opt = document.createElement('option');
					opt.text = trainingYears[i];
					opt.value = trainingYears[i];
					trainingYearSelect.get(0).add(opt, null);
				});

				function updateClassList(){
					var yearSelected = $('.trainingYearSelect option:selected').text();
					classList =yearNameDict[yearSelected][1];
					var classListFrom =yearNameDict[yearSelected][0];
					// console.log(classListFrom);
					// console.log(classList);
					trainingData = allTrainingData.select(classListFrom,classList);
					// trainingData = trainingData.map(function(feature){return setToInt(feature,classList)});
					// console.log(trainingData.getInfo());
					coverClassSelect.empty();
					var classListSeq = Array.apply(null, {length: classList.length}).map(Function.call, Number);
					classListSeq.map(function(i){
						var opt = document.createElement('option');
						opt.text = classList[i];
						opt.value = classList[i];
						coverClassSelect.get(0).add(opt, null);
					});

					//Set to LIVE TREE if available
					if(classList.indexOf('LIVE TREE') > -1){$(".coverClassSelect").val('LIVE TREE');}
					else if(classList.indexOf('FOREST') > -1){$(".coverClassSelect").val('FOREST');}

					coverClass = $('.coverClassSelect option:selected').text();

					percentCoverField = coverClass;

					var coverClassIndex = classList.indexOf(coverClass);
					if (nBreaks == 2){
						var canopyBreaksPlus = [parseInt(canopyBreaks[0]) + 1, parseInt(canopyBreaks[1]) + 1];
						var fullClassList = classList.slice(0,coverClassIndex).concat(
							coverClass + ' 0-' + canopyBreaks[0] + '% CC', 
							coverClass + ' ' + canopyBreaksPlus[0] + '-' + canopyBreaks[1] + '% CC', 
							coverClass + ' ' + canopyBreaksPlus[1] + '-100% CC',
							classList.slice(coverClassIndex+1,classList.length)
						);
					} else if (nBreaks == 3){
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
				function updateColorPairs(){
					$('#class-color-pairs').empty();
					coverClass = $('.coverClassSelect option:selected').text();
					percentCoverField = coverClass;
					var coverClassIndex = classList.indexOf(coverClass);
					if (nBreaks == 2){
						var canopyBreaksPlus = [parseInt(canopyBreaks[0]) + 1, parseInt(canopyBreaks[1]) + 1];
						var fullClassList = classList.slice(0,coverClassIndex).concat(
							coverClass + ' 0-' + canopyBreaks[0] + '% CC', 
							coverClass + ' ' + canopyBreaksPlus[0] + '-' + canopyBreaks[1] + '% CC', 
							coverClass + ' ' + canopyBreaksPlus[1] + '-100% CC',
							classList.slice(coverClassIndex+1,classList.length)
						);
					} else if (nBreaks == 3){
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
				updateClassList();
				updateColorPairs();
				$('.trainingYearSelect').change(function(){updateClassList();updateColorPairs()});

				// // Set the cover class to cached value if available
				// // if (input_settings[input_settings.trainingDataFTID] != undefined){
				// // 	if (input_settings[input_settings.trainingDataFTID]['coverClassVal'] != undefined){
				// // 		$('.coverClassSelect').val(input_settings[input_settings.trainingDataFTID]['coverClassVal']);
				// // 	}
				// // }
				

				// If the cover class changes, replace the colors
				$('.coverClassSelect').change(function(){updateColorPairs()});

				// Display the visualization input group
				$('#class-color-pre').hide();
				$('#class-color').show()

				// Update cache
				// if(typeof(Storage) == "undefined") {
				// 	return;
				// } else {
				// 	input_settings.trainingDataFTID = trainingDataFusionTableID.value;
				// 	if (input_settings[input_settings.trainingDataFTID] == undefined) {
				// 		input_settings[input_settings.trainingDataFTID] = {};
				// 	}
				// 	localStorage.setItem("input_settings",JSON.stringify(input_settings));
				// }

			}} else {
				trainingData = undefined;
			}
			$('#gearSpinner').hide();
			})
		}, 50);

	}); // End training data load

	// On clicking the study area show/hide button
	$('#trainingDataShowHideButton').click(function(){
		if (trainingDataLayer != undefined) {
			if (trainingDataVisible){
				trainingDataLayer.setMap(null);
				trainingDataVisible = false;
			} else {
				trainingDataLayer.setMap(map1);
				trainingDataVisible = true;
			}
		}
	});

	// On clicking the Run button
	$('#runButton').click(function(){
		$('#gearSpinner').show();
		// $('.progress').show();
		setTimeout(function(){
			// Get current inputs and check for errors
			if (trainingData == undefined){
				validInputs *= 0;
				errorString += '<li>Training data is undefined. Please load a valid .csv training dataset.</li>';
			} else if (isNaN(trainingData.first().get(percentCoverField).getInfo())){
				validInputs *= 0;
				errorString += '<li>The percent cover field contains entries with non-numeric values. Please select a field that contains percentages between 0 and 100.</li>';
			}
			// Define study area
			if (geometryPolygon != undefined){
				// Convert polygon to Earth Engine geometry if it is at least a triangle
				if (geometryPolygon.getPath().g.length > 2){
					studyAreaDrawn = convertPathtoGeometry(geometryPolygon);
				}
			}
			if (studyArea == undefined){
				if (studyAreaDrawn != undefined){
					studyArea = studyAreaDrawn;
				} else {
					validInputs *= 0;
					errorString += '<li>Study area is undefined. Please either (1) load a valid study area .zip zipped .shp, .geoJSON, or (2) draw a geometry with at least three points.</li>';
				}
			}

			trainingYear = parseInt($('.trainingYearSelect option:selected').text());
			comparisonYear = parseInt(comparisonYearSlider.value);
			if (comparisonYear == trainingYear){
				validInputs *= 0;
				errorString += '<li>Training year must be different from comparison year.</li>';
			}

			startJulian = parseInt(startDate.value);
			endJulian = parseInt(endDate.value);
			if (startJulian == endJulian){
				validInputs *= 0;
				errorString += '<li>Start date must be different from end date.</li>';
			}

			gainPercentile = parseInt(gainLossPercentiles[0]);
			lossPercentile = parseInt(gainLossPercentiles[1]);
			if (gainPercentile == lossPercentile){
				validInputs *= 0;
				errorString += '<li>Gain and loss percentiles must be different.</li>';
			}

			canopyBreaks = [parseInt(canopyBreaks[0]),parseInt(canopyBreaks[1]), parseInt(canopyBreaks[2])];
			if ((canopyBreaks[0] == canopyBreaks[1]) || (canopyBreaks[1] == canopyBreaks[2]) || (canopyBreaks[0] == canopyBreaks[2])){
				validInputs *= 0;
				errorString += '<li>Canopy breaks must be different.</li>';
			}

			if (possibleSensors.length == 0){
				validInput *= 0;
				errorString += '<li>Must include at least one sensor.</li>';
			}

			// ADD CHECKS FOR POSSIBLE SENSOR BASED ON AVAILABLE YEARS OF IMAGERY
			studyName = studyAreaName.value;
			bufferDistance = parseInt(compositeBuffer.value);
			yearsOfImagery = parseInt($('input[name=yearsOfImagery]').val());
			cloudThresh = parseInt(cloudThreshold.value);
			reducerPercentile = parseInt(compositePercentile.value);
			crsValue = 'EPSG:4326';
			if (epsgNumber.value != ''){
				// If the crs is not a number, throw error
				if(isNaN(parseInt(epsgNumber.value))){
					validInputs *= 0;
					errorString += '<li>EPSG number must be set to a number or left blank, in which case it will be set to 4326 (Web Mercator).</li>'
				} else {
					crsValue = 'EPSG:' + epsgNumber.value;
				}
			}
			whichIndex = $("input[name='optradio']:checked").val();
			
			nTrees = parseInt(rfTrees.value);
			reducerScale = parseInt(reducerScaleSlider.value);
			
			TS = parseInt($('input[name=tileScale]').val());

			if (validInputs){
				// Update cache
				if(typeof(Storage) == "undefined") {
					return;
				} else {
					input_settings.trainingYearVal = $('.trainingYearSelect option:selected').text();
					input_settings.canopyBreaksVal = canopyBreaks;
					input_settings.studyAreaNameVal = studyAreaName.value;
					input_settings.startDateVal = startDate.value;
					input_settings.endDateVal = endDate.value;
					input_settings.comparisonYearVal = comparisonYearSlider.value;
					if (input_settings.sensorCheckboxVals == undefined){
						input_settings.sensorCheckboxVals = {};
					}
					$("input[name='optcheck']:checkbox").each(function(){
						input_settings.sensorCheckboxVals[this.id] = this.checked;
					});
					if (input_settings.changeIndexVals == undefined){
						input_settings.changeIndexVals = {};
					}
					$("input[name='optradio']:radio").each(function(){
						input_settings.changeIndexVals[this.id] = this.checked;
					});
					input_settings.gainLossPercentilesVal = gainLossPercentiles;
					if (input_settings.mapArrangeVal == undefined){
						input_settings.mapArrangeVal = {};
					}
					$("input[name='mapradio']:radio").each(function(){
						input_settings.mapArrangeVal[this.id] = this.checked;
					});
					if (input_settings.compVizVals == undefined){
						input_settings.compVizVals = {};
					}
					$("input[name='bandradio']:radio").each(function(){
						input_settings.compVizVals[this.id] = this.checked;
					});
					input_settings.yearsOfImageryVal = $('input[name=yearsOfImagery]').val();
					input_settings.cloudThresholdVal = cloudThreshold.value;
					input_settings.compositeBufferVal = compositeBuffer.value;
					input_settings.compositePercentileVal = compositePercentile.value;
					input_settings.rfTreesVal = rfTrees.value;
					input_settings.reducerScaleVal = reducerScaleSlider.value;
					input_settings.tileScaleVal = $('input[name=tileScale]').val();
					input_settings.epsgVal = epsgNumber.value;

					input_settings['colorListVal'] = colorList;
					input_settings['coverClassVal'] = coverClass;
					localStorage.setItem("input_settings",JSON.stringify(input_settings));
				}

				// If re-running, reset map, outputs, and dropdowns
				if (runStatus == 1){
					// Clear outputs
					$('#gainThresholdOut').remove();
					$('#lossThresholdOut').remove();
					$('#rfModelAccuracyOut').remove();
					$('#rfModelKappaOut').remove();
					$('#lmRMSEOut').remove();
					$('#lmR2Out').remove();
					$('#histogram-panel-post').hide();
					$('#accuracy-panel-post').hide();

					// Clear layers
					Object.keys(layerStructure).map(function(key){
						var currentMap = layerStructure[key].map;
						var currentLayerID = layerStructure[key].layerID;
						currentMap.overlayMapTypes.setAt(currentLayerID,null);
					});

					// Reset structure
					layerStructure = {};
					layerID = 1;
					validInputs = 1;
					errorString = '';
					exportStructure = {};
					export_settings = {};
					chartSuccess = 0;
					tableSuccess = 0;

					// Clear dropdown menus and exports
					$('#dropdown-menu-left').empty();
					$('#dropdown-menu-right').empty();
					$('#export-manager').empty()
				}

				// RUN EARTH ENGINE CODE
				console.log('Running EE Code');
				startRunTime = new Date();
				runEECode();

				// Display the second map
				// Left-right
				if (mapArrangeVal == '0'){
					$('#map1').css("width", "50%");
				// Top-bottom
				} else if (mapArrangeVal == '1'){
					$('#map1').css("height", "50%");
				}
				$('#map2').show();
				var currentCenter = map1.getCenter()
				google.maps.event.trigger(map1, 'resize');
				google.maps.event.trigger(map2, 'resize');
				map1.setCenter(currentCenter);
				map2.setCenter(currentCenter);
				$('#leftLayerSelect').show();
				$('#rightLayerSelect').show();

				// Display new output divs
				$('.nav-tabs a[href="#outputs"]').tab('show');
				$('#histogram-panel-pre').hide();
				$('#accuracy-panel-pre').hide();
				$('#exports-panel-pre').hide();
				
				// Add output buttons
				$('#showConfMatButton').click(function(){
					$('#confMatModal').modal('show');
				});

				$('#refreshVizButton').show();

				// Add chart
				chartSuccess  = 0;
				setTimeout(function(){
					createChart();
				}, 50);

				// Add table
				tableSuccess  = 0;
				setTimeout(function(){
					createTable();
				}, 50);

				// Create Layers
				createLayers();

				// Create Exports
				console.log('Adding exports');
				exportLayers();
				$('#exports-panel-post').show();

				// Indicate that the Run button has now been clicked at least once
				runStatus = 1;
			}
			else {
				$('#errorModal p').html('<ul>' + errorString + '</ul>');
				$('#errorModal').modal('show');
				validInputs = 1;
				errorString = '';
			}
			$('#gearSpinner').hide();
			// $('.progress').hide();
		}, 50);

	}); // End Run button

	// On clicking the "Reset All" button
	$('#inputsResetButton').click(function(){
		// Clear the input settings from cache
		if (typeof(Storage) !== "undefined"){
			delete localStorage['input_settings'];
			input_settings = {};
			localStorage.setItem("input_settings",JSON.stringify(input_settings));
		}
		// Reload the page
		window.location.reload(true);
	});

	// On clicking the "Update Layers" button
	$('#refreshVizButton').click(function(){
		$('#gearSpinner').show();
		setTimeout(function(){
			// Update visualization settings in cache
			if (input_settings.mapArrangeVal == undefined){
				input_settings.mapArrangeVal = {};
			}
			$("input[name='mapradio']:radio").each(function(){
				input_settings.mapArrangeVal[this.id] = this.checked;
			});
			if (input_settings.compVizVals == undefined){
				input_settings.compVizVals = {};
			}
			$("input[name='bandradio']:radio").each(function(){
				input_settings.compVizVals[this.id] = this.checked;
			});
			localStorage.setItem("input_settings",JSON.stringify(input_settings));

			// Refresh layers
			refreshLayers();
			$('#gearSpinner').hide();
		}, 50);
	});
};

////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

// For date sliders to pad the digits
function padDigits(number, digits) {
	return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

// For date sliders to convert day of the year to month/day
function dateFromDay(day){
	var date = new Date(2005, 0); // initialize a date in `year-01-01`
	date = new Date(date.setDate(day)); // add the number of days
	var mm = date.getMonth()+1; // get the month
	var dd = date.getDate(); // get the date
	return mm.toString().concat('/',padDigits(dd,2)); // combine month/day with leading zeros
}
//Function to fix geoJSON from CEO that does not have a lon and lat field.
//Hard coded to look for CENTER_LON and CENTER_LAT
//Change if CEO changes its export format in the future
function fixGeoJSON(f){
  f.features = f.features.map(function(f){
    f.geometry = {type:'Point',coordinates:[parseFloat(f.properties.CENTER_LON),parseFloat(f.properties.CENTER_LAT)]};
    return f;
  });
  f.crs ={"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}};
  console.log(f);
  return f
}
function fixGeoJSONZ(f){
	console.log('getting rid of z');
	f.features = f.features.map(function(f){
    f.geometry.coordinates = f.geometry.coordinates.map(function(c){
    															return c.map(function(i){
    																return i.slice(0,2)})
																		});
    return f;
  });
	console.log(f);

	return f
}
// Parse Fusion Table ID, Asset ID, or geoJSON
function parseFT(ID_string){
//
	var data;
	if(ID_string.indexOf(',') == -1){
		console.log('Its an asset!');
		data = ee.FeatureCollection(ID_string);
		}
	else{
		console.log('Its geojson!');
		ID_string = JSON.parse(ID_string);

		

		//First try assuming the geoJSON has spatial info
		try{
			data =ee.FeatureCollection(ID_string.features.map(function(t){return ee.Feature(t).dissolve(100,ee.Projection('EPSG:4326'))}));
		} 
		//Fix it if not
		catch(err){
			err = err.toString();
			console.log('Error');console.log(err);
			if(err.indexOf('Error: Invalid GeoJSON geometry:') > -1){
				data =ee.FeatureCollection(fixGeoJSONZ(ID_string).features.map(function(t){return ee.Feature(t).dissolve(100,ee.Projection('EPSG:4326'))}))	
			}
			else{
				data =ee.FeatureCollection(fixGeoJSON(ID_string).features.map(function(t){return ee.Feature(t).dissolve(100,ee.Projection('EPSG:4326'))}));
			}
			
		};
		
		};
	// var full_ID_string = 'ft:'.concat(ID_string);
	
	return data;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Functions to generate a list of random hex colors
function rgbToHex(r,g,b) {
	// return "#"+("00000"+(r<<16|g<<8|b).toString(16)).slice(-6);
	return ("00000"+(r<<16|g<<8|b).toString(16)).slice(-6);
}
function randomColor(){
	var r = getRandomInt(100, 255);
	var g = getRandomInt(100, 255);
	var b = getRandomInt(100, 255);
	var c = rgbToHex(r,g,b);
	return c;
}
function randomColors(n){
	var out = [];
	while (n > 0){
		out.push(randomColor());
		n = n - 1;
	}
	return out
}

// Function to convert HSV to RGB
function HSVtoRGB(h, s, v) {
	h = h/360;
	s = s/100;
	v = v/100;
	var r, g, b, i, f, p, q, t;
	if (arguments.length === 1) {
		s = h.s, v = h.v, h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

// Function to convert rgb string to hex string
function rgb2hex(rgb) {
	rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	function hex(x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	}
	return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function centerObject(fc,map){
	try{
		var feature = fc.geometry().bounds().getInfo();
		var bounds = new google.maps.LatLngBounds(); 
		
		feature.coordinates[0].map(function(latlng){
		 bounds.extend({lng:latlng[0], lat:latlng[1]});
		});

		map.fitBounds(bounds);
		return true;	
	}
	catch(err){
		// alert('Bad Fusion Table');
		$('#errorModal p').text(err);
		$('#errorModal').modal('show');
		console.log(err);
		return false;
	}
	
}
// Function to center feature collection on map and check the 
// validity of the collection
// function centerObject(fc,map,id){
// 	var bounds = fc.geometry().bounds();
// 	try{
// 		var center = bounds.centroid(1000).getInfo().coordinates;
// 		map.setCenter({lng:center[0],lat:center[1]});
// 		// map.setZoom(zoom);
// 		return true;
// 	}
// 	catch(err){
// 		// alert('Bad Fusion Table');
// 		var errText = 'Table ID: \'' + id + '\' is either invalid or has not been shared.';
// 		$('#errorModal p').text(errText);
// 		$('#errorModal').modal('show');
// 		console.log(err);
// 		return false;
// 	}
// }

// Function to convert the hand drawn path into an EE polygon
function convertPathtoGeometry(polygon){
	var coordinates = polygon.getPath().g;
	var coordinatesList = coordinates.map(function(coord){
		return [coord.lng(),coord.lat()];
	});
	return ee.Geometry.Polygon(coordinatesList);
}

// Function to create the class-color pair div with color pickers and labels.
// Input is a sequence from 0 to n-1, where n is the number of classes.
function createClassColorPairs(fullClassListSeq, fullClassList){
	// Get cached color list if available
	var cachedColors = true;
	if (input_settings != undefined){
		if (input_settings['colorListVal'] != undefined) {
			colorList = input_settings['colorListVal'];
		} else {
			cachedColors = false;
		}
	} else {
		cachedColors = false;
	}
	fullClassListSeq.map(function(i){
		// For each class, create a color picker and label
		var currentClass = fullClassList[i];
		var i1 = i + 1;
		var newdiv = $('<div class="color-group"></div>');
		var newinput = document.createElement('INPUT');
		var newcontent = '<h5>' + i1 + ' ' + currentClass + '</h5>';
		var picker = new jscolor(newinput);

		// Set the initial color to cached values if available
		if (cachedColors){
			picker.fromString(colorList[i])
			
		// Otherwise, set the initial color to the next color in the rainbow
		} else {
			picker.fromHSV(360 / fullClassList.length * i, 75, 85)
			var rgbString = HSVtoRGB(360 / fullClassList.length * i, 75, 85);
			// Add the color to the list
			colorList[i] = rgbToHex(rgbString.r, rgbString.g, rgbString.b);
		}

		newinput.setAttribute('id','color-' + i);
		newinput.setAttribute('class','jscolor');
		// Add the new color picker and label to the div
		newdiv.append(newinput);
		newdiv.append(newcontent);
		$('#class-color-pairs').append(newdiv);
		// If the color changes, update the color list
		$('#color-' + i).change(function(){
			var newcolor = $(this).css('background-color');
			colorList[i] = rgb2hex(newcolor);
		})
	});
}