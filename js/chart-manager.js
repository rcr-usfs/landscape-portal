// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart']});

function createChart(){
	console.log('Attempting to create chart');
	var currentRunTime = new Date();
	$('#histogram-panel-fail').hide();
	$('#histogram-panel-running').show();
	if ((chartSuccess == 0) && (currentRunTime - startRunTime < maxRunTime)){
		chartObj.evaluate(function(chartObj){
			try{
				chartSuccess = 1;
				minVal = chartObj['minVal'];
				maxVal = chartObj['maxVal'];
				gainThreshold = chartObj['gainThreshold'];
				lossThreshold = chartObj['lossThreshold'];
				chartData = chartObj['chartData'];

				// Set a callback to run when the Google Visualization API is loaded.
				google.charts.setOnLoadCallback(drawChart);

				var gainThresholdOut = '<h5 id="gainThresholdOut">' + gainThreshold.toString() + '</h5>';
				var lossThresholdOut = '<h5 id="lossThresholdOut">' + lossThreshold.toString() + '</h5>';
				$("label[for='gainThreshold']").parent().append(gainThresholdOut);
				$("label[for='lossThreshold']").parent().append(lossThresholdOut);
				$('#histogram-panel-running').hide();
				$('#histogram-panel-post').show();
				console.log('Succeeded in creating chart');
			}
			catch(err){
				console.log(err);
				chartSuccess = 0;
				createChart();
			}
		});
	} else {
		console.log('Failed to create chart');
		$('#histogram-panel-running').hide();
		$('#histogram-panel-fail').show();
	}
	

	////////////////////////////////////////////////////////////////////////////////
	// FUNCTIONS
	////////////////////////////////////////////////////////////////////////////////
	function drawChart() {
		var data = google.visualization.arrayToDataTable(chartData);
		var view = new google.visualization.DataView(data);
		view.setColumns([0, 1,
			// style column
			{
				calc: function (dt, row) {
					if (dt.getValue(row, 0) <= gainThreshold) {
						return '82d074';
					} else if ((dt.getValue(row, 0) > gainThreshold) && (dt.getValue(row, 0) <= lossThreshold)) {
						return '000000';
					} else {
						return '8d3d77';
					}
				},
				type: 'string',
				role: 'style'
			}
		]);
		
		// Set chart options
		var options = {
			width: 396,
			height: 396*3/4,
			chartArea: {
				'left': 50,
				'right': 25,
				'top': 25,
				'bottom': 50,
			},
			bar: {
				groupWidth: '100%'
			},
			legend: { 
				position: 'none' 
			},
			hAxis: {
				title: whichIndex,
				viewWindow: {
					max: maxVal,
					min: minVal
				} 
			},
			vAxis: {
				title: 'Frequency'
			},
		};

		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.ColumnChart(document.getElementById('chart-div'));
		chart.draw(view, options);

		$('#chart-div').click(function(){
			$('#chartModal').modal('show');
			google.charts.setOnLoadCallback(drawModalChart);
		});
	}

	function drawModalChart() {
		var data = google.visualization.arrayToDataTable(chartData);
		var view = new google.visualization.DataView(data);
		view.setColumns([0, 1,
			// style column
			{
				calc: function (dt, row) {
					if (dt.getValue(row, 0) <= gainThreshold) {
						return '82d074';
					} else if ((dt.getValue(row, 0) > gainThreshold) && (dt.getValue(row, 0) <= lossThreshold)) {
						return '000000';
					} else {
						return '8d3d77';
					}
				},
				type: 'string',
				role: 'style'
			}
		]);
		
		// Set chart options
		var options = {
			width: Math.floor($('#chartModal').width()*0.7*0.85),
			height: Math.floor($('#chartModal').width()*0.7*0.85*3/4),
			chartArea: {
				'width': '70%', 
				'height': '75%'
			},
			bar: {
				groupWidth: '100%'
			},
			legend: { 
				position: 'none' 
			},
			title: 'Difference Image Histogram',
			hAxis: {
				title: whichIndex,
				viewWindow: {
					max: maxVal,
					min: minVal
				} 
			},
			vAxis: {
				title: 'Frequency'
			},
		};

		// Instantiate and draw our chart, passing in some options.
		var chart = new google.visualization.ColumnChart(document.getElementById('chart-modal-div'));
		chart.draw(view, options);
	}
}