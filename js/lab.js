const ln = x => Math.log(x);
const log10 = x => Math.log10(x);
const log = log10; // Use the same function name for log() as log10()

const filter = function (...args) {
    const filteredValues = args[0].filter(item => item.value !== 'null' && item.value !== '0' && item.value.trim() !== '');
    const filteredNumericValues = filteredValues.map(item => parseFloat(item.value));
    return filteredNumericValues;
}
let loaded = false;

/*
const filter = function (...args) {
	const filteredValues = args[0].filter(item => item.value !== 'null' && item.value !== '0' && item.value.trim() !== '');
	let filtered;
	//let filteredString = "";
	for(filteredValue of filteredValues) {
		filtered = filtered.append(filteredValue.value + ", ";
	}
	filteredString = filteredString.slice(0, filteredString.length-2)
	alert(filteredString);
    return filteredString;
}*/
/*
const filter = (...args) => {
	const filteredValues = args.filter(value => value !== 'null' && value !== '0' && value.trim() !== '');
    const filteredString = filtered.join(', ');
    return filteredString;
};*/

const chartInstances = [];

MathJax.Hub.Config({
      tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] }
    });

function $(x) {
  return document.getElementById(x);
}

function toPrint () {
  event.preventDefault(); // Prevent default form submission or button click behavior
  
  const labName = $('labName').value; // Retrieve labName from input field
  const userName = $('userName').value; // Retrieve userName from input field
  
  $('button_bar').style.display = 'none';
  alert('Remember to change the destination to "Save as PDF"');
  window.print();
    // This callback will be executed when the PDF generation is complete
    $('button_bar').style.display = 'flex';

}

// Function to update a scatter plot with new data
  function updateGraph(graphName) {
const dataArray = getData(graphName);
const data = dataArray[0];
//const xAxisLabel = dataArray[1];
//const yAxisLabel = dataArray[2];
	  
    const chartInstance = chartInstances.find(chart => chart.graphName === graphName);
    if (chartInstance) {
      //graphName.instance.data.datasets[0].data = data;
	  chartInstance.instance.data = data;
      chartInstance.instance.update();
    } else {
      console.error(`Chart with canvas ID '${graphName}' not found.`);
    }
  }


function plotNewGraph(graphName) {
const dataArray = getData(graphName);
const data = dataArray[0];
const xAxisLabel = dataArray[1];
const yAxisLabel = dataArray[2];

const ctx = $(graphName);
	// Create the chart
	
var myChart = new Chart(ctx, {
  type: 'scatter',
  data: data,
  options: {
    plugins: {
      legend: {
        labels: {
          color: 'black' // Set the font color here
        }
      }
    },
    animation: false,
    scales: {
      x: {
		display: true, // Set this to true to display the x-axis labels
        title: {
          display: true,
          text: xAxisLabel, // Set the x-axis label here
          color: 'black' // Set the color of the x-axis label here
        },  
        type: 'linear',
        position: 'bottom',
        ticks: {
          color: 'black' // Set the font color for the x-axis ticks here
        },
        grid: {
          color: 'lightgrey' // Set the color for the x-axis grid lines here
        }
      },
      y: {
		display: true, // Set this to true to display the x-axis labels
        title: {
          display: true,
          text: yAxisLabel, // Set the x-axis label here
          color: 'black' // Set the color of the x-axis label here
        },
        type: 'linear',
        position: 'left',
        ticks: {
          color: 'black' // Set the font color for the y-axis ticks here
        },
        grid: {
          color: 'lightgrey' // Set the color for the y-axis grid lines here
        }
      }
    }
  }
});	

chartInstances.push({ graphName, instance: myChart });

}

function getData(graphName){
	const graphNameArray = graphName.split(' ');
	const name = graphNameArray[0];
	const xAxisLabelName = name + ' x-axis';
	const yAxisLabelName = name + ' y-axis';
	const xAxisLabel = $(xAxisLabelName) ? $(xAxisLabelName).innerHTML : '';
	const yAxisLabel = $(yAxisLabelName) ? $(yAxisLabelName).innerHTML : '';
	const xyElements = document.getElementsByClassName(graphName);
	let xElementIds = [];
	let yElementIds = [];
	for(var xyElement of xyElements) {
		if(xyElement.id.includes('x')) {
			xElementIds.push(xyElement.id);			
		} else if (xyElement.id.includes('y')) {
			yElementIds.push(xyElement.id);			
		}
	}
	let xyValues = [];
	let data = {};
    for(let i = 0; i < yElementIds.length; i++) {
		if(xyElements[xElementIds[i]].value != '' && xyElements[yElementIds[i]].value != '') {
			xyValues.push({'x': xyElements[xElementIds[i]].value*1, 'y': xyElements[yElementIds[i]].value*1})
		}
	}
	
	const slopeintercept = slopeIntercept(xyValues, name);
	const slope = slopeintercept[0].toPrecision(6);
	const intercept = slopeintercept[1].toPrecision(6);
	$(name+ ' ' + 'slope').value = slope;
	$(name+ ' ' + 'intercept').value = intercept;
	
		const plusElements = document.getElementsByClassName(name + ' plus');
		for(var plusElement of plusElements) {
		if(intercept<0) {
			plusElement.style.display = 'none';	
			} else {
			plusElement.style.display = null;		
			}
		}
		const minusElements = document.getElementsByClassName(name + ' minus');
		for(var minusElement of minusElements) {
		if(intercept<0) {
			minusElement.style.display = null;	
			} else {
			minusElement.style.display = 'none';		
			}
		}
	//$(name+ ' ' + 'slopeintercept').innerHTML = `y = ${slope}x + ${intercept}`;
	
	data = {
 datasets: [
   {
     label: graphName,
     data: xyValues,
     backgroundColor: '#4169e1',
     borderColor: 'black',
     pointRadius: 5,
     pointHoverRadius: 8,
   },
   {
     label: 'Trendline',
     data: [
       { x: Math.min(...xyValues.map(data => data.x)), y: slope * Math.min(...xyValues.map(data => data.x)) + intercept*1 },
       { x: Math.max(...xyValues.map(data => data.x)), y: slope * Math.max(...xyValues.map(data => data.x)) + intercept*1 },
     ],
     type: 'line',
     borderColor: '#4169e1',
	 backgroundColor: 'transparent',
     borderWidth: 2,
	 borderDash: [5, 5],
   },
	]}
	return [data, xAxisLabel, yAxisLabel];
}

function evaluateWithCustomFunctions(equation) {
  const scope = {
    ln,
    log10,
    log,
	filter,
  };
  try {
	  console.log(equation);
	  console.log('variable2');
	  const variable2 = math.evaluate(equation, scope) ? math.evaluate(equation, scope): equation;
	  console.log(variable2);
	  const variable = math.evaluate(equation, scope);
	  console.log('variable');
	  console.log(variable);
	  return math.evaluate(equation, scope);
  } catch (e) {
	  console.log(e);
	  return equation;
  }
}

function saveData(){
	const gridItems = document.querySelectorAll('.grid-item');
	let gridObj = {};
	for (var gridItem of gridItems) {
		const id = gridItem.id;
		const textContent = gridItem.textContent;
		gridObj[id] = textContent; 
	}
	const gridObjElement = $('gridObjInput');
	if(gridObjElement) {
		gridObjElement.value = JSON.stringify(gridObj);
	}
	
	/* I think this was my first idea, and I decided to do it another way.
	const textareas = document.getElementsByTagName('textarea');
	let dataObj = {};
	for(var textarea of textareas) {
		const id = textarea.id;
		const value = textarea.value
		dataObj[id] = value;
	} 
	*/
	//alert(JSON.stringify(dataObj));
}

function slopeIntercept(xyValues, name) {
var slope, intercept, SX = 0,
   SY = 0,
   SXX = 0,
   SXY = 0,
   SYY = 0,
   SumProduct = 0,
   N = xyValues.length;
 
  for (var i = 0; i < N; i++) {
   SX = SX + xyValues[i].x;
   SY = SY + xyValues[i].y;
   SXY = SXY + xyValues[i].x * xyValues[i].y;
   SXX = SXX + xyValues[i].x * xyValues[i].x;
   SYY = SYY + xyValues[i].y * xyValues[i].y;
 }
 
 slope = ((N * SXY) - (SX * SY)) / ((N * SXX) - (SX * SX)); 

 intercept = (SY - (slope * SX)) / N;

 console.log("Slope: " + slope + ", Intercept: " + intercept);
 return [slope, intercept]
 }

function submitScore() {
var path = `/score/${params.sessionID}/${score.innerHTML}`;
			document.location = path;
}
 
 function lookupValueInTable(tableID, searchColumn, searchValue, returnColumn) {
  const table = $(tableID);
  if (!table) {
    console.error(`Table with ID "${tableID}" not found.`);
    return null;
  }

  let minDistance = Number.MAX_SAFE_INTEGER;
  let closestValue = null;

  const rows = table.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName('td');

    if (cells.length > searchColumn) {
      const cellValue = cells[searchColumn].innerText.trim();
      const distance = Math.abs(cellValue - searchValue);

      if (distance < minDistance) {
        minDistance = distance;
        if (cells.length > returnColumn) {
          closestValue = cells[returnColumn].innerText.trim();
        } else {
          console.error(`Return column "${returnColumn}" not found in table.`);
          return null;
        }
      }
    }
  }

  if (closestValue !== null) {
    return closestValue;
  }

  console.error(`Value "${searchValue}" not found in column "${searchColumn}" of the table.`);
  return null;
}

function isNotCalcElement(element) {
  return !element.classList.contains('calc');
}

function isFilledOut(element) {
  // Assuming these are form elements like input fields
  return element.value !== undefined && element.value.trim() !== '';
}
 
 /*
 function lookupValueInTable(tableID, searchColumn, searchValue, returnColumn) {
  const table = $(tableID);
  if (!table) {
    console.error(`Table with ID "${tableID}" not found.`);
    return null;
  }

  const rows = table.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName('td');

    if (cells.length > searchColumn) {
      const cellValue = cells[searchColumn].innerText.trim();
      if (cellValue === searchValue) {
        if (cells.length > returnColumn) {
          return cells[returnColumn].innerText.trim();
        } else {
          console.error(`Return column "${returnColumn}" not found in table.`);
          return null;
        }
      }
    }
  }

  console.error(`Value "${searchValue}" not found in column "${searchColumn}" of the table.`);
  return null;
}
*/
// ==========================================

function onLoad (){
	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
	$('name').innerHTML = userName;
Number.prototype.inRange = function(value, range) {
  let max = 0;
  let min = 0;
  if (value >= 0) {
    if (range.includes('%')) {
      const regex = /(.*?)%/;
      const match = range.match(regex);
      range = match ? match[1] : null;
      max = value + (value * range / 100);
      min = value - (value * range / 100);
    } else if (!isNaN(range)) {
      max = value + (value * range / 100);
      min = value - (value * range / 100);
    } else {
      max = value;
      min = value;
    }
  } else { // if negative
    if (range.includes('%')) {
      const regex = /(.*?)%/;
      const match = range.match(regex);
      range = match ? match[1] : null;
      max = value - (value * range / 100);
      min = value + (value * range / 100);
    } else if (!range.isNaN) {
      max = value - (value * range / 100);
      min = value + (value * range / 100);
    } else {
      max = value;
      min = value;
    }

  }
  if (this >= min && this <= max) {
    return true;
  } else {
    return false;
  }
};	

$('userName').value = `${userName}`;
$('labName').value = `${labName}`;

var calcElements = document.getElementsByClassName('calc');

for (var calc of calcElements) {
  ['click', 'change'].forEach(function(event){
  calc.addEventListener(event, function(e) {
    var formula = this.getAttribute('formula');
	const range = this.getAttribute('range') ? this.getAttribute('range') : '5%';
    const regex = /\${(.*?)}/g;
    const matches = formula.match(regex);
	if(matches) {
    for (var match of matches) {
      var elementId = match.replaceAll('${', '').replaceAll('}', '');
      var element = $(elementId);
      var elementValue = element.value;
      formula = formula.replaceAll(match, elementValue);
    }
	}
    var answer = evaluateWithCustomFunctions(formula);
    var elementFB = $(this.id + 'FB');
	const value = isNaN(this.value) ? this.value : this.value*1;
	let closeOrCorrect = false;
	if(value !== '') {
	if(isNaN(value)) {
	  closeOrCorrect = value==answer ? true : false;
	} else {	
	  closeOrCorrect = value.inRange(answer, range) ? true : false;
	}
	    if (closeOrCorrect) {
	  elementFB.title = 'correct';
	  elementFB.innerHTML = '<img src="../images/correct.svg">';
    } else {
      elementFB.title = this.getAttribute('help');
	  elementFB.innerHTML = '<img src="../images/incorrect.svg">';
    }
	
	}
	if($('score') && loaded) {$('score').click()}
  });
  });
  calc.addEventListener("input", function(e) {
    const savebutton = $('savebutton');
	savebutton.click();
	if($('score') && loaded) {$('score').click()}
  });
  
}

var lookupElements = document.getElementsByClassName('lookup');

for (var lookupElement of lookupElements) {
	lookupElement.addEventListener("input", function(e) {
	const id = this.id;
	const neededInID = id + 'LV';
	const lookupValueElements = document.querySelectorAll(`[id*="${neededInID}"]`);
	const calcs = document.querySelectorAll(`[formula*="${neededInID}"]`);
	for (var lookupValueElement of lookupValueElements) {
	lookupValueElement.click();
	}
	for (var calc of calcs) { //will cause a save
	calc.click();
	}
  });
}

var lookupValueElements = document.getElementsByClassName('lookupValue');

for (var lookupValueElement of lookupValueElements) {
	lookupValueElement.addEventListener("click", function(e) {
	const tableID = this.getAttribute('tableID');
	const searchColumn = this.getAttribute('searchColumn') ? this.getAttribute('searchColumn') : 0;
	const lookupID = this.id.split('LV')[0];
	const lookup = $(lookupID);
	const searchValue = lookup.value;
	const returnColumn = this.getAttribute('returnColumn') ? this.getAttribute('returnColumn') : 1;
	const value = lookupValueInTable(tableID, searchColumn, searchValue, returnColumn);
	this.value = value;
  });
}

var numElements = document.getElementsByClassName('num');

for (var num of numElements) {
	/*
  num.addEventListener("input", function(e) {
    if (isNaN(this.value)) {
      this.style.color = 'red';
    } else {
      this.style.color = null;
    }
  });
  */
  
  
  num.addEventListener("input", function(e) {
	var calcElements = document.getElementsByClassName('calc');
	const numbIdText = '${' + this.id + '}'
    for(var calcElement of calcElements) {
		if (calcElement.getAttribute('formula').includes(numbIdText) && calcElement.value != '') {
			calcElement.click();		
		}
	}
	const savebutton = $('savebutton');
	savebutton.click();
	if($('score') && loaded) {$('score').click()}
  });
}

const graphElements = document.getElementsByClassName('graph');


for (var graphElement of graphElements) {
	graphElement.addEventListener("change", function(e) {
		const savebutton = $('savebutton');
		savebutton.click();
		const graph = $(this.className);
		graph.click();
	});
	
}

const textElements = document.getElementsByClassName('text');
for (var textElement of textElements) {
	textElement.addEventListener("change", function(e) {
		const savebutton = $('savebutton');
		savebutton.click();
		if($('score') && loaded) {$('score').click()}
	});
}

const essayElements = document.getElementsByClassName('essay');
for (var essayElement of essayElements) {
	essayElement.addEventListener("change", function(e) {
		const savebutton = $('savebutton');
		savebutton.click();
		if($('score') && loaded) {$('score').click()}
	});
}

const feedbackElements = document.getElementsByClassName('feedback');

for (var feedbackElement of feedbackElements) {
	feedbackElement.addEventListener("click", function(e) {
		alert(this.title);
	});
	
}

const scoreElement = $('score');

if(scoreElement) {
scoreElement.addEventListener("click", function(e) {
  // Check if 'loaded' is true
  if (loaded) {
    // Get elements with the 'num' class
    let numElements = document.getElementsByClassName('num');

    // Convert the HTMLCollection to an array
    let numElementsArray = Array.from(numElements);

    // Filter out elements that do not have the 'calc' class
    let numElementsArrayFiltered = numElementsArray.filter(isNotCalcElement);

    // Filter out elements that are not filled out (assuming these are form elements)
    let filledOutNumElements = numElementsArrayFiltered.filter(isFilledOut);

    //const dataScore = ((filledOutNumElements.length - (numElementsArrayFiltered.length - filledOutNumElements.length)) / numElementsArrayFiltered.length) * 50;
	const dataScore = (filledOutNumElements.length/numElementsArrayFiltered.length) * 50;
	
	// Get all elements with IDs ending in "FB"
	const fbElements = document.querySelectorAll('[id$="FB"]');

// Initialize a count for elements with the title "correct"
	let countCorrectElements = 0;

// Iterate through the selected elements
fbElements.forEach((element) => {
  // Check if the element has the title "correct"
  if (element.getAttribute('title') === 'correct') {
    countCorrectElements++;
  }
});
	const calcScore = (countCorrectElements/fbElements.length)*50;
	const totalScore = dataScore + calcScore;
    $('score').innerHTML = totalScore.toFixed(1);
  }
});
}

if(dataFile != null && JSON.stringify(dataFile) != '{}') {
	for(var index in dataFile) {
		const element = $(index);
		if(element){
		element.value = dataFile[index];
		} else {
			console.log(index+' was not found')
		}
	}
}

// load graphs
const graphs = document.querySelectorAll("[id*='graph']");
for(var graph of graphs) {
	plotNewGraph(graph.id);
}

// click calc elements if not empty
var calcElements = document.getElementsByClassName('calc');
for(var calcElement of calcElements) {
	if (calcElement.value != '') {
			calcElement.click();		
		}
}

// click lookupValue elements if lookup not empty
var lookupValueElements = document.getElementsByClassName('lookupValue');
for (var lookupValueElement of lookupValueElements) {
	const id = lookupValueElement.id;
	const lookupID = id.split('LV')[0]; 
	const lookupElement = $(lookupID);
	if (lookupElement.value != '') {
			lookupValueElement.click();		
		}
}
		
		
    // JavaScript to handle the form submission
    const form = $('labdataform');

    form.addEventListener('submit', async (event) => {
      event.preventDefault(); // Prevent the default form submission

      // Convert the FormData object to a JavaScript object
      const formData = {};
      for (const pair of new FormData(form)) {
        formData[pair[0]] = pair[1];
      }

      console.log(JSON.stringify(formData)); // Log the converted object

      try {
        // Make a POST request to the server
        const response = await fetch(form.action, {
          method: 'POST',
          body: JSON.stringify(formData), // Convert the object to JSON before sending
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Check if the request was successful (status 200-299)
        if (response.ok) {
          // Optionally, you can show a success message to the user
          console.log('Data saved successfully!');
        } else {
          // Handle the case when the request fails (e.g., show an error message)
          alert('Failed to save data.');
        }
      } catch (error) {
        // Handle any network-related errors
        alert('Network error occurred.');
      }
    });
	
	const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
      let state = 0;
      item.addEventListener('click', () => {
      const statesArray = item.getAttribute("states").split(',');
        state = (state + 1) % statesArray.length;
        item.textContent = statesArray[state];
		const savebutton = $('savebutton');
	    savebutton.click();
      });
    });
	
	const gridObjElement = $('gridObjInput');
	let gridObj = {};
	if(gridObjElement) {
		gridObj = gridObjElement.value ? JSON.parse(gridObjElement.value) : {};
	}
	
	for(var gridItemElementID in gridObj) {
		$(gridItemElementID).textContent = gridObj[gridItemElementID];
	}
	
	
	
window.addEventListener("beforeprint", (event) => {
  document.title = labName + '_' + userName;
});

window.addEventListener("afterprint", (event) => {
  document.title= labName;
});
loaded = true;
  if($('score')) {$('score').click()}
}// end onLoad