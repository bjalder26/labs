let ln = (x) => Math.log(x);
const log10 = (x) => Math.log10(x);
const log = log10; // Use the same function name for log() as log10()

const filter = function (...args) {
  const filteredValues = args[0].filter(
    (item) =>
      item.value !== "null" && item.value !== "0" && item.value.trim() !== ""
  );
  const filteredNumericValues = filteredValues.map((item) =>
    parseFloat(item.value)
  );
  return filteredNumericValues;
};
let loaded = false;

const chartInstances = [];


MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
        TeX: {
          extensions: ["mhchem.js"]
        }
      });

function $(x) {
  return document.getElementById(x);
}

Number.prototype.toPrecisionRound = function(sf) {
    // Convert the number to a string
    let numStr = this.toString();
    
    // Convert the string to a number
    let num = parseFloat(numStr);
    
    // Handle the case where the number is zero
    if (num === 0) {
        return (0).toPrecision(sf);
    }

    // Calculate the factor to shift the decimal point
    const factor = Math.pow(10, sf - Math.ceil(Math.log10(Math.abs(num))));
    
    // Shift the number, round it, and shift it back
    const shifted = Math.round(num * factor);
    const result = shifted / factor;
    
    // Convert the result to string with the required precision
    return result.toPrecision(sf);
};

// Convert string to number and use toPrecisionRound
String.prototype.toPrecisionRound = function(sf) {
    // Convert the string to a number
    let num = parseFloat(this);
    
    // Use the Number prototype method
    return num.toPrecisionRound(sf);
};


function toPrint() {
  event.preventDefault(); // Prevent default form submission or button click behavior

  const labName = $("labName").value; // Retrieve labName from input field
  const userName = $("userName").value; // Retrieve userName from input field

  $("button_bar").style.display = "none";
  
  //alert('Remember to change the destination to "Save as PDF"');
  window.print();
  // This callback will be executed when the PDF generation is complete
  $("button_bar").style.display = "flex";
}

// Function to update a scatter plot with new data
function updateGraph(graphName) {
  const dataArray = getData(graphName);
  const data = dataArray[0];
  //const xAxisLabel = dataArray[1];
  //const yAxisLabel = dataArray[2];

  const chartInstance = chartInstances.find(
    (chart) => chart.graphName === graphName
  );
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
  const title = dataArray[3] ? dataArray[3] : 'y vs x';

  const ctx = $(graphName);
  // Create the chart

  var myChart = new Chart(ctx, {
  type: "scatter",
  data: data,
  options: {
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
      title: {
        display: true, // Show the title
        text: title, // Set the title text
        color: 'black', // Set the title color
        font: {
          size: 18, // Set the title font size
          weight: 'bold' // Set the title font weight
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
    },
    animation: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: xAxisLabel,
          color: "black",
        },
        type: "linear",
        position: "bottom",
        ticks: {
          color: "black",
        },
        grid: {
          color: "lightgrey",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yAxisLabel,
          color: "black",
        },
        type: "linear",
        position: "left",
        ticks: {
          color: "black",
        },
        grid: {
          color: "lightgrey",
        },
      },
    },
  },
});

chartInstances.push({ graphName, instance: myChart });
}

function getData(graphName) {
  const graphNameArray = graphName.split(" ");
  const title = $(graphName).title;
  const name = graphNameArray[0];
  const xAxisLabelName = name + " x-axis";
  const yAxisLabelName = name + " y-axis";
  const xAxisLabel = $(xAxisLabelName) ? $(xAxisLabelName).innerHTML : "";
  const yAxisLabel = $(yAxisLabelName) ? $(yAxisLabelName).innerHTML : "";
  const xyElements = document.getElementsByClassName(graphName);
  let xElementIds = [];
  let yElementIds = [];
  for (var xyElement of xyElements) {
    if (xyElement.id.includes("x")) {
      xElementIds.push(xyElement.id);
    } else if (xyElement.id.includes("y")) {
      yElementIds.push(xyElement.id);
    }
  }
  let xyValues = [];
  let data = {};
  for (let i = 0; i < yElementIds.length; i++) {
    if (
      xyElements[xElementIds[i]].value != "" &&
      xyElements[yElementIds[i]].value != ""
    ) {
      xyValues.push({
        x: xyElements[xElementIds[i]].value * 1,
        y: xyElements[yElementIds[i]].value * 1,
      });
    }
  }

  const slopeintercept = slopeIntercept(xyValues, name);
  const slope = slopeintercept[0].toPrecisionRound(4);
  const intercept = slopeintercept[1].toPrecisionRound(4);
  if($(name + " " + "slope")) {
    $(name + " " + "slope").innerHTML = slope;
    $(name + " " + "slope").value = slope;
  }
  if($(name + " " + "intercept")){
    $(name + " " + "intercept").innerHTML = intercept;
    $(name + " " + "intercept").value = intercept;
  }
  
  const plusElements = document.getElementsByClassName(name + " plus");
  for (var plusElement of plusElements) {
    if (intercept < 0) {
      plusElement.style.display = "none";
    } else {
      plusElement.style.display = null;
    }
  }
  const minusElements = document.getElementsByClassName(name + " minus");
  for (var minusElement of minusElements) {
    if (intercept < 0) {
      minusElement.style.display = null;
    } else {
      minusElement.style.display = "none";
    }
  }
  //$(name+ ' ' + 'slopeintercept').innerHTML = `y = ${slope}x + ${intercept}`;

  data = {
    datasets: [
      {
        label: graphName,
        data: xyValues,
        backgroundColor: "#4169e1",
        borderColor: "black",
        pointRadius: 5,
        pointHoverRadius: 8,
      },
      {
        label: "Trendline",
        data: [
          {
            x: Math.min(...xyValues.map((data) => data.x)),
            y:
              slope * Math.min(...xyValues.map((data) => data.x)) +
              intercept * 1,
          },
          {
            x: Math.max(...xyValues.map((data) => data.x)),
            y:
              slope * Math.max(...xyValues.map((data) => data.x)) +
              intercept * 1,
          },
        ],
        type: "line",
        borderColor: "#4169e1",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };
  return [data, xAxisLabel, yAxisLabel, title];
}

// new function checks to see if there is actually an equation
function evaluateWithCustomFunctions(equation) {
  const scope = {
    ln,
    log10,
    log,
    filter,
  };

  try {
    //console.log(equation);
    // Check if the equation contains only numbers and letters without any mathematical operators
    if (/^[a-zA-Z0-9]+$/.test(equation)) {
      return equation; // Return as-is if it's a simple alphanumeric string
    }

    //console.log("variable2");
    const variable2 = math.evaluate(equation, scope)
      ? math.evaluate(equation, scope)
      : equation;
    //console.log(variable2);
    const variable = math.evaluate(equation, scope);
    //console.log("variable");
    //console.log(variable);
    return math.evaluate(equation, scope);
  } catch (e) {
    //console.log(e);
    return equation;
  }
}

function saveData() {
  const gridItems = document.querySelectorAll(".grid-item");
  let gridObj = {};
  for (var gridItem of gridItems) {
    const id = gridItem.id;
    const textContent = gridItem.textContent;
    gridObj[id] = textContent;
  }
  const gridObjElement = $("gridObjInput");
  if (gridObjElement) {
    gridObjElement.value = JSON.stringify(gridObj);
  }
}

function slopeIntercept(xyValues, name) {
  var slope,
    intercept,
    SX = 0,
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

  slope = (N * SXY - SX * SY) / (N * SXX - SX * SX);

  intercept = (SY - slope * SX) / N;

  console.log("Slope: " + slope + ", Intercept: " + intercept);
  return [slope, intercept];
}

function submitScore() {
  var path = `/score/${params.sessionID}/${score.innerHTML}`;
  document.location = path;
}


function submitAssignment(labName, name, sessionID) {
  let passed = {};
  passed.labName = labName;
  passed.name = name;
  passed.sessionID = sessionID;
  console.log(labName, name, sessionID);
  passed = encodeURI(JSON.stringify(passed));
  var path = `/noscore/${passed}`;
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

  const rows = table.getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName("td");

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

  console.error(
    `Value "${searchValue}" not found in column "${searchColumn}" of the table.`
  );
  return null;
}

function isNotCalcElement(element) {
  return !element.classList.contains("calc");
}

function isFilledOut(element) {
  // Assuming these are form elements like input fields
  return element.value !== undefined && element.value.trim() !== "";
}

function reverseString(string) {
  //new
  let stringArray = string.split("");
  //new
  let reverseArray = stringArray.reverse();
  return reverseArray.join("");
}

function getSigFigs(number) {
  number = number.toString(); // unsure about this
  if (number.includes(".")) {
    number = number.replace(".", "");
    return number.length - number.search(/[123456789]/);
  } else {
    number = reverseString(number);
    return number.length - number.search(/[123456789]/);
  }
}


// ===================== onLoad =====================

function onLoad() {
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  $("name").innerHTML = userName;
  Number.prototype.inRange = function (value, range) {
    // Ensure that value is treated as a number
  value = Number(value);
    let max = 0;
    let min = 0;
    if (value >= 0) {
      if (range.includes("%")) {
        const regex = /(.*?)%/;
        const match = range.match(regex);
        range = match ? match[1] : null;
        max = value + (value * range) / 100;
        min = value - (value * range) / 100;
      } else if (!isNaN(range)) {
        max = value + (value * range) / 100;
        min = value - (value * range) / 100;
      } else {
        max = value;
        min = value;
      }
    } else {
      // if negative
      if (range.includes("%")) {
        const regex = /(.*?)%/;
        const match = range.match(regex);
        range = match ? match[1] : null;
        max = value - (value * range) / 100;
        min = value + (value * range) / 100;
      } else if (!range.isNaN) {
        max = value - (value * range) / 100;
        min = value + (value * range) / 100;
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
  
  document.addEventListener('keydown', function(event) {
    // Check if Shift, Alt, and D keys are pressed together
    if (event.shiftKey && event.altKey && event.code === 'KeyD') {
      if($("button_bar").style.display != 'flex') {
        $("button_bar").style.display = 'flex';
      } else {
        $("button_bar").style.display = 'none';
      }
      
        // Get all elements with the class 'hidden'
        const hiddenElements = document.querySelectorAll('.hidden');
        hiddenElements.forEach(element => {
            // Toggle between 'none' and 'block' for display property
            if (element.style.display === 'none' || element.style.display === '') {
                element.style.display = 'block';               
            } else {
                element.style.display = 'none';
            }
        });
    }
});
  
  // Get all elements with an id attribute
const elements = document.querySelectorAll('[id]');

// Loop through each element and set the name attribute
elements.forEach(element => {
  element.name = element.id;
});

  $("userName").value = `${userName}`;
  if(labName && $("labName")) {$("labName").value = `${labName}`;}
  
  var calcElements = document.getElementsByClassName("calc");

  for (var calc of calcElements) {
    ["click", "change"].forEach(function (event) {
      calc.addEventListener(event, function (e) {
        var formula = this.getAttribute("formula");
        const requiredSigFigs = this.getAttribute("sigfigs")
          ? this.getAttribute("sigfigs")
          : "";
        const range = this.getAttribute("range")
          ? this.getAttribute("range")
          : "5%";
        const regex = /\${(.*?)}/g;
        let matches = null;
        if(formula) {matches = formula.match(regex);}
        
if (matches) {
  for (var match of matches) {
    var elementId = match.replaceAll("${", "").replaceAll("}", "");
    try {
      var element = $(elementId);
      var elementValue = element.value;
      formula = formula.replaceAll(match, elementValue);
    } catch (error) {
      console.error("Error accessing value for elementId:", elementId);
    }
  }
}
        let answer = null;
        if (formula) {answer = evaluateWithCustomFunctions(formula).toString();}
        
        var elementFB = $(this.id + "FB");
        //const value = isNaN(this.value) ? this.value : this.value * 1;
        let value;
        if (this.type=="checkbox") {
        value = this.checked.toString();
      } else {
        value = isNaN(answer) ? this.value : this.value * 1;
    }
        
        const haveSigFigs = getSigFigs(this.value);
        const correctSigFigs = requiredSigFigs == haveSigFigs ? true : false;
        let closeOrCorrect = false;
        if (value !== "") {
          //console.log("value: " + value + " isNaN: " + isNaN(value))
          if (isNaN(answer)) {
          //if (isNaN(value)) {
            // allows the use of || for multiple correct text answers
            //console.log("answer: "+answer)
            const possibleAnswers = answer.split("||").map(ans => ans.trim());
            //console.log(possibleAnswers);
            closeOrCorrect = possibleAnswers.includes(value.toString());
            //console.log('closeOrCorrect' + closeOrCorrect);
            
            // closeOrCorrect = value == answer ? true : false;
          } else {
            closeOrCorrect = value.inRange(answer, range) ? true : false;
          }
          if(elementFB){
          if (!closeOrCorrect) {
            elementFB.title = this.getAttribute("help");
            elementFB.innerHTML =
              '<img src="https://cdn.glitch.global/4375f707-3207-40fe-9935-96f60406c3c1/incorrect.svg?v=1706928334145">';
          } else if (requiredSigFigs && !correctSigFigs) {
            elementFB.title =
              "Incorrect number of significant figures";
            elementFB.innerHTML =
              '<img src="https://cdn.glitch.global/4375f707-3207-40fe-9935-96f60406c3c1/incorrectSF.svg?v=1707138148381">';
          } else {
            elementFB.title = "correct";
            elementFB.innerHTML =
              '<img src="https://cdn.glitch.global/4375f707-3207-40fe-9935-96f60406c3c1/correct.svg?v=1706928329736">';
          }
        }
        }
        if ($("score") && loaded) {
          $("score").click();
        }
      });
    });
    calc.addEventListener("input", function (e) {
      const savebutton = $("savebutton");
      savebutton.click();
      if ($("score") && loaded) {
        $("score").click();
      }
    });
  }

  var lookupElements = document.getElementsByClassName("lookup");

  for (var lookupElement of lookupElements) {
    lookupElement.addEventListener("input", function (e) {
      const id = this.id;
      const neededInID = id + "LV";
      const lookupValueElements = document.querySelectorAll(
        `[id*="${neededInID}"]`
      );
      const calcs = document.querySelectorAll(`[formula*="${neededInID}"]`);
      for (var lookupValueElement of lookupValueElements) {
        lookupValueElement.click();
      }
      for (var calc of calcs) {
        //will cause a save
        calc.click();
      }
    });
  }

  var lookupValueElements = document.getElementsByClassName("lookupValue");

  for (var lookupValueElement of lookupValueElements) {
    lookupValueElement.addEventListener("click", function (e) {
      const tableID = this.getAttribute("tableID");
      const searchColumn = this.getAttribute("searchColumn")
        ? this.getAttribute("searchColumn")
        : 0;
      const lookupID = this.id.split("LV")[0];
      const lookup = $(lookupID);
      const searchValue = lookup.value;
      const returnColumn = this.getAttribute("returnColumn")
        ? this.getAttribute("returnColumn")
        : 1;
      const value = lookupValueInTable(
        tableID,
        searchColumn,
        searchValue,
        returnColumn
      );
      this.value = value;
    });
  }

  var numElements = document.getElementsByClassName("num");

  for (var num of numElements) {
    num.addEventListener("input", function (e) {
      var calcElements = document.getElementsByClassName("calc");
      const numbIdText = "${" + this.id + "}";
      for (var calcElement of calcElements) {
        if (
          calcElement.getAttribute("formula").includes(numbIdText) &&
          calcElement.value != ""
        ) {
          calcElement.click();
        }
      }
      const savebutton = $("savebutton");
      savebutton.click();
      if ($("score") && loaded) {
        $("score").click();
      }
    });
  }
  
  const symbolInputs = document.getElementsByClassName("symbol");
  
    for (var symbolInput of symbolInputs) {
    const symbolDiv = $(symbolInput.id + "DIV");
    
    // Function to format the input text
    function formatText(text) {
        return text.replace(/(\d*)([a-zA-Z]+)([\d+-]*)/g, function(match, p1, p2, p3) {
            // p1: Optional number before letters
            // p2: Letters
            // p3: Numbers, +, or - after the letters

            let formatted = "";
            if (p1) {
                formatted += `<sup>${p1}</sup>`;
            }
            formatted += p2;
            if (p3) {
                formatted += `<sup>${p3}</sup>`;
            }
            return formatted;
        });
    }
      
    symbolInput.addEventListener("blur", function (e) {
      const savebutton = $("savebutton");
      savebutton.click();
      const thisSymbolDiv = $(this.id+'DIV')
       //const formattedText = formatText(symbolInput.value);
        let formattedText = formatText(this.value);
        if(formattedText == "") {formattedText = "&nbsp;"}
       //symbolDiv.innerHTML = formattedText;
        thisSymbolDiv.innerHTML = formattedText;
        //symbolInput.style.display = "none";
        this.style.display = "none";
        //symbolDiv.style.display = "block";
       thisSymbolDiv.style.display = "block";
      
      if ($("score") && loaded) {
        $("score").click();
      }
 
    });
      
      // When the user clicks on the div
    symbolDiv.addEventListener("click", function() {
        const thisSymbolInput = $(this.id.replace(/DIV$/, ""));
        this.style.display = "none";
        thisSymbolInput.style.display = "block";
        
        //if(this.innerHTML == "&nbsp;") {this.innerHTML == ""}
        thisSymbolInput.focus();
    });
      
  }
  
    const subInputs = document.getElementsByClassName("sub");
  
    for (var subInput of subInputs) {
    const subDiv = $(subInput.id + "DIV");
    
    // Function to format the input text
   function formatText(text) {
    return text.replace(/\d+/g, function(match) {
        return '<sub>' + match + '</sub>';
    });
}
      
    subInput.addEventListener("blur", function (e) {
      const savebutton = $("savebutton");
      savebutton.click();
      const thisSubDiv = $(this.id+'DIV')
       let formattedText = formatText(this.value);
       if(formattedText == "") {formattedText = "&nbsp;"}
       
        thisSubDiv.innerHTML = formattedText;
    
        this.style.display = "none";
        
       thisSubDiv.style.display = "block";
      
      if ($("score") && loaded) {
        $("score").click();
      }
 
    });
      
      // When the user clicks on the div
      subDiv.addEventListener("click", function() {
        const thisSubInput = $(this.id.replace(/DIV$/, ""));
        this.style.display = "none";
        thisSubInput.style.display = "block";
        
        //if(this.innerHTML == "&nbsp;") {this.innerHTML == ""}
        thisSubInput.focus();
    });
      
  }
    

  const graphElements = document.getElementsByClassName("graph");

  for (var graphElement of graphElements) {
    graphElement.addEventListener("change", function (e) {
      const savebutton = $("savebutton");
      savebutton.click();
      const graph = $(this.className);
      graph.click();
    });
  }

  const textElements = document.getElementsByClassName("text");
  for (var textElement of textElements) {
    textElement.addEventListener("change", function (e) {
      const savebutton = $("savebutton");
      savebutton.click();
      if ($("score") && loaded) {
        $("score").click();
      }
    });
  }

  const essayElements = document.getElementsByClassName("essay");
  for (var essayElement of essayElements) {
    essayElement.addEventListener("change", function (e) {
      const savebutton = $("savebutton");
      savebutton.click();
      if ($("score") && loaded) {
        $("score").click();
      }
    });
  }

  const feedbackElements = document.getElementsByClassName("feedback");

  for (var feedbackElement of feedbackElements) {
    feedbackElement.addEventListener("click", function (e) {
      alert(this.title);
    });
  }

  const scoreElement = $("score");

  if (scoreElement) {
    scoreElement.addEventListener("click", function (e) {
      // Check if 'loaded' is true
      if (loaded) {
        let dataScore = 0;
        let calcScore = 0;
        let dataFactor = 1;
        let calcFactor = 1;
        // Get elements with the 'num' class
        let numElements = document.getElementsByClassName("num");

        // Convert the HTMLCollection to an array
        let numElementsArray = Array.from(numElements);

        // Filter out elements that do not have the 'calc' class
        let numElementsArrayFiltered =
          numElementsArray.filter(isNotCalcElement);

        if (numElementsArrayFiltered.length > 0) {
        // Filter out elements that are not filled out (assuming these are form elements)
        let filledOutNumElements = numElementsArrayFiltered.filter(isFilledOut);

        dataScore =
          (filledOutNumElements.length / numElementsArrayFiltered.length) * 50;
        } else {
          calcFactor = 2;
        }

        // Get all elements with IDs ending in "FB"
        const fbElements = document.querySelectorAll('[id$="FB"]');
        
        if (fbElements.length > 0) {

        // Initialize a count for elements with the title "correct"
        let countCorrectElements = 0;

        // Iterate through the selected elements
        fbElements.forEach((element) => {
          // Check if the element has the title "correct"
          if (element.getAttribute("title") === "correct") {
            countCorrectElements++;
          }
        });
        
        calcScore = (countCorrectElements / fbElements.length) * 50;
        } else {
          dataFactor = 2;
        }
        const totalScore = dataScore*dataFactor + calcScore*calcFactor;
        $("score").innerHTML = totalScore.toFixed(1);
      }
    });
  }
  
  // imageUpload elements
  
  // Select all elements with the class 'imageUpload'
const imageUploads = document.querySelectorAll('input[type="file"].imageUpload');

for (const imageUpload of imageUploads) {
    imageUpload.addEventListener('change', async function () {
        const file = imageUpload.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('files[]', file);

            try {
                // Upload the file to Glitch assets
                const response = await fetch('/upload/image', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result && result[0] && result[0].url) {
                    const fileUrl = result[0].url;

                    // Get the div ID by modifying the imageUpload's ID
                    const divId = `${imageUpload.id}DIV`;
                    const div = document.getElementById(divId);

                    if (div) {
                        // Insert an image tag inside the div with the file URL
                        div.innerHTML = `<img src="${fileUrl}" alt="Uploaded Image" />`;
                    }

                    // Set the file URL as the imageUpload's value
                    imageUpload.value = fileUrl;
                } else {
                    console.error('File upload failed.');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    });
}

  if (dataFile != null && JSON.stringify(dataFile) != "{}") {
    for (var index in dataFile) {
      const element = $(index);
      if (element) {
        if(element.type == "checkbox") {
        element.checked = dataFile[index];
        } else {
        element.value = dataFile[index];  
        }
      } else {
        console.log(index + " was not found");
      }
    }
  }
  
  // Get all checkbox inputs
var checkBoxes = document.querySelectorAll('input[type=checkbox]');

// Check if at least one checkbox is checked
var isAnyChecked = Array.from(checkBoxes).some(checkBox => checkBox.checked);

if (isAnyChecked) {
  // Iterate through each checkbox
  for (var checkBox of checkBoxes) {
    const checkBoxChecked = checkBox.checked.toString();
    const checkBoxAnswer = checkBox.getAttribute('formula');
    const elementFB = document.getElementById(checkBox.id + 'FB');
    
    // console.log(checkBoxChecked, checkBoxAnswer, checkBox.id, checkBoxChecked == checkBoxAnswer);
    
    // Update the feedback based on whether the checkbox's value matches the expected answer
    if (checkBoxChecked === checkBoxAnswer) {
      elementFB.innerHTML =
        '<img src="https://cdn.glitch.global/4375f707-3207-40fe-9935-96f60406c3c1/correct.svg?v=1706928329736">';
      elementFB.title = "correct";
    } else {
      elementFB.title = checkBox.getAttribute("help");
      elementFB.innerHTML =
        '<img src="https://cdn.glitch.global/4375f707-3207-40fe-9935-96f60406c3c1/incorrect.svg?v=1706928334145">';
    }
  }
} 

  // load graphs
  const graphs = document.querySelectorAll("[id*='graph']");
  for (var graph of graphs) {
    plotNewGraph(graph.id);
  }

  // click calc elements if not empty
  var calcElements = document.getElementsByClassName("calc");
  for (var calcElement of calcElements) {
    if (calcElement.value != "" && calcElement.value != "on" ) { // change
      calcElement.click();
    }
  }

  // click lookupValue elements if lookup not empty
  var lookupValueElements = document.getElementsByClassName("lookupValue");
  for (var lookupValueElement of lookupValueElements) {
    const id = lookupValueElement.id;
    const lookupID = id.split("LV")[0];
    const lookupElement = $(lookupID);
    if (lookupElement.value != "") {
      lookupValueElement.click();
    }
  }

  // JavaScript to handle the form submission
  const form = $("labdataform");

  form.addEventListener("submit", async (event) => {
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
        method: "POST",
        body: JSON.stringify(formData), // Convert the object to JSON before sending
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if the request was successful (status 200-299)
      if (response.ok) {
        // Optionally, you can show a success message to the user
        console.log("Data saved successfully!");
      } else {
        // Handle the case when the request fails (e.g., show an error message)
        alert("Failed to save data.");
      }
    } catch (error) {
      // Handle any network-related errors
      alert("Network error occurred.");
    }
  });

  const gridItems = document.querySelectorAll(".grid-item");
  gridItems.forEach((item) => {
    let state = 0;
    item.addEventListener("click", () => {
      const statesArray = item.getAttribute("states").split(",");
      state = (state + 1) % statesArray.length;
      item.textContent = statesArray[state];
      const savebutton = $("savebutton");
      savebutton.click();
    });
  });

  const gridObjElement = $("gridObjInput");
  let gridObj = {};
  if (gridObjElement) {
    gridObj = gridObjElement.value ? JSON.parse(gridObjElement.value) : {};
  }

  for (var gridItemElementID in gridObj) {
    $(gridItemElementID).textContent = gridObj[gridItemElementID];
  }

  window.addEventListener("beforeprint", (event) => {
    document.title = labName + "_" + userName;
  });

  window.addEventListener("afterprint", (event) => {
    document.title = labName;
  });
  loaded = true;
  if ($("score")) {
    $("score").click();
  }
} // ================= end onLoad ====================
