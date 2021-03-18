// // Get cached export settings
// if (typeof(Storage) !== "undefined"){
// 	export_settings = JSON.parse(localStorage.getItem("export_settings"));
// }
// if (export_settings == null){
// 	if (typeof(Storage) !== "undefined"){
// 		export_settings = {};
// 		localStorage.setItem("export_settings",JSON.stringify(export_settings));
// 	}
// }

function exportLayers(){
	// Add exports to manager
	addToExports(preComposite.uint16(), compositeArea, createName(preYear.toString() + '_Composite'));
	addToExports(postComposite.uint16(), compositeArea, createName(postYear.toString() + '_Composite'));
	addToExports(diffThematic.uint8(), compositeArea, createName('Change_' + whichIndex));
	addToExports(preClassified.add(1).uint8(), studyArea, createName(preYear.toString() + '_Classified'));
	addToExports(prePostClassified.add(1).uint8(), studyArea, createName(postYear.toString() + '_Classified'));

	// Create interactivity for exporting
	Object.keys(exportStructure).map(function(key){
		var currentExportID = exportStructure[key].exportID;
		var currentObject = exportStructure[key].object;
		var currentBoundary = exportStructure[key].boundary;
		var currentName = exportStructure[key].name;
		// On clicking a start button, get time stamp, task ID and parameters, start processing
		// and cache status of task
		$('#exportStartButton-' + currentExportID.toString()).click(function(){
			$(this).prop('disabled', true);
			var now = Date().split(' ');
			var timeStamp = now[2] + '_' + now[1] + '_' + now[3] + '_' + now[4].replace(/:/g,'');
			// var timeStamp = Math.round(new Date().getTime()/1000.0).toString();
			var outputName = currentName + '_' + timeStamp;
			var task = getIDAndParams(currentObject, currentBoundary, outputName, crsValue, 30);
			// console.log('REMEMBER TO FIX RESOLUTION BACK TO 30');
			// function startTask(startCount){
   //              console.log('Starting task');
   //              task.start(function(){
   //                  console.log('here')
   //                  meta_template_strT = '{}';
   //                  cacheExport(currentExportID, currentName, currentExportID);
			// 		$('#exportStartButton-' + currentExportID.toString()).hide();
			// 		$('#exportInProgress-' + currentExportID.toString()).show().css('display','flex');
			// 		$('#exportCancelButton-' + currentExportID.toString()).val(currentExportID);
   //                  },
   //              function(fail){
   //                  console.log(fail);
   //                  startCount++
   //                  if(startCount < 5){
   //                  	startTask(startCount);	
   //                  }
   //              })};
   //          startTask(0);
            task.start();
            cacheExport(outputName, outputName, currentExportID);
			$('#exportStartButton-' + currentExportID.toString()).hide();
			$('#exportInProgress-' + currentExportID.toString()).show().css('display','flex');
			$('#exportCancelButton-' + currentExportID.toString()).val(currentExportID);
			
			
			
		});

		// On mouse over progress, show cancel button
		$(document).on('mouseenter', '#exportInProgress-' + currentExportID.toString(), function () {
			$('#exportInProgress-' + currentExportID.toString()).hide();
			$('#exportCancelButton-' + currentExportID.toString()).show();
		});
		// On mouse off cancel button, show progress
		$(document).on('mouseleave', '#exportCancelButton-' + currentExportID.toString(), function () {
			$('#exportCancelButton-' + currentExportID.toString()).hide();
			$('#exportInProgress-' + currentExportID.toString()).show();
		});

		// On clicking cancel button, cancel task
		$('#exportCancelButton-' + currentExportID.toString()).click(function(){
			$(this).off('mouseleave');
			$(this).prop('disabled', true);
			var cancelID = $(this).val();
			var taskList = ee.data.getTaskList().tasks;
			taskList.map(function(t){
				// Check that the tasks are running or ready, and in the user's cache
				if((t.state === 'RUNNING' || t.state === 'READY') &&  Object.keys(export_settings).indexOf(t.id) >-1){
					if (t.id === cancelID){
						ee.data.cancelTask(t.id);
					}
				}
			})
		});

	});

}

// Function to add exports to export manager
function addToExports(eeObject, eeBoundary, name){
	var currentExport = {};
	currentExport.name = name;
	currentExport.object = eeObject;
	currentExport.boundary = eeBoundary;
	currentExport.exportID = exportID;

	// Create export row for export manager
	var stringText = '<h5 id="exportText-'+ exportID.toString() +'">' + name.slice(0,40) + '</h5>';
	var stringStart = '<button class="btn btn-primary exportBlock" id="exportStartButton-'+ exportID.toString() +'" type="button">Start</button>';
	var stringInProgressDiv = '<div class="exportBlock" id="exportInProgress-'+ exportID.toString() +'" style="display:none;flex-direction:row;">';
	var stringInProgressImg = '<img src="img/GEE_logo_transparent.png" class="fa-spin progressSpinner" alt="Gear Spinner" style="width: 25px; height: 25px;">';
	var stringInProgressText = '<h5 id="exportInProgressText-'+ exportID.toString() +'"></h5></div>';
	var stringInProgressCancel = '<button class="btn btn-secondary exportBlock" id="exportCancelButton-'+ exportID.toString() +'" type="button" style="display: none;">Cancel</button>';
	var stringInProgress = stringInProgressDiv + stringInProgressImg + stringInProgressText + stringInProgressCancel;
	var stringFinished = '<a href="#" class="btn btn-primary exportBlock" id="exportDownloadButton-'+ exportID.toString() +'" type="button" style="display: none;">Download</a>';
	var stringFailed = '<h5 class="exportBlock" id="exportFailed-'+ exportID.toString() +'" style="display: none;">FAILED</h5>';
	var stringCanceled = '<h5 class="exportBlock" id="exportCanceled-'+ exportID.toString() +'" style="display: none;">CANCELED</h5>';
	currentExport.html = '<li class="list-group-item">' + stringText + '<span class="pull-right">' + stringStart + stringInProgress + stringFinished + stringCanceled + stringFailed + '</span></li>';

	// Add export to export manager
	$('#export-manager').prepend(currentExport.html);

	// Add current layer to layer structure
	exportStructure[exportID] = currentExport;
	exportID++;
}

// Function to get the ID and parameters for a new export task
var testExport = {}
function runTestExport(){
	testExport.img = ee.Image(1);
	testExport.geo = ee.Feature(ee.Geometry.Polygon(
        [[[-113.16413449445352, 38.30621132413199],
          [-113.16413449445352, 38.302641573461436],
          [-113.16095875897989, 38.302506862449256],
          [-113.15838383832559, 38.30580721023283]]]));
	testExport.name = 'test-export'
	addToExports(testExport.img, testExport.geo, testExport.name)
	// var task = getIDAndParams(testExport.img, testExport.geo, 'test-export', 'EPSG:5070', 30);
	// console.log(task)

	// //Start processing
 //    function startTask(){
 //        console.log('Starting task');
 //        task.start(function(){
 //            console.log('success!!')
 //            // meta_template_strT = '{}';
 //            cacheExport(exportName,exportName);
 //            },
 //        function(fail){
 //            console.log(fail);
 //            startTask();
 //        })};
 //    startTask();


}
function getIDAndParams(eeImage,eeBoundary,exportOutputName,exportCRS,exportScale){
	var noDataValue = -32768;
    eeImage = ee.Image(eeImage.clip(eeBoundary).unmask(noDataValue,false)).int16();//.reproject(exportCRS,null,exportScale);
    
    

    outputURL = 'https://storage.googleapis.com/'+bucketName+'/'+exportOutputName +'.tif'//Currently cannot handle multiple tile exports for very large exports
    
    console.log('exporting')
    try{
    	var region = JSON.stringify(eeBoundary.geometry().bounds().getInfo()); 
    }catch(err){
    	var region = JSON.stringify(eeBoundary.bounds().getInfo()); 
    }
    // console.log(region)
    
    
    
    // //Set up parameter object
    // var params = {
    //     json:imageJson,
    //     type:'EXPORT_IMAGE',
    //     description:exportOutputName,
    //     region:region,
    //     outputBucket:bucketName ,
    //     outputPrefix: exportOutputName,
    //     crs:exportCRS,
    //     crsTransform:null,
    //     scale: exportScale,
    //     maxPixels:1e13,
    //     shardSize:256,
    //     fileDimensions:256*75
    //     }

    // //Set up a task and update the spinner
    // taskId = ee.data.newTaskId(1)

    var task = ee.batch.Export.image.toCloudStorage(eeImage, exportOutputName, bucketName, exportOutputName, null, region, exportScale, exportCRS, null, 1e13, 256, 256*75);
    

    return task;
}

// Function to cache export status
function cacheExport(id, outputName, currentExportID){
	export_settings[id] = {
		'status': 'submitted',
		'downloaded': false,
		'updated': false,
		'start-time': Date.parse(new Date()),
		'outputName': outputName,
		'outputLink': 'https://storage.googleapis.com/'+ bucketName + '/' + outputName +'.tif',
		'exportID': currentExportID
	}
	// localStorage.setItem("export_settings",JSON.stringify(export_settings));
	trackExports();
}

// Function to track exports and update their status
function trackExports(){
	// Get all of the current tasks
	var taskList = ee.data.getTaskList().tasks;
	// Check the status of each task
	taskList.map(function(t){
		// Check if the task is in the user's cache
		if (Object.keys(export_settings).indexOf(t.description) >-1){
			var currentCachedTask = export_settings[t.description];
			var currentExportID = currentCachedTask['exportID'];
			var currentLink = currentCachedTask['outputLink'];
			var currentST = currentCachedTask['start-time'];
			// Check if the task is still running (or about to run)
			if (t.state === 'RUNNING' || t.state === 'READY'){
				var now = new Date();
				var timeDiff = now - currentST;
				timeDiff = parseTime(timeDiff);
				$('#exportInProgressText-' + currentExportID.toString()).text(t.state + ': ' + timeDiff.toString());
				export_settings[t.description]['status'] = 'running';

			// Check if the task is completed (but not downloaded)
			} else if (t.state === 'COMPLETED' && currentCachedTask.downloaded === false){
				// Show the download button, change some colors, and add the link
				$('#exportInProgress-' + currentExportID.toString()).hide();
				$('#exportCancelButton-' + currentExportID.toString()).hide();
				$('#exportText-' + currentExportID.toString()).css({'background': '#4D90FE', 'color': '#fff'});
				$('#exportDownloadButton-' + currentExportID.toString()).attr({'href': currentLink, 'target': '_blank'});
				$('#exportDownloadButton-' + currentExportID.toString()).show();
				export_settings[t.description]['downloaded'] = true;
				export_settings[t.description]['status'] = 'completed';

			// Check if the task is failed (but not updated)
			} else if (t.state === 'FAILED' && currentCachedTask.updated === false){
				$('#exportInProgress-' + currentExportID.toString()).hide();
				$('#exportCancelButton-' + currentExportID.toString()).hide();
				$('#exportText-' + currentExportID.toString()).css({'background': '#D64A38', 'color': '#fff'});
				$('#exportFailed-' + currentExportID.toString()).show();
				export_settings[t.description]['updated'] = true;
				export_settings[t.description]['status'] = 'failed';

			// Check if the task is canceled (but not updated)
			} else if ((t.state === 'CANCELLED' || t.state === 'CANCEL_REQUESTED') && currentCachedTask.updated === false){
				$('#exportInProgress-' + currentExportID.toString()).hide();
				$('#exportCancelButton-' + currentExportID.toString()).hide();
				$('#exportText-' + currentExportID.toString()).css({'background': '#777777', 'color': '#fff'});
				$('#exportCanceled-' + currentExportID.toString()).show();
				export_settings[t.description]['updated'] = true;
				export_settings[t.description]['status'] = 'canceled';
			}
		}
	});
}

// Function to run other functions in the background
// Wait is in ms, times is number of times to run
function interval(func, wait, times){
	var interv = function(w, t){
		return function(){
			if(typeof t === "undefined" || t-- > 0 ){
				setTimeout(interv, w);
				try{
					func.call(null);
				}
				catch(e){
					t = 0;
					throw e.toString();
				}
			}
		};
	}(wait, times);

	setTimeout(interv, wait);
};

// Function to prepend study area name to export layer names and replace 
// non-alphanumeric characters with underlines
function createName(str){
	str = str.replace(/[^a-zA-Z0-9]/g,'_');
	if (studyName == '') {
		return str;
	} else {
		return studyName.replace(/[^a-zA-Z0-9]/g,'_') + '_' + str;
	}
}

// Function that returns a simple time string (e.g. '3h 14m')
// Only shows the two largest units (e.g. hr and min, or min and sec)
function parseTime(s){
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	s = (s - mins) / 60;
	var hrs = s % 24;
	var days = (s - hrs)/ 24;
	str = '';
	if (days > 0){
		str += days + 'd';
		if (hrs > 0){
			str += ' ' + hrs + 'h';
		}
	} else if (hrs > 0){
		str += hrs + 'h';
		if (mins > 0){
			str += ' ' + mins + 'm';
		}
	} else if (mins > 0){
		str += mins + 'm';
		if (secs > 0){
			str += ' ' + secs + 's';
		}
	} else if (secs > 0){
		str += secs + 's';
	}

	if (str.length == 0){
		return '0s';
	} else {
		return str;
	}
}