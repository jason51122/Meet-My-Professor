var express = require('express');
var anyDB = require('any-db');
var colors = require('colors');
var engines = require('consolidate');

// db connection
var dbstr = "mmp";
var conn = anyDB.createConnection('sqlite3://'+dbstr+'.db');

// lib for making reservation
var resv = require('./lib/resv');
resv.setConn(conn);

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

function validateCalLink(calLink) 
{
	var re = /\S+@\S+\.\S+/;
	return re.test(calLink);
}

// create a new calendar
app.get('/create/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	console.log(request.params.calLink);
	
	var calLink = request.params.calLink;
	if (!validateCalLink(calLink)) {
		response.redirect('/');
	}
	
	calLink = 'http://www.google.com/calendar/feeds/' + calLink + '/public/basic';
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
			conn.query('INSERT INTO calTable VALUES($1, $2, $3, $4, $5, strftime("%s", $6), $7, $8, $9);', 
				[id, 'http://www.google.com/calendar/feeds/' + request.params.calLink + '/public/basic', 
				request.body.calDesp, request.body.name, request.body.email, request.body.expireDate, 
				request.body.startTime, request.body.endTime, request.body.interim], function(error, result){
				if (null !== error){
					console.log(error);
					return;
				}

				console.log('Create new calendar: '.red, id.green);
				response.send(id);
			});
		}
	});
}

app.post('/create/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	createNewCal(request, response);
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

// post submit requests
app.post('/calendar/submit', function(request, response){
	console.log('- Submit received:', request.method.cyan, request.url.underline);
	resv.submitHandler(request, response, conn);
});

// pulling
app.get('/calendar/pulling/:calID',function(request,response){
	console.log('- Pulling received:', request.method.cyan, request.url.underline);

	var respObj = new Object();
	resv.sendReservations(response, respObj, request.params.calID);
});

app.get('/search/:what', function(request, response){
	console.log('- Search received:', request.method.cyan, request.url.underline);

	var search = request.params.what.trim();

	if (10 === search.length && 'cal-' === search.substr(0,4)){
		// search by calendar ID
		response.redirect('/calendar/'+search);
		return;
	}

	if (5 < search.length && 
		('http:' === search.substr(0,5) || 'https:' === search.substr(0,6))){
			// create new calendar
		}

		// search by owner name
});

// by default
app.get('*',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	response.render('index-template.html');
});

//Visit localhost:8080
app.listen(8080, function(){
	console.log('- Server listening on port 8080'.grey);
});