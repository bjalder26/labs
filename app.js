
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
const http = require('http');
const path = require('path');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var uuid = require("uuid4");
var lti = require("ims-lti");
var fs = require('fs');

// create a new express server
var app = express();

app.use(express.urlencoded({ // increases the limit on what is sent via url not sure if this is needed anymore
  limit: '50mb',
  extended: true, // not sure about
  parameterLimit: 50000
}));
app.use(express.json({limit: '50mb'})); // increases the limit on what is sent

app.use('/html', express.static(__dirname + '/html/'));
app.use('/images', express.static(__dirname + '/images/'));
app.use('/users', express.static(__dirname + '/users/'));
app.use('/submissions', express.static(__dirname + '/submissions/'));
app.use('/js', express.static(__dirname + '/js/'));
app.use('/css', express.static(__dirname + '/css/'));

// I believe this allows for http vs https only
app.enable('trust proxy');


var sessions = {};

function capitalizeEveryWord(str) {
    return str.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.post("*", require("body-parser").urlencoded({extended: true}));


function readLabList() {
    const labFolder = './lab';

    try {
        const files = fs.readdirSync(labFolder);

        // Remove the .html extension from each file name
        const labList = files.map(file => path.basename(file, '.html'));

        return labList;
    } catch (error) {
        console.error(`Error reading the lab folder: ${error}`);
        return [];
    }
}

/*
// Function to read the lab list from the text file
function readLabList() {
  
    try {
        const labListText = fs.readFileSync('labList.txt', 'utf8');
        const labList = JSON.parse(labListText);
        const capitalizedLabList = labList.map(capitalizeEveryWord);
        return capitalizedLabList;
    } catch (error) {
        console.error('Error reading lab list:', error);
        return [];
    } 
}
*/

// Function to find student names based on selected lab
function findStudents(labName) {
    try {
        const labPrefix = labName + '_';
        const submissionsFolder = __dirname + '/submissions';
        const files = fs.readdirSync(submissionsFolder);
        const students = files
            .filter(file => file.startsWith(labPrefix))
            .map(file => file.split('_')[1].split('.')[0]);
        return students;
    } catch (error) {
        console.error('Error finding students:', error);
        return [];
    }
}

app.post("/", (req, res) => {	
	var lmsData = new lti.Provider("top", "secret");
  
  if(req.body.roles.includes('Instructor')) {
    res.redirect("/instructor");
  }
  
	lmsData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = lmsData;
		
		const name = lmsData.body.lis_person_name_full;
		console.log('name: ' + name);
		let labHtml = '';
		let dataFile = {};
		let labName = '';
		let lower = lmsData.body.custom_canvas_assignment_title.toLowerCase();
    
    //let labList = ['exploring density properties', 'exploring density properties 2', 'dimensional analysis', 'dimensional analysis online', 'empirical formula of magnesium oxide', 'limiting reactant', 'empirical formula of a compound online', 'freezing point depression lab', 'acetone iodine kinetics lab', 'antacids lab'];
    
// Specify the directory
const labFolder = './lab';
let labList = [];
// Read the directory
fs.readdir(labFolder, (err, files) => {
    if (err) {
        console.error(`Error reading the lab folder: ${err}`);
        return;
    }

    // Convert file names to lowercase and store them in an array
    labList = files.map(file => file.toLowerCase());
    console.log('labList');
    console.log(labList);
});
    
    
		if(labList.includes(lmsData.body.resource_link_title.toLowerCase())) {
		labName = capitalizeEveryWord(lmsData.body.resource_link_title);
		// creates user data file if it doesn't exist *** make this a function? ***
		if (!fs.existsSync(__dirname + '/submissions/' + labName + '_' + name  +  '.txt')){
			fs.writeFileSync(__dirname + '/submissions/' + labName + '_' + name  +  '.txt', '{}', 'utf8');
			}	
			
		labHtml = fs.readFileSync(__dirname + "/lab/" + labName + ".html", "utf8");
		dataFile = fs.readFileSync(__dirname + "/submissions/" + labName + "_" + name  +  ".txt", "utf8");
		console.log('dataFile');
		console.log(dataFile);

		} else {
		labHtml = 'Invalid title: ' + '<br>lmsData.body.resource_link_title: ' + lmsData.body.resource_link_title + '<br>labList.toString(): '  + labList.toString(); // list just above => should get from lab file
		}
		
		var sendMe = labHtml.toString().replace("//PARAMS**GO**HERE",
				`
						var userName = '${name}';
						var dataFile = ${dataFile};
						var labName = '${labName}';
						var params = {
						sessionID: "${sessionID}",
						user: "${name}"
					};
				`);

        

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	});   // lmsDate.valid_request
	
});       // app.post("/");

// Route to get lab list
app.get('/labList', (req, res) => {
    const labList = readLabList();
    res.json(labList);
});

// Route to get students based on selected lab
app.get('/students/:labName', (req, res) => {
    const labName = req.params.labName;
    const students = findStudents(labName);
    res.json(students);
});

app.get("/instructor", (req, res) => {	
		let instructorHtml = fs.readFileSync(__dirname + "/html/instructor.html", "utf8");
		res.setHeader("Content-Type", "text/html");
		res.send(instructorHtml);
	
});       // app.post("/");



app.get("/:lab/:name", (req, res) => {	
  console.log('lab: ' + req.params.lab + " name: " + req.params.name);
		//const name = lmsData.body.lis_person_name_full;
    let name =  decodeURIComponent(req.params.name);
		console.log('name: ' + name);
		let labHtml = '';
		let dataFile = {};
		let labName =  decodeURIComponent(req.params.lab);
		let lower = labName.toLowerCase();
    
    let labList = fs.readFileSync(__dirname + "/labList.txt", "utf8");
  
    //let labList = ['exploring density properties', 'dimensional analysis', 'dimensional analysis online', 'empirical formula of magnesium oxide', 'empirical formula of a compound online'];
    
		if(labList.includes(lower)) {
		labName = capitalizeEveryWord(labName);
		// creates user data file if it doesn't exist *** make this a function? ***
		if (!fs.existsSync(__dirname + '/submissions/' + labName + '_' + name  +  '.txt')){
			fs.writeFileSync(__dirname + '/submissions/' + labName + '_' + name  +  '.txt', '{}', 'utf8');
			}	
			
		labHtml = fs.readFileSync(__dirname + "/lab/" + labName + ".html", "utf8");
		dataFile = fs.readFileSync(__dirname + "/submissions/" + labName + "_" + name  +  ".txt", "utf8");
		console.log('dataFile');
		console.log(dataFile);

		} else {
      labHtml = 'Invalid title or student';
		//labHtml = 'Invalid title: ' + JSON.stringify(lmsData.body) + ' ' + lmsData.body.resource_link_title + ' ' + typeof lmsData.body.custom_canvas_assignment_title + ' x ' + lower;
		}
		
		var sendMe = labHtml.toString().replace("//PARAMS**GO**HERE",
				`
						var userName = '${name}';
						var dataFile = ${dataFile};
						var labName = '${labName}';
						var params = {
						user: "${name}"
					};
				`);

        

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	   // lmsDate.valid_request
	
});       // app.post("/");


app.get("/score/:sessionID/:score", (req, res) => {

	var session = sessions[req.params.sessionID];
	console.log('req');
	console.log(JSON.stringify(req.params));
	console.log(JSON.stringify(req.session));
	console.log('session');
	console.log(JSON.stringify(session));
	console.log('sessions');
	console.log(JSON.stringify(sessions));
	console.log('sessionID');
	console.log(req.params.sessionID);
	var score = req.params.score;
	console.log(score/100);
	var resp = `Your score of ${score}% has been recorded`;

  
	session.outcome_service.send_replace_result(score/100, (err, isValid) => {
    if (err) {
        console.error('Error:', err);
        resp += `<br/>Update failed: ${err.message || err}`;
    } else if (!isValid) {
        console.warn('Invalid response');
        resp += `<br/>Update failed: Invalid response`;
    } else {
        resp += '<br/>Update successful';
    }

		res.send(resp);
	}); 

});    // app.get("/score...")


app.get("/noscore/:sessionID/:passed", (req, res) => { // working here
    const { labName, name, sessionID } = passed.names;
    let resp = '';
    //var resp = `Your score of ${noscore}% has been recorded`;
  
  const labHtml = fs.readFileSync(path.join(__dirname, 'lab', `${labName}.html`), 'utf8');
    const dataFile = fs.readFileSync(path.join(__dirname, 'submissions', `${labName}_${name}.txt`), 'utf8');
  
  const sendMe = labHtml.replace("//PARAMS**GO**HERE",
        `
            var userName = '${name}';
            var dataFile = ${JSON.stringify(dataFile)};
            var labName = '${labName}';
            var params = {
                sessionID: "${sessionID}",
                user: "${name}"
            };
        `);
  
  
    const dynamicUrl = `http://yourserver.com/dynamic-content/${labName}/${name}?sessionID=${sessionID}`;
    session.outcome_service.send_replace_result_with_url('0', 'https://www.google.com', (err, isValid) => {
        if (err) {
            console.error('Error:', err);
            resp += `<br/>Update failed: ${err.message || err}`;
            return res.send(resp);
        } else if (!isValid) {
            console.warn('Invalid response');
            resp += `<br/>Update failed: Invalid response`;
            return res.send(resp);
        } else {
            resp += '<br/>Update successful';
            
            // Now delete the score
            session.outcome_service.send_delete_result((err, result) => {
                if (err) {
                    console.error('Error:', err);
                    resp += `<br/>Delete failed: ${err.message || err}`;
                } else {
                    resp += '<br/>Score deleted successfully';
                }
                
                console.log(result);
                res.send(resp);
            });
        }
    });
});











app.post('/save', (req, res) => {
  console.log('obj:');
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log(JSON.stringify(obj));
  let userName = obj.userName;
  let labName = obj.labName;
  console.log(userName)
  console.log(labName)
    try {
		console.log(labName)
    fs.writeFileSync(__dirname + "/submissions/" + labName + "_" + userName + ".txt", JSON.stringify(obj), {
      flag: 'w+'
    });
    console.log("File written successfully");
  } catch (err) {
    console.error('qbank write: ' + err);
  }
  res.json({ success: true });
});


// get the app environment from Cloud Foundry
// seems to be getting the app environment to know which port
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
// app.listen([port[, host[, backlog]]][, callback])
// not sure why 0.0.0.0 needed
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
