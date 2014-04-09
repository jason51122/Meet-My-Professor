var express = require('express');
var anyDB = require('any-db');
var colors = require('colors');
var engines = require('consolidate');

// db connection
var dbstr = "mmp";
var conn = anyDB.createConnection('sqlite3://'+dbstr+'.db');

var ndigits = 6;
var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// generate identifier
function generateIdentifier() {
	// make a list of legal characters
	// we're intentionally excluding 0, O, I, and 1 for readability
	var i, result = '';
	for (i = 0; i < 6; i++)
	result += chars.charAt(Math.floor(Math.random() * chars.length));

	return result;
}

var app = express();

// the render engine
app.engine('html',engines.hogan);
app.set('views','templates');

// bodyParser for post requests
app.use(express.static('public'));
app.use(express.bodyParser());

// create a new calendar
app.get('/create/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	console.log(request.params.calLink);
	
	calLink = request.params.calLink;
	conn.query('SELECT * FROM calTable WHERE calLink=$1;', [calLink], function(error, result){
		if (null != error){
			console.log(error);
			response.send(error);
		}

		if (0 === result.rowCount) {
			response.render('professor-template.html', {
				calLink: calLink,
			});
		}
		else {
			response.redirect('/');
		}
	});
});

function createNewCal(request, response){
	var id = 'cal-'+generateIdentifier();

	conn.query('SELECT * FROM calTable WHERE calId=$1;', [id], function(error, result){
		if (null != error){
			console.log(error);
			return;
		}
		if (0 !== result.rowCount) {
			createNewCal(request, response);
		}
		else {
<<<<<<< HEAD
			conn.query('INSERT INTO calTable VALUES($1, $2, $3, $4, $5, strftime("%s", $6), $7, $8, $9);', 
				[id, 'http://www.google.com/calendar/feeds/' + request.params.calLink + '/public/basic', 
				request.body.calDesp, request.body.name, request.body.email, request.body.expireDate, 
				request.body.startTime, request.body.endTime, request.body.interim], function(error, result){
=======
			conn.query('INSERT INTO calTable VALUES($1, $2, $3, $4, $5, strftime("%s", $6), $7, $8, $9);', [id, request.params.calLink, request.body.calDesp, request.body.name, request.body.email, request.body.expireDate, request.body.startTime, request.body.endTime, request.body.interim], function(error, result){
>>>>>>> 59929d948c05c7f062e7a7ac0a6f742bcbd80354
				if (null !== error){
					console.log(error);
					return;
				}
				
				console.log('Create new calendar: '.red, id.green);
				response.send('Calendar ' + id + ' has been created.');
			});
		}
	});
}

app.post('/create/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	createNewCal(request, response);
});

app.get('/update/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	
	calLink = request.params.calLink;
	conn.query('SELECT calID, calLink, calDesp, name, email, date(expireDate,"unixepoch") AS expireDate, startTime, endTime, interim FROM calTable WHERE calLink=$1;', [calLink], function(error, result){
		if (null != error){
			console.log(error);
			response.send(error);
		}
		if (0 !== result.rowCount) {
			console.log(result.rows[0])
			response.render('professor-template.html', {
				calID: result.rows[0].calID,
				calLink: result.rows[0].calLink,
				calDesp: result.rows[0].calDesp,
				name: result.rows[0].name,
				email: result.rows[0].email,
				expireDate: result.rows[0].expireDate,
				startTime: result.rows[0].startTime,
				endTime: result.rows[0].endTime,
				interim: result.rows[0].interim
			});
		}
		else {
			response.redirect('/');
		}
	});
});

app.post('/update/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	
	calLink = request.params.calLink;
	
	conn.query('UPDATE calTable SET calDesp=$1, name=$2, email=$3, expireDate=strftime("%s", $4), startTime=$5, endTime=$6, interim=$7 WHERE calLink=$8;', [request.body.calDesp, request.body.name, request.body.email, request.body.expireDate, request.body.startTime, request.body.endTime, request.body.interim, calLink], function(error){
		if (null != error){
			console.log(error);
			return;
		}
		else {
			conn.query('SELECT * FROM calTable WHERE calLink=$1;', [calLink], function(error, result){
				if (null !== error){
					console.log(error);
					return;
				}
				console.log(result.rows[0]);
				console.log('Update calendar: '.red, result.rows[0].calID.green);
				response.send('Calendar ' + result.rows[0].calID + ' has been updated.');
			});
		}
	});
});

app.get('/calendar/:calID', function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);

	conn.query('SELECT * FROM calTable WHERE calID=$1;', [request.params.calID], function(error, result){
		if (null != error){
			console.log(error);
			response.send(error);
		}

		if (0 === result.rowCount)
		response.send('Could not find this calendar!');

		response.render('student-template.html',result.rows[0]);
	});
});

function createNewResv(response, detail){
	var id = 'resv-'+generateIdentifier();

	conn.query('SELECT * FROM resvTable WHERE resvID=$1;', [id], function(error, result){
		if (null != error){
			console.log(error);
			response.send(error);
			return;
		}
    	
		if (0 !== result.rowCount)
		createNewResv(response, detail);
		else {
			detail.unshift(id);

			// send email to both the reserver and the calendar owner
			// check the accessibility of the emails

			conn.query('INSERT INTO resvTable VALUES($1,$2,$3,$4,$5,$6,$7);', detail.slice(0,6), function(error, result){
				if (null !== error){
					console.log(error);
					response.send(error);
					return;
				}

				console.log('* CREATE new reservation: '.red, id.green);
				var respObj = new Object();
				respObj.state = '1';
				sendReservations(response, respObj, detail[1]);
			});
		}
	});
}

// post submit requests
app.post('/calendar/submit', function(request, response){
	console.log('- Submit received:', request.method.cyan, request.url.underline);
	var detail = request.body.detail;

	// there are still some potential synchronization issues
	// use a event queue for each calendar might be the best practice

	// check some confilicts in the database
	conn.query('SELECT * FROM resvTable WHERE calID = $1 AND (($2 >= startTime AND $2 <= endTime)'
	+' OR ($3 >= startTime AND $3 <= endTime) OR ($2 < startTime AND $3 > endTime)) LIMIT 1;',
	[detail[0],detail[4],detail[5]], function(error, result){

		if (null != error){
			console.log(error);
			response.send(error);
			return;
		}

		if (0 !== result.rowCount){
			// find a confilict, ask client to reserve again
			var respObj = new Object();
			respObj.state = '0';
			sendReservations(response, respObj, detail[0]);
			return;
		}

		// so far so good
		createNewResv(response, detail);
	});
});

function sendReservations(response, respObj, calID){
	conn.query('SELECT startTime,endTime FROM resvTable WHERE calID = $1;', 
	[calID],
	function(error,result){
		if (null !== error){
			console.log(error);
		} else {
			respObj.data = result.rows;
			response.json(respObj);
		}
	});
}

// pulling
app.get('/calendar/pulling/:calID',function(request,response){
	console.log('- Pulling received:', request.method.cyan, request.url.underline);

	var respObj = new Object();
	sendReservations(response, respObj, request.params.calID);
});

// app.get('/search/:what', function(request, response){
// 	console.log('- Search received:', request.method.cyan, request.url.underline);

// 	var search = request.params.what.trim();

// 	if (10 === search.length && 'cal-' === search.substr(0,4)){
// 		// search by calendar ID
// 		response.redirect('/calendar/'+search);
// 		return;
// 	}

// 	if (5 < search.length && 
// 		('http:' === search.substr(0,5) || 'https:' === search.substr(0,6))){
// 			// create new calendar
// 		}

// 		// search by owner name
// });

app.get('/searchResult', function(request, response){
	console.log("getting here");
	// response.render('searchresult.html');
	var array = [];
	var search_results = conn.query('SELECT * FROM calTable WHERE name LIKE $1', ["%" + request.query.query + "%"]);
	search_results.on('row', function(row){
		array.push({
			"name" : row.name, 
			"email": row.email,
			"desc" : row.calDesp

		});
		
		// array.push(row.name);
		// array.push(row.email);
		// array.push(row.calDesp);
	})
	.on('end', function() {
		// response.json(array);
		console.log(array);
		response.render('searchresult.html', {results: array});
		// response.render('searchresults.html', array[0]);
	});

});

// by default
app.get('*',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	response.render('index1-template.html');
});

//Visit localhost:8080
app.listen(8080, function(){
	console.log('- Server listening on port 8080'.grey);
});