
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
const http = require('http');

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


app.post("/module_1", (req, res) => {
	console.log('in');
	
	var lmsData = new lti.Provider("top", "secret");
	lmsData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = lmsData;
		
		
		res.send(lmsData.body);
	});   // lmsDate.valid_request
	
});       // app.post("/module_1");



app.post("/", (req, res) => {	
    console.log('in2');
	var lmsData = new lti.Provider("top", "secret");
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
    
    let labList = ['exploring denisty properties', 'dimensional analysis'];
    
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
		labHtml = 'Invalid title: ' + JSON.stringify(lmsData.body) + ' ' + lmsData.body.resource_link_title + ' ' + typeof lmsData.body.custom_canvas_assignment_title + ' x ' + lower;
		}
		
		var sendMe = labHtml.toString().replace("//PARAMS**GO**HERE",
				`
						var userName = '${name}';
						var dataFile = ${dataFile};
						var labName = '${labName}';
						var params = {
						sessionID: "${sessionID}",
						user: "${lmsData.body.ext_user_username}"
					};
				`);

        

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	});   // lmsDate.valid_request
	
});       // app.post("/");

/*

app.post("/module_3", (req, res) => {	
	var lmsData = new lti.Provider("top", "secret");
	lmsData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = lmsData;
	
		var sendMe = mod3File.toString().replace("//PARAMS**GO**HERE",
				`
					var params = {
						sessionID: "${sessionID}",
						user: "${lmsData.body.ext_user_username}"
					};
				`);

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	});   // lmsDate.valid_request
	
});       // app.post("/module_3");

app.post("/module_4", (req, res) => {	
	var lmsData = new lti.Provider("top", "secret");
	lmsData.valid_request(req, (err, isValid) => {
		if (!isValid) {
			res.send("Invalid request: " + err);
			return ;
		}
		
		var sessionID = uuid();
		sessions[sessionID] = lmsData;
	
		var sendMe = mod4File.toString().replace("//PARAMS**GO**HERE",
				`
					var params = {
						sessionID: "${sessionID}",
						user: "${lmsData.body.ext_user_username}"
					};
				`);

		res.setHeader("Content-Type", "text/html");
		res.send(sendMe);
	});   // lmsDate.valid_request
	
});       // app.post("/module_4");

app.get("/grade/:sessionID/:grade", (req, res) => {
	const session = sessions[req.params.sessionID];
	var grade = req.params.grade;
	var resp;
	
	if (grade < 60) {
		resp = `${grade} is too low. How about sixty instead?`;
		grade = 60;
	} else if (grade > 90) {
		resp = `${grade} is too high. How about ninety instead?`;
		grade = 90;		
 	} else {
 		resp = `${grade} sounds reasonable, sure.`;
 	}
	
	session.outcome_service.send_replace_result(grade/100, (err, isValid) => {
		if (!isValid)
			resp += `<br/>Update failed ${err}`;

		res.send(resp);
	});

});    // app.get("/grade...")
*/

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
		if (!isValid)
			resp += `<br/>Update failed ${err}`;

		res.send(resp);
	});

});    // app.get("/score...")


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
