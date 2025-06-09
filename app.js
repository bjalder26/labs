
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
const http = require('http');
const path = require('path');
const fileUpload = require('express-fileupload');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var uuid = require("uuid4");
var lti = require("ims-lti");
var fs = require('fs');

// create a new express server
var app = express();



app.use(fileUpload()); // for file uploads from input
app.use(express.urlencoded({ // increases the limit on what is sent via url not sure if this is needed anymore
  limit: '50mb',
  extended: true, // not sure about
  parameterLimit: 50000
}));
app.use(express.json({limit: '50mb'})); // increases the limit on what is sent

// Serve the uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/html', express.static(__dirname + '/html/'));
app.use('/images', express.static(__dirname + '/images/'));
app.use('/users', express.static(__dirname + '/users/'));
app.use('/submissions', express.static(__dirname + '/submissions/'));
app.use('/js', express.static(__dirname + '/js/'));
app.use('/css', express.static(__dirname + '/css/'));
app.use('/lab', express.static(path.join(__dirname, 'lab')));

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


function readLabList(labFolder) {
    return new Promise((resolve, reject) => {
        fs.readdir(labFolder, (err, files) => {
            if (err) {
                console.log(`Error reading the lab folder: ${err}`);
                return reject(`Error reading the lab folder: ${err}`);
            }
         
            const lowerCaseFiles = filesToLowerCase(files);
      
            resolve(lowerCaseFiles);
        });
    });
}

// Function to find student names based on selected lab
function findStudents(labName) {
    try {
        const labPrefix = capitalizeEveryWord(labName) + '_';
 

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

function filesToLowerCase(files) {
    return files
        .map(file => file.toLowerCase())
        .map(file => file.replace('.html', ''));
}

app.post('/upload/image', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Retrieve the uploaded file
    const uploadedFile = req.files.file;

    // Define the path to save the file (for demonstration, save it in the 'public/uploads' directory)
    const uploadPath = path.join(__dirname, 'public/uploads', uploadedFile.name);

    // Move the file to the server
    uploadedFile.mv(uploadPath, function (err) {
        if (err) {
            return res.status(500).send(err);
        }

        // Return the URL to access the uploaded file
        res.json({
            url: `/uploads/${uploadedFile.name}`
        });
    });
});

app.post("/", async (req, res) => {
    const isFake = req.body.fake_launch === 'true';
    const sessionID = uuid();

    let lmsData;

    async function proceedWithLaunch(lmsData) {
        try {
        const name = lmsData.body.lis_person_name_full.replaceAll("'", "");
        let labHtml = '';
        let dataFile = {};
        let labName = '';
        let lower = lmsData.body.custom_canvas_assignment_title.toLowerCase();

        const labFolder = './lab';
        let labList;
        try {
            labList = await readLabList(labFolder);
        } catch (error) {
            console.error(error);
            res.send("Error reading lab list.");
            return;
        }

        if (labList.includes(lmsData.body.resource_link_title.toLowerCase())) {
            labName = capitalizeEveryWord(lmsData.body.resource_link_title);
            const filepath = path.join(__dirname, 'submissions', `${labName}_${name}.txt`);
            if (!fs.existsSync(filepath)) {
                fs.writeFileSync(filepath, '{}', 'utf8');
            }

            labHtml = fs.readFileSync(path.join(__dirname, "lab", `${labName}.html`), "utf8");
            dataFile = fs.readFileSync(filepath, "utf8");
        } else {
            labHtml = 'Invalid title' +
                '<br>lmsData.body.resource_link_title.toLowerCase(): ' + lmsData.body.resource_link_title.toLowerCase() +
                '<br>labList.toString(): ' + labList.toString();
        }

        labHtml = labHtml.replace('</head>', '<style>#button_bar{display:flex;}</style></head>');
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
    } catch(err) {
        console.error('Error during launch:', err);
        res.status(500).send('Internal Server Error');
    }
    }

    if (isFake) {
        // Manually mock the structure of lmsData
        lmsData = {
            body: req.body
        };
        sessions[sessionID] = lmsData;
        proceedWithLaunch(lmsData);
        return;
    }

    lmsData = new lti.Provider("top", "secret");

    if (req.body.roles.includes('Instructor')) {
        res.redirect("/instructor");
        return;
    }

    lmsData.valid_request(req, async (err, isValid) => {
        if (!isValid) {
            res.send("Invalid request: " + err);
            return;
        }

        sessions[sessionID] = lmsData;
        proceedWithLaunch(lmsData);
    });

    
});
       // app.post("/");

// Route to get lab list
app.get('/labList', async (req, res) => {
  const labList = await readLabList(__dirname + '/lab');
  
    res.json(labList);
});

// Route to get students based on selected lab
app.get('/students/:labName', (req, res) => {
    const labName = req.params.labName;
  console.log('labName');
    console.log(labName);
    const students = findStudents(labName);
  console.log('students');
    console.log(students);
    res.json(students);
});

app.get("/instructor", (req, res) => {	
		let instructorHtml = fs.readFileSync(__dirname + "/html/instructor.html", "utf8");
		res.setHeader("Content-Type", "text/html");
		res.send(instructorHtml);
	
});       // app.post("/");


app.get('/noscore/:passed', (req, res) => {
    
    let passed = decodeURI(req.params.passed);
    passed = JSON.parse(passed);
    const labName = passed.labName
    const name = passed.name;
    const sessionID = passed.sessionID;
    //const { labName, name, sessionID } = decodeURI(req.params.passed);
    var session = sessions[sessionID];

    let resp = '';
  
    const encodedLabName = encodeURIComponent(labName);
let passedInfo = {};
  passedInfo.labName = labName;
  passedInfo.name = name;
  passedInfo.sessionID = sessionID;
    
    passedInfo = encodeURIComponent(JSON.stringify(passedInfo));

//const baseUrl = 'https://elfin-ten-marble.glitch.me'; // fix this later
 const baseUrl = `${req.protocol}://${req.get('host')}`;

const dynamicUrl = `${baseUrl}/dynamic-content/${passedInfo}`;
 
    session.outcome_service.send_replace_result_with_url(1, dynamicUrl, (err, isValid) => {
        if (err) {
            console.error('Error:', err);
            resp += `<br/>Update failed: ${err.message || err}`;
            return res.send(resp);
        } else if (!isValid) {
            console.warn('Invalid response');
            resp += `Update failed: Close this window, return to Canvas, and resubmit assignment.`;
            return res.send(resp);
        } else {
            resp += 'Assignment submitted.  Close this window and check your submission in Canvas.';
            
            // Now delete the score
            session.outcome_service.send_delete_result((err, result) => {
                if (err) {
                    console.error('Error:', err);
                    resp += `<br/>Delete failed. Score erroneously entered.  Instructor will manually correct assignment grade. <br> ${err.message || err}`;
                } else {
                    resp += '<br/>Instructor will manually grade assignment.';
                }
                
         
                res.send(resp);
            });
        }
    });
});

app.get('/dynamic-content/:passed', (req, res) => {
  
   let passed = decodeURI(req.params.passed);
    passed = JSON.parse(passed);
    const labName = passed.labName;
    const name = passed.name;
    const sessionID = passed.sessionID;
    
   // Read the static HTML file
    const labHtml = fs.readFileSync(__dirname + "/lab/" + labName + ".html", "utf8");

    // Read the dynamic data file based on the student's name and lab name
    const dataFile = fs.readFileSync(__dirname + "/submissions/" + labName + "_" + name  +  ".txt", "utf8");

    // Insert the dynamic data into the HTML
    const sendMe = labHtml.replace("//PARAMS**GO**HERE",
        `
            var userName = '${name}';
            var dataFile = ${dataFile};
            var labName = '${labName}';
            var params = {
                sessionID: "${sessionID}",
                user: "${name}"
            };
        `);

    // Serve the generated HTML
    res.setHeader("Content-Type", "text/html");
    res.send(sendMe);
});

app.get('/fakelaunch/:labTitle', (req, res) => {
  const labTitle = decodeURIComponent(req.params.labTitle);
  const html = `
    <form id="launchForm" action="/" method="post" enctype="application/x-www-form-urlencoded">
      <input type="hidden" name="oauth_consumer_key" value="top" />
      <input type="hidden" name="roles" value="Learner" />
      <input type="hidden" name="lis_person_name_full" value="Tester" />
      <input type="hidden" name="custom_canvas_assignment_title" value="Fake Assignment" />
      <input type="hidden" name="resource_link_title" value="${labTitle}" />
      <input type="hidden" name="resource_link_id" value="abc123" />
      <input type="hidden" name="user_id" value="test-user" />
      <input type="hidden" name="lti_version" value="LTI-1p0" />
      <input type="hidden" name="lti_message_type" value="basic-lti-launch-request" />
      <input type="hidden" name="fake_launch" value="true" />
    </form>
    <script>document.getElementById('launchForm').submit();</script>
  `;
  res.send(html);
});

app.get("/:lab/:name", async (req, res) => {	


    let name =  decodeURIComponent(req.params.name);
		
		let labHtml = '';
		let dataFile = {};
		let labName =  decodeURIComponent(req.params.lab);
		let lower = labName.toLowerCase();
    
    const labList = await readLabList(__dirname + '/lab'); //here
  
		if(labList.includes(lower)) {
		labName = capitalizeEveryWord(labName);
		// creates user data file if it doesn't exist *** make this a function? ***
		if (!fs.existsSync(__dirname + '/submissions/' + labName + '_' + name  +  '.txt')){
			fs.writeFileSync(__dirname + '/submissions/' + labName + '_' + name  +  '.txt', '{}', 'utf8');
			}	
			
		labHtml = fs.readFileSync(__dirname + "/lab/" + labName + ".html", "utf8");
		dataFile = fs.readFileSync(__dirname + "/submissions/" + labName + "_" + name  +  ".txt", "utf8");
	

		} else {
      labHtml = 'Invalid title or student';
		  labHtml += 'Invalid title: ' + labName + "<br>" + lower + "<br>labList: " + labList;
      labHtml += '<br>name: ' + name;
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
	
});

app.get("/score/:sessionID/:score", (req, res) => {

	var session = sessions[req.params.sessionID];
	var score = req.params.score;
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

// Route for the root path — always blocks refresh
app.get('/', (req, res) => {
  res.status(403).send('Sorry, you cannot refresh this window in the browser. Refresh your Canvas assignment, and reopen the lab from the link in that assignment.');
});

// Explicit route for /dev — shows lab list
app.get('/dev', (req, res) => {
  const labDir = path.join(__dirname, 'lab');

  fs.readdir(labDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan lab directory');
    }

    const htmlFiles = files.filter(file => file.endsWith('.html'));
    let links = '<h1>HTML Files in the "lab" Folder:</h1><ul>';

    htmlFiles.forEach(file => {
      links += `<li><a href="/lab/${file}">${file}</a></li>`;
    });

    links += '</ul>';
    res.send(links);
  });
});


app.post('/save', (req, res) => {

  const obj = JSON.parse(JSON.stringify(req.body));

  let userName = obj.userName;
  let labName = obj.labName;

    try {
		
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
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

