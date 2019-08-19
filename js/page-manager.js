// Declare script globals
var canopyBreaks;
var canopyBreaksCached = false;
var chartSuccess;
var classList;
var compositeArea;
var compositeBandVal;
var errorString = '';
var export_settings = {};
var exportID = 1;
var exportStructure = {};
var fieldsWithValues;
var gainLossPercentiles;
var gainLossPercentilesCached = false;
var geometryPolygon;
var infoWindow;
var input_settings;
var isChrome;
var layerID = 1;
var layerStructure = {};
var leftLayerSelect;
var loadStudyArea = false;
var loadTrainingData = false;
var mapArrangeVal;
var maxRunTime = 5*60*1000;
var polygonVisible = false;
var possibleSensors;
var runStatus = 0;
var startRunTime;
var studyArea;
var studyAreaDrawn;
var studyAreaPolgyon; 
var studyAreaLayer;
var studyAreaVisible = false;
var tableSuccess;
var taskID;
var allTrainingData;
var trainingData;
var trainingDataLayer;
var trainingDataVisible;
var validInputs = 1;
var yearNameDict;

// Declare map globals
var center;
var currentCenter;
var eeBoundsPoly;
var map1;
var map2;
var map_settings = null;
var zoom;

// Declare EE input globals
var bufferDistance;
var classificationField = 'DOM_COVER';
var classNumbersField = 'COVER_NUM';
var cloudThresh;
var colorList = [];
var comparisonYear;
var crsValue;
var coverClass;
// var dominantCoverField;
var endJulian;
var gainPercentile;
var lossPercentile;
var nTrees;
var percentCoverField;
var reducerPercentile;
var reducerScale;
var startJulian;
var studyName;
var trainingYear;
var TS;
var whichIndex;
var yearsOfImagery;


// Declare EE output globals
var bucketName = 'test-bucket-housman2'; //Will need to set permissions for reading and writing using: gsutil acl ch -u AllUsers:W gs://example-bucket and gsutil acl ch -u AllUsers:R gs://example-bucket
var changeClassification;
var changeMask;
var chartData;
var chartObj;
var diffThematic;
var gainThreshold;
var lossThreshold;
var maxVal;
var minVal;
var postCompsosite;
var postYear;
var preClassified;
var preComposite;
var prePostClassified;
var preYear;
var R2;
var rfModelAccuracy;
var rfModelConfusion;
var rfModelConsumersAccuracy;
var rfModelKappa;
var rfModelProducersAccuracy
var RMSE;
var tableObj;

$(document).ready(function(){
	// Load the html pages
	$('#home-page').load('../html/home.html');
	$('#about-page').load('../html/about.html');
	$('#data-page').load('../html/data.html');
	$('#map-page').load('../html/map.html');
	$('#frag-page').load('../html/frag.html');
	$('#ref-page').load('../html/ref.html');

	// On clicking the navigation bar, hide the pages, and
	// only show the desired page div
	$('ul.nav.navbar-nav li a').on('click',function(e) {
		e.preventDefault();
		$('.pages').hide();
		$('#' + $(this).attr('href') ).show();

		// If loading map page, show warning if browser is not Chrome
		if ($(this).attr('href') == 'map-page'){
			if (!isChrome){
				var errText = 'Warning: This tool will only work correctly with Google Chrome. Please install Google Chrome before continuing.';
				$('#errorModal p').text(errText);
				$('#errorModal').modal('show');
				console.log(errText);
			}
		}
		// Reset the map
		currentCenter = map1.getCenter()
		google.maps.event.trigger(map1, 'resize');
		google.maps.event.trigger(map2, 'resize');
		map1.setCenter(currentCenter);
		map2.setCenter(currentCenter);
	});

	// On clicking the brand, hide the pages, and only show
	// the home page
	$('a.navbar-brand').on('click',function(e) {
		e.preventDefault();
		$('.pages').hide();
		$('#home-page').show();
	});
});

// Initialize Earth Engine and start the scripts
$(window).on('load', function(){
	initialize();
	isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
	$('a.q-tool-tip').tooltip();
	interval(trackExports, 10000, 100000);

	// On clicking an internal link, hide the pages, and
	// only show the desired page div
	$('a.internal-link').on('click',function(e) {
		e.preventDefault();
		$('.pages').hide();
		$('#' + $(this).attr('href') ).show();

		// If loading map page, show warning if browser is not Chrome
		if ($(this).attr('href') == 'map-page'){
			if (!isChrome){
				var errText = 'Warning: This tool will only work correctly with Google Chrome. Please install Google Chrome before continuing.';
				$('#errorModal p').text(errText);
				$('#errorModal').modal('show');
				console.log(errText);
			}
		}

		// Reset the map
		currentCenter = map1.getCenter()
		google.maps.event.trigger(map1, 'resize');
		google.maps.event.trigger(map2, 'resize');
		map1.setCenter(currentCenter);
		map2.setCenter(currentCenter);
	});
});

// Alert to confirm that the user want to refresh/leave the page
$(window).on('beforeunload', function() {
	return 'Are you sure want to leave the page?';
});

// Refresh Earth Engine if the page is reloaded
google.maps.event.addDomListener(window, 'load', function(){
	initializeOnChange();
});

function initialize(){
	ee.initialize("https://rcr-ee-proxy.herokuapp.com/api","https://earthengine.googleapis.com/map",function(){
		createMap();
		createInputs();
	});
};

function initializeOnChange(){
	ee.initialize("https://rcr-ee-proxy.herokuapp.com/api","https://earthengine.googleapis.com/map",function(){});
};