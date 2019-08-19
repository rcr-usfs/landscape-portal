function createTable(){
	console.log('Attempting to create table');
	var currentRunTime = new Date();
	$('#ccuracy-panel-fail').hide();
	$('#accuracy-panel-running').show();
	if ((tableSuccess == 0) && (currentRunTime - startRunTime < maxRunTime)){
		tableObj.evaluate(function(tableObj){
			try{
				tableSuccess = 1;
				rfModelConfusion = tableObj['rfModelConfusion'];
				rfModelConsumersAccuracy = tableObj['rfModelConsumersAccuracy'];
				rfModelProducersAccuracy = tableObj['rfModelProducersAccuracy'];
				rfModelAccuracy = tableObj['rfModelAccuracy'];
				rfModelKappa = tableObj['rfModelKappa'];

				RMSE = tableObj['RMSE'];
				R2 = tableObj['R2'];

				// Build confusion matrix table
				var tableString = buildConfusionMatrixTable(rfModelConfusion,rfModelConsumersAccuracy,rfModelProducersAccuracy,rfModelAccuracy,classList);
				$('#table-div').html(tableString);

				var rfModelAccuracyOut = '<h5 id="rfModelAccuracyOut">' + rfModelAccuracy.toFixed(2) + '</h5>';
				var rfModelKappaOut = '<h5 id="rfModelKappaOut">' + rfModelKappa.toFixed(2) + '</h5>';
				$("label[for='rfAccuracy']").parent().append(rfModelAccuracyOut);
				$("label[for='rfKappa']").parent().append(rfModelKappaOut);
				var lmRMSEOut = '<h5 id="lmRMSEOut">' + RMSE.toFixed(2) + '</h5>';
				var lmR2Out = '<h5 id="lmR2Out">' + R2.toFixed(2) + '</h5>';
				$("label[for='lmRMSE']").parent().append(lmRMSEOut);
				$("label[for='lmR2']").parent().append(lmR2Out);
				$('#accuracy-panel-running').hide();
				$('#accuracy-panel-post').show();
				console.log('Succeeded in creating table');
			}
			catch(err){
				console.log(err);
				tableSuccess = 0;
				createTable();
			}
		});
	} else {
		console.log('Failed to create table');
		$('#accuracy-panel-running').hide();
		$('#accuracy-panel-fail').show();
	}
	
	// Function to create the html string for a confusion matrix table
	function buildConfusionMatrixTable(confMat,consAcc,prodAcc,modelAcc,classes) {
		var nClass = rfModelConsumersAccuracy[0].length;
		// Start table
		var tableString = '<table id="confMat">';

		// First row of table: "Predicted", "Producer's Accuracy"
		tableString += '<tr><th colspan="2" rowspan="2" class="meta-th full-border">&nbsp</th>';
		tableString += '<th colspan="'+ nClass +'" class="meta-th full-border">Predicted</th>';
		tableString += '<th rowspan="2" class="meta-th full-border">Producer\'s Accuracy</th></tr>';

		// Second row of table: class names
		var rowString = '<tr>';
		for (var i = 0; i < nClass; i++){
			var currentClass = classes[i];
			// If the class name is a number, remove the decimal
			if (!isNaN(parseInt(currentClass))) {
				currentClass = parseInt(currentClass).toString();
			}
			rowString += '<th class="tb-border">'+ currentClass +'</th>';
		}
		rowString += '</tr>';
		tableString += rowString;

		// Middle rows of table: ["Actual"], class name, confusion matrix values, producer's accuracy value
		for (var i = 0; i < nClass; i++){
			rowString = '<tr>';
			// The first of the middle rows needs the "Actual" header
			if (i == 0){
				rowString += '<th rowspan="'+ nClass +'" class="meta-th full-border">Actual</th>';
			}
			// Add the class name
			var currentClass = classes[i];
			// If the class name is a number, remove the decimal
			if (!isNaN(parseInt(currentClass))) {
				currentClass = parseInt(currentClass).toString();
			}
			rowString += '<th class="lr-border">'+ currentClass +'</th>';
			// Add each cell in the confusion matrix for this row
			for (var j = 0; j < nClass; j++){
				rowString += '<td>'+ confMat[i][j] +'</td>';
			}
			// Add the producer's accuracy for this row
			rowString += '<td class="lr-border">'+ prodAcc[i][0].toFixed(2) +'</td></tr>';
			tableString += rowString;
		}

		// Last row of table: "Consumer's Accuracy", consumer's accuracy values, and overall accuracy
		rowString = '<tr><th colspan="2" class="meta-th full-border">Consumer\'s Accuracy</th>';
		for (var i = 0; i < nClass; i++){
			rowString += '<td class="tb-border">'+ consAcc[0][i].toFixed(2) +'</td>';
		}
		rowString += '<td class="full-border">'+ modelAcc.toFixed(2) +'</td></tr>';
		tableString += rowString;

		// End table
		tableString += '</table>';

		return tableString;
	}
}