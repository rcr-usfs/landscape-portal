//Landsat Composite with cloud masking- 7/5/15 
////////////////////////////////////////////////////////////////////////////////
//Written by: Ian Housman
//Modified by: Karis Tenneson, Carl Albury, and Joshua Goldstein
//RedCastle Resources Inc., RSAC USFS
////////////////////////////////////////////////////////////////////////////////
// Description:
// This script creates a 2 composites of Landsat imagery over user specified intervals for a user
// specified geographic area and creates an 8-class land-cover map for each.
////////////////////////////////////////////////////////////////////////////////

function runEECode(){
	////////////////////////////////////////////////////////////////////////////////
	// Globals
	////////////////////////////////////////////////////////////////////////////////
	var nBreaks = canopyBreaks.length;
	// ee.List(ee.Dictionary(trainingData.aggregate_histogram(classificationField)).keys()).evaluate(function(v){console.log('pre');console.log(v)});
	if(startJulian > endJulian){endJulian = endJulian + 365}
	var reducer = ee.Reducer.percentile([reducerPercentile]); // Reducer for compositing
	
	// Convert training data from percent cover to dominant cover
	var coverData = trainingData.filter(ee.Filter.gte(coverClass,10));
	var nonCoverData = trainingData.filter(ee.Filter.lt(coverClass,10));
	var classes = ee.List(classList);

	// For cover data, set the dominant cover to the cover class
	coverData = coverData.map(function(feature){
		feature = ee.Feature(feature);
		feature = feature.set(classificationField,coverClass);
		return feature;
	});

	// For non-cover data, set the dominant cover to the class with the highest
	// percent cover value
	nonCoverData = nonCoverData.map(function(feature){
		feature = ee.Feature(feature);
		var vals = feature.toArray(classes).toList();
		var maxVal = vals.reduce(ee.Reducer.max());
		var ind = vals.indexOf(maxVal);
		var dom_cover = ee.String(classes.get(ind));
		feature = feature.set(classificationField,dom_cover);
		return feature;
	});
	// console.log(coverData.size().getInfo());
	// console.log(nonCoverData.size().getInfo());
	// Merge the data
	trainingData = coverData.merge(nonCoverData);
	// classes = ee.List(ee.Dictionary(trainingData.aggregate_histogram(classificationField)).keys());
	// classList = classes.getInfo();
	// updateColorPairs();
	// Union training data area and study area for composites
	compositeArea = trainingData.geometry().buffer(bufferDistance).bounds()
		.union(studyArea.bounds(), ee.ErrorMargin(1));

	////////////////////////////////////////////////////////////////////////////////
	// band names
	var bandNames = ee.List(['blue','green','red','nir','swir1','temp','swir2']);
	var bandNumbers = [0,1,2,3,4,5,6];
		
	////////////////////////////////////////////////////////////////////////////////
	// Make composites
	var imageList = getImages(trainingYear,comparisonYear,yearsOfImagery,startJulian,endJulian);
	var trainingComposite = ee.Image(imageList[0]);
	var comparisonComposite = ee.Image(imageList[1]);
	var compositeBands = trainingComposite.bandNames();
	var droplist = ['p50SAVI'];

	// Determine pre and post years and composites
	if (trainingYear < comparisonYear){
		preComposite = trainingComposite;
		postComposite = comparisonComposite;
		preYear = trainingYear;
		postYear = comparisonYear;
	} else if (trainingYear > comparisonYear){
		preComposite = comparisonComposite;
		postComposite = trainingComposite;
		preYear = comparisonYear;
		postYear = trainingYear;
	} else {
		alert('Note: \ntraining year must be different from comparison year\n\n');
		throw('Note: \ntraining year must be different from comparison year');
	}
	////////////////////////////////////////////////////////////////////////////////
	//make difference image:
	if (whichIndex.toLowerCase() == 'dnbr'  ){
		var diffImage = difference_function(preComposite,postComposite, 'p50NBR'); 
	}
	else if (whichIndex.toLowerCase()== 'dndvi'){
		var diffImage = difference_function(preComposite,postComposite, 'p50NDVI');
	}
	else if (whichIndex.toLowerCase() == 'dsavi'){
		var diffImage = difference_function(preComposite,postComposite, 'p50SAVI');
	}
	else if (whichIndex.toLowerCase() == 'rdnbr'){
		var diffImage = rdnbr_function(preComposite,postComposite);
	}

	var thresholds = diffImage.reduceRegion(ee.Reducer.percentile([gainPercentile,lossPercentile]),compositeArea,300);
	var lossKey = ee.String(whichIndex).cat('_p').cat(lossPercentile.toString());
	var gainKey = ee.String(whichIndex).cat('_p').cat(gainPercentile.toString());
	lossThreshold = ee.Number(thresholds.get(lossKey)).int();
	gainThreshold =  ee.Number(thresholds.get(gainKey)).int();

	diffThematic = diffImage.where(diffImage.lte(gainThreshold),0)
		.where(diffImage.gt(gainThreshold).and(diffImage.lte(lossThreshold)),1)
		.where(diffImage.gt(lossThreshold),2);
	changeMask = ee.Image(1).updateMask(diffThematic.eq(1)).clip(studyArea);

	////////////////////////////////////////////////////////////////////////////////
	// Make difference image histogram
	var chartThresholds = diffImage.reduceRegion(ee.Reducer.percentile([1,99]),compositeArea,300);
	var minKey = ee.String(whichIndex).cat('_p1');
	var maxKey = ee.String(whichIndex).cat('_p99');
	minVal = ee.Number(chartThresholds.get(minKey)).int();
	maxVal =  ee.Number(chartThresholds.get(maxKey)).int();
	var diffHistogram = diffImage.reduceRegion(ee.Reducer.histogram(),compositeArea, 300);
	var chartDataX = ee.List(ee.Dictionary(diffHistogram.get(whichIndex)).get('bucketMeans'));
	var chartDataY = ee.List(ee.Dictionary(diffHistogram.get(whichIndex)).get('histogram'));
	chartData = chartDataX.zip(chartDataY).insert(0,[whichIndex,'Frequency']);
	chartObj = ee.Dictionary({
		'minVal': minVal,
		'maxVal': maxVal,
		'lossThreshold': lossThreshold,
		'gainThreshold': gainThreshold,
		'chartData': chartData
	});

	////////////////////////////////////////////////////////////////////////////////
	// Remap training data class names to numbers and prepare the raster remap sequences
	trainingData = namesToNumbers(trainingData,classificationField,classNumbersField,classList);
	
	var coverClassIndex = classList.indexOf(coverClass);
	var oldSeq = ee.List.sequence(0,classList.length-1);
	var newSeqA = ee.List.sequence(0,coverClassIndex);
	var newSeqB = ee.List.sequence(coverClassIndex + nBreaks + 1, null, null, ee.Number(classList.length).subtract(newSeqA.length()));
	var newSeq = newSeqA.cat(newSeqB);

	
	////////////////////////////////////////////////////////////////////////////////
	// Perform random forest classification
	// Build classifier
	var rfTrainingData = trainingComposite.reduceRegions({
		collection: trainingData, 
		reducer: ee.Reducer.mean(), 
		scale: reducerScale,
		tileScale: TS
	});
	
	console.log('Running classification model');
	var rfClassifier = ee.Classifier.randomForest(nTrees, 0, 1, 0.5, true, 0)
		.train(rfTrainingData, classNumbersField, compositeBands.removeAll(droplist));
	rfModelConfusion = rfClassifier.confusionMatrix();
	console.log('Finished running classification model');
	// console.log(rfTrainingData.getInfo());
	// console.log(rfModelConfusion.getInfo());

	rfModelAccuracy = rfModelConfusion.accuracy();
	rfModelConsumersAccuracy = rfModelConfusion.consumersAccuracy();
	rfModelProducersAccuracy = rfModelConfusion.producersAccuracy();
	rfModelKappa = rfModelConfusion.kappa();

	// Classify Pre
	var preClipComposite = preComposite.clip(studyArea);
	preClassified = preClipComposite.classify(rfClassifier).remap(oldSeq,newSeq);

	// Classify Post
	var postClipComposite = postComposite.clip(studyArea);
	var postClassified = postClipComposite.classify(rfClassifier).remap(oldSeq,newSeq);

	////////////////////////////////////////////////////////////////////////////////
	// Perform linear regression on forest canopy cover
	var lmTrainingData = rfTrainingData.filter(ee.Filter.eq(classificationField, coverClass));

	// Add column 'constant'
	lmTrainingData = lmTrainingData.map(function(feature){
		feature = ee.Feature(feature);
		feature = feature.set('constant',1);
		return feature;
	});

	// Get list of independent and dependent variables
	var independents = ee.List(compositeBands.removeAll(droplist)).cat(['constant']);
	var numX = independents.length();
	var dependent = percentCoverField;
	var numY = 1;
	var selectors = independents.cat(ee.List([dependent]));

	// Run linear regression model
	var constantBand = ee.Image(1).clip(studyArea).rename('constant');
	var lm = lmTrainingData.reduceColumns(ee.Reducer.linearRegression(numX,numY),selectors);
	var coefficients = ee.Array(lm.get('coefficients'))
		.project([0]);
	var p = numX.subtract(1);

	// Regression Pre
	var preRegression = preClipComposite.select(compositeBands.removeAll(droplist)).addBands(constantBand)
		.multiply(ee.Image.constant(coefficients.toList()))
		.reduce(ee.Reducer.sum());

	if (nBreaks == 2){
		var preRegressionThematic = preRegression.where(preRegression.gt(canopyBreaks[1]), coverClassIndex + 2)
			.where(preRegression.lte(canopyBreaks[1]).and(preRegression.gt(canopyBreaks[0])), coverClassIndex + 1)
			.where(preRegression.lte(canopyBreaks[0]),coverClassIndex);
	} else if (nBreaks == 3){
		var preRegressionThematic = preRegression.where(preRegression.gt(canopyBreaks[2]), coverClassIndex + 3)
			.where(preRegression.lte(canopyBreaks[2]).and(preRegression.gt(canopyBreaks[1])), coverClassIndex + 2)
			.where(preRegression.lte(canopyBreaks[1]).and(preRegression.gt(canopyBreaks[0])), coverClassIndex + 1)
			.where(preRegression.lte(canopyBreaks[0]),coverClassIndex);
	}

	preClassified = preClassified.where(preClassified.eq(coverClassIndex),preRegressionThematic)
		.rename('classification');

	// Regression Post
	var postRegression = postClipComposite.select(compositeBands.removeAll(droplist)).addBands(constantBand)
		.multiply(ee.Image.constant(coefficients.toList()))
		.reduce(ee.Reducer.sum());

	if (nBreaks == 2){
		var postRegressionThematic = postRegression.where(postRegression.gt(canopyBreaks[1]), coverClassIndex + 2)
			.where(postRegression.lte(canopyBreaks[1]).and(postRegression.gt(canopyBreaks[0])), coverClassIndex + 1)
			.where(postRegression.lte(canopyBreaks[0]),coverClassIndex);
	} else if (nBreaks == 3){
		var postRegressionThematic = postRegression.where(postRegression.gt(canopyBreaks[2]), coverClassIndex + 3)
			.where(postRegression.lte(canopyBreaks[2]).and(postRegression.gt(canopyBreaks[1])), coverClassIndex + 2)
			.where(postRegression.lte(canopyBreaks[1]).and(postRegression.gt(canopyBreaks[0])), coverClassIndex + 1)
			.where(postRegression.lte(canopyBreaks[0]),coverClassIndex);
	}

	postClassified = postClassified.where(postClassified.eq(coverClassIndex),postRegressionThematic)
		.rename('classification');

	// Here we create two images based on the diffThematic; 1) the preClassified 
	// with only those areas that DID NOT change and 2) the postClassified with only 
	// those areas that did change. Those to pieces are assembled in to the 
	// 'prePostClassDiff'. 
	// var preClassifiedMasked = preClassified.updateMask(diffThematic.lt(2));
	// var postClassifiedMasked = postClassified.updateMask(diffThematic.gte(2));
	var preClassifiedMasked = preClassified.updateMask(diffThematic.eq(1));
	var postClassifiedMasked = postClassified.updateMask(diffThematic.neq(1));
	prePostClassified = ee.ImageCollection([preClassifiedMasked,postClassifiedMasked]).mosaic();
	changeClassification = ee.Image(1).updateMask(preClassified.eq(prePostClassified)).clip(studyArea);
	// var prePostClassDiff = prePostClassified.neq(preClassified);

	////////////////////////////////////////////////////////////////////////////////
	// Accuracy
	if (trainingYear < comparisonYear){
		var sampleClassification = preClassified;
		var sampleRegression = preRegression;
	} else if (trainingYear > comparisonYear){
		var sampleClassification = prePostClassified;
		var sampleRegression = postRegression;
	} else {
		alert('Note: \ntraining year must be different from comparison year\n\n');
		throw('Note: \ntraining year must be different from comparison year');
	}

	var regressionData = sampleRegression.reduceRegions({
		collection: lmTrainingData,
		reducer: ee.Reducer.mean(), 
		scale: reducerScale,
		tileScale: TS
	}).filterBounds(studyArea);

	RMSE = RegressionRMSE(regressionData,percentCoverField,'mean');
	R2 = RegressionAdjustedR2(regressionData,percentCoverField,'mean',p);

	tableObj = ee.Dictionary({
		'rfModelConfusion': rfModelConfusion,
		'rfModelAccuracy': rfModelAccuracy,
		'rfModelConsumersAccuracy': rfModelConsumersAccuracy,
		'rfModelProducersAccuracy': rfModelProducersAccuracy,
		'rfModelKappa': rfModelKappa,
		'RMSE': RMSE,
		'R2': R2
	});

	////////////////////////////////////////////////////////////////////////////////
	// FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////


	// Function to create a composite image
	function getImages(y1,y2,yearsOfImagery,startJulian,endJulian){
		// Cloud-masking variables
		var contractPixels = 1;
		var dilatePixels = 2;
		var zScoreThresh = -0.8;
		var shadowSumThresh = 0.35;

		// Prepare dates
		if(startJulian > endJulian){endJulian = endJulian + 365}
		yearsOfImagery = ee.Number(yearsOfImagery);
		var startYear1 = ee.Number(y1).add(1).subtract((yearsOfImagery.divide(2)).ceil());
		var endYear1 = ee.Number(y1).add((yearsOfImagery.divide(2)).floor());
		var startDate1 = ee.Date.fromYMD(startYear1,1,1).advance(startJulian-1,'day');
		var endDate1 = ee.Date.fromYMD(endYear1,1,1).advance(endJulian-1,'day');

		var startYear2 = ee.Number(y2).add(1).subtract((yearsOfImagery.divide(2)).ceil());
		var endYear2 = ee.Number(y2).add((yearsOfImagery.divide(2)).floor());
		var startDate2 = ee.Date.fromYMD(startYear2,1,1).advance(startJulian-1,'day');
		var endDate2 = ee.Date.fromYMD(endYear2,1,1).advance(endJulian-1,'day');

		// Get Landsat 5, 7, 8 Image Collections
		var ls1 = getImageCollection(compositeArea,startDate1,endDate1,startJulian,endJulian);
		var ls2 = getImageCollection(compositeArea,startDate2,endDate2,startJulian,endJulian);

		// Combine collections
		var ls = ee.ImageCollection(ls1.merge(ls2));

		// Compute a cloud score and mask clouds
		ls = ls.map(function(img){
		return landsatCloudScore(img,contractPixels,dilatePixels);
		});

		// Find and mask out dark outliers
		ls = simpleTDOM2(ls,zScoreThresh,shadowSumThresh,contractPixels,dilatePixels);

		// Add indices (NDVI, NBR, SAVI)
		ls = ls.map(addIndices);

		// Split collections
		ls1 = ls.filterDate(startDate1,endDate1);
		ls2 = ls.filterDate(startDate2,endDate2);

		var composite1 = reduceCollection(ls1,reducer,compositeArea);
		var composite2 = reduceCollection(ls2,reducer,compositeArea);

		return [composite1, composite2];
	}

	///////////////////////////////////////////////////////////////////////////////
	// Function for acquiring Landsat TOA image collection
	function getImageCollection(compositeArea,startDate,endDate,startJulian,endJulian){
		var ls;var l4TOAs;var l5TOAs;var l7TOAs;var l8TOAs;
		var metadataCloudCoverMax = 80;
		var sensorBandDictLandsatTOA =ee.Dictionary({L8 : ee.List([1,2,3,4,5,9,6]),
							L7 : ee.List([0,1,2,3,4,5,7]),
							L5 : ee.List([0,1,2,3,4,5,6]),
							L4 : ee.List([0,1,2,3,4,5,6])
		});
		var bandNamesLandsatTOA = ee.List(['blue','green','red','nir','swir1','temp','swir2']);
		if(possibleSensors.indexOf('L4') >= 0){
			l4TOAs = ee.ImageCollection('LANDSAT/LT4_L1T_TOA')
				.filterDate(startDate,endDate)
				.filter(ee.Filter.calendarRange(startJulian,endJulian))
				.filterBounds(compositeArea)
				.filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
				.select(sensorBandDictLandsatTOA.get('L4'),bandNamesLandsatTOA);
			if (ls === undefined){
				ls = l4TOAs;
			} else {
				ls = ls.merge(l4TOAs);
			}
		}

		if(possibleSensors.indexOf('L5') >= 0){
			l5TOAs = ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA')
				.filterDate(startDate,endDate)
				.filter(ee.Filter.calendarRange(startJulian,endJulian))
				.filterBounds(compositeArea)
				.filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
				.select(sensorBandDictLandsatTOA.get('L5'),bandNamesLandsatTOA);
			if (ls === undefined){
				ls = l5TOAs;
			} else {
				ls = ls.merge(l5TOAs);
			}
		}

		if(possibleSensors.indexOf('L7') >= 0){
			l7TOAs = ee.ImageCollection('LANDSAT/LE07/C01/T1_TOA')
				.filterDate(startDate,endDate)
				.filter(ee.Filter.calendarRange(startJulian,endJulian))
				.filterBounds(compositeArea)
				.filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
				.select(sensorBandDictLandsatTOA.get('L7'),bandNamesLandsatTOA);
			if (ls === undefined){
				ls = l7TOAs;
			} else {
				ls = ls.merge(l7TOAs);
			}
		}
		
		if(possibleSensors.indexOf('L8') >= 0){
			l8TOAs = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
				.filterDate(startDate,endDate)
				.filter(ee.Filter.calendarRange(startJulian,endJulian))
				.filterBounds(compositeArea)
				.filterMetadata('CLOUD_COVER','less_than',metadataCloudCoverMax)
				.select(sensorBandDictLandsatTOA.get('L8'),bandNamesLandsatTOA);
			if (ls === undefined){
				ls = l8TOAs;
			} else {
				ls = ls.merge(l8TOAs);
			}
		}
		
		ls = ee.ImageCollection(ls);
		return ls;
	}

	///////////////////////////////////////////////////////////////////////////////
	// A helper to apply an expression and linearly rescale the output.
	// Used in the landsatCloudScore function below.
	function rescale(img, exp, thresholds) {
		return img.expression(exp, {img: img})
			.subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
	}

	///////////////////////////////////////////////////////////////////////////////
	// Compute a cloud score and adds a band that represents the cloud mask.  
	// This expects the input image to have the common band names: 
	// ["red", "blue", etc], so it can work across sensors.
	function landsatCloudScore(img,contractPixels,dilatePixels) {
		// Compute several indicators of cloudiness and take the minimum of them.
		var score = ee.Image(1.0);
		// Clouds are reasonably bright in the blue band.
		score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
		
		// Clouds are reasonably bright in all visible bands.
		score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
		
		// Clouds are reasonably bright in all infrared bands.
		score = score.min(
			rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

		// Clouds are reasonably cool in temperature.
		score = score.min(rescale(img,'img.temp', [300, 290]));

		// However, clouds are not snow.
		var ndsi = img.normalizedDifference(['green', 'swir1']);
		score =  score.min(rescale(ndsi, 'img', [0.8, 0.6])).multiply(100).byte();
		score = score.lt(cloudThresh).rename('cloudMask');
		// score = score.focal_max(contractPixels).focal_min(dilatePixels);
		return img.updateMask(score);
	}

	///////////////////////////////////////////////////////////////////////////////
	// Function for finding dark outliers in time series.
	// Original concept written by Carson Stam and adapted by Ian Housman.
	// Masks pixels that are dark, and dark outliers.
	function simpleTDOM2(collection,zScoreThresh,shadowSumThresh,contractPixels,dilatePixels){
		var shadowSumBands = ['nir','swir1'];
		//Get some pixel-wise stats for the time series
		var irStdDev = collection.select(shadowSumBands).reduce(ee.Reducer.stdDev());
		var irMean = collection.select(shadowSumBands).mean();
		//Mask out dark dark outliers
		collection = collection.map(function(img){
			var zScore = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
			var irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
			var TDOMMask = zScore.lt(zScoreThresh)
				.reduce(ee.Reducer.sum()).eq(shadowSumBands.length)
				.and(irSum.lt(shadowSumThresh));
			// TDOMMask = TDOMMask.focal_min(contractPixels).focal_max(dilatePixels);
			return img.updateMask(TDOMMask.not());
		});
		return collection;
	}

	///////////////////////////////////////////////////////////////////////////////
	//Function to add common spectral indices to an image:
	function addIndices(img){
		// Add Normalized Difference Vegetation Index (NDVI)
		img = img.addBands(img.normalizedDifference(['nir','red']).rename('NDVI'));
		
		// Add Normalized Burn Ratio (NBR)
		img = img.addBands(img.normalizedDifference(['nir','swir2']).rename('NBR'));
		
		// Add Soil Adjust Vegetation Index (SAVI)
		// using L = 0.5;
		var savi = img.expression(
			'(NIR - RED) * (1 + 0.5)/(NIR + RED + 0.5)', {
			'NIR': img.select('nir'),
			'RED': img.select('red')
		}).float();
		img = img.addBands(savi.rename('SAVI'));

		return img;
	}

	///////////////////////////////////////////////////////////////////////////////
	// Function to reduce image collection
	function reduceCollection(collection,reducer,compositeArea){
		// Reduce composite
		var composite = collection.select(bandNumbers,bandNames).reduce(reducer);
		composite = composite.select(bandNumbers,bandNames);
		var NDVI = collection.select('NDVI');    
		var NBR = collection.select('NBR');   
		var SAVI = collection.select('SAVI');  
		var allNDVI = NDVI.reduce(ee.Reducer.percentile([10,50,90]))
			.select(['NDVI_p10','NDVI_p50','NDVI_p90'],['p10NDVI','p50NDVI','p90NDVI']);
		var medNBR = NBR.reduce(ee.Reducer.percentile([50])).select(['NBR_p50'],['p50NBR']);
		var medSAVI = SAVI.reduce(ee.Reducer.percentile([50])).select(['SAVI_p50'],['p50SAVI']);

		composite = composite.addBands(allNDVI);
		composite = composite.addBands(medNBR);
		composite = composite.addBands(medSAVI);

		//Set up the export image and export it
		return composite.select(['blue','green','red','nir','swir1','swir2', 'p10NDVI', 
			'p50NDVI', 'p90NDVI', 'p50NBR', 'p50SAVI']).multiply(10000).round().int16()
		.clip(compositeArea);
	}

	////////////////////////////////////////////////////////////////////////////////
	// Function to calculate dNBR
	function difference_function(i1, i2, index) {
		var idx1 = i1.select(index);
		var idx2 = i2.select(index);
		var diff = idx1.subtract(idx2);
		var diffIdx = 'd' +  index.replace('p50','');
		return diff.select([index], [diffIdx]);
	}

	////////////////////////////////////////////////////////////////////////////////
	// Function to calculate RdNBR
	function rdnbr_function(i1, i2) {
		var nbr1 = i1.select('p50NBR');
		var nbr2 = i2.select('p50NBR');
		var rdnbr = nbr1.subtract(nbr2).divide(nbr1.divide(10000).abs().sqrt())
			.round().int16();
		return rdnbr.select(['p50NBR'], ['RdNBR']);
	}

	////////////////////////////////////////////////////////////////////////////////
	// Function to duplicate a value to a column with a new name (used to simplify
	// names)
	function renameColumn(feature,oldColumn,newColumn){
		feature = ee.Feature(feature);
		var value = feature.get(oldColumn);
		feature = feature.set(newColumn,value);
		return feature;
	}

	////////////////////////////////////////////////////////////////////////////////
	// Function to remap class names to class numbers (starting at 0)
	function namesToNumbers(collection,nameColumn,numberColumn,classList){
		// Get list of names
		// var hist = collection.aggregate_histogram(nameColumn);
		var names = ee.List(classList);//ee.Dictionary(hist).keys();
		// Get corresponding numbers
		var numbers = ee.List.sequence(0,names.length().subtract(1));
		// Copy name column to number column
		collection = collection.map(function(feature){
			feature = renameColumn(feature,nameColumn,numberColumn);
			return feature;
		});
		// Remap names to numbers in the number column
		collection = collection.remap(names,numbers,numberColumn);
		return collection; 
	}

	////////////////////////////////////////////////////////////////////////////////
	// Function to compute the Root Mean Square Error (RMSE) for the results from 
	// a regression model. This function uses the actual values stored in the 
	// 'actual' property of the 'regression' feature collection, and the predicted 
	// values stored in the 'prediction' property.
	function RegressionRMSE(regression,actual,prediction) {
		// Calculate the squared errors between the actual and predicted values
		regression = regression.map(function(feature){
			feature = ee.Feature(feature);
			var actualValue = ee.Number(feature.get(actual));
			var predict = ee.Number(feature.get(prediction));
			var sqError = (actualValue.subtract(predict))
				.multiply(actualValue.subtract(predict));
			feature = feature.set('sqError',sqError);
			return feature;
		});
		regression = ee.FeatureCollection(regression);
		// Calculate the Root Mean Square Error (RMSE)
		var MSE = regression.reduceColumns(ee.Reducer.mean(),['sqError']);
		var RMSE =  ee.Number(MSE.get('mean')).sqrt();
		return RMSE;
	}

	////////////////////////////////////////////////////////////////////////////////
	// Function to compute the Adjusted R2 (coefficient of determination) for the 
	// results from a regression model. This function uses the actual values stored 
	// in the 'actual' property of the 'regression' feature collection, and the 
	// predicted values stored in the 'prediction' property. "p" is the number of 
	// predictors (not including intercept).
	function RegressionAdjustedR2(regression,actual,prediction,p) {
		// Calculate the mean actual value
		var meanValue = regression.reduceColumns(ee.Reducer.mean(),[actual])
			.get('mean');
		var n = regression.size();
		var denom = n.subtract(p).subtract(1);
		// Calculate the squared errors between the actual and predicted values, and
		// between the actual and mean values
		regression = regression.map(function(feature){
			feature = ee.Feature(feature);
			var actualValue = ee.Number(feature.get(actual));
			var predict = ee.Number(feature.get(prediction));
			var sqError = (actualValue.subtract(predict))
				.multiply(actualValue.subtract(predict));
			var sqTotal = (actualValue.subtract(meanValue))
				.multiply(actualValue.subtract(meanValue));
			feature = feature.set('sqError',sqError);
			feature = feature.set('sqTotal',sqTotal);
			return feature;
		});
		regression = ee.FeatureCollection(regression);
		// Calculate the sum of squared errors
		var ssError = ee.Number(regression.reduceColumns(ee.Reducer.sum(),['sqError'])
			.get('sum'));
		var ssTotal = ee.Number(regression.reduceColumns(ee.Reducer.sum(),['sqTotal'])
			.get('sum'));
		var R2 = ee.Number(1).subtract(ssError.divide(ssTotal));
		var adjustedR2 = R2.subtract((ee.Number(1).subtract(R2)).multiply(p.divide(denom)));
		return adjustedR2;
	}

}