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

// lib for creating calendar
var cal = require('./lib/cal');
cal.setConn(conn);

var app = express();
var port = process.env.PORT || 8080;

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
				calLink: calLink
			});
		}
		else {
			response.redirect('/code/2');
		}
	});
});

app.post('/create/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	cal.createNewCal(request, response);
});

app.get('/update/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	
	calLink = request.params.calLink;
	conn.query('SELECT * FROM calTable WHERE calLink=$1;', [calLink], function(error, result){
		if (null != error){
			console.log(error);
			response.send(error);
		}
		if (0 !== result.rowCount) {
			console.log(result.rows[0])
			response.render('professor-template.html', {
				calLink: result.rows[0].calLink,
				calID: result.rows[0].calID,
				calLoc: result.rows[0].calLoc,
				instructions:result.rows[0].instructions,
				name: result.rows[0].name,
				email: result.rows[0].email,
				startTime: result.rows[0].startTime,
				endTime: result.rows[0].endTime,
				interim: result.rows[0].interim,
				openPeriod:result.rows[0].openPeriod
			});
		}
		else {
			response.redirect('/code/3');
		}
	});
});

app.post('/update/:calLink',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	
	calLink = request.params.calLink;
	
	conn.query('UPDATE calTable SET calLoc=$1, instructions = $2, name=$3, email=$4,startTime=$5, endTime=$6, interim=$7, openPeriod =$8 WHERE calLink=$9;', [request.body.calLoc, request.body.instructions, request.body.name, request.body.email, request.body.startTime, request.body.endTime, request.body.interim, request.body.openPeriod, calLink], function(error){
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
				console.log("getting here");
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

		if (0 === result.rowCount) {
			response.redirect('/code/3');
		}

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
	console.log("got to end of pulling");
});

// cancel
app.get('/cancel/:resvID',function(request, response){
	console.log('- Request received:', request.method.cyan, request.url.underline);

	resv.cancelReservation(request.params.resvID, response);
});

// search
app.get('/searchResult/:search', function(request, response){
	console.log("getting here");
	// response.render('searchresult.html');
	var search = request.params.search;
	console.log(search);

	if (10 === search.length && 'cal-' === search.substr(0,4)){
		// search by calendar ID
		response.redirect('/calendar/'+search);
		return;
	}

	if (5 < search.length && ('http:' === search.substr(0,5) || 'https:' === search.substr(0,6))) {
		// create new calendar
		if (-1 !== search.indexOf("http://www.google.com/calendar/feeds/") || -1 !== search.indexOf("https://www.google.com/calendar/feeds/")) {
			response.redirect('/create/'+encodeURIComponent(search));
			return;
		}
		else {
			console.log("Jaosn");
			response.redirect('/code/6');
			return;
		}
	}

		// search by owner name

	var array = [];
	// var search_results = conn.query('SELECT * FROM calTable WHERE name LIKE $1', ["%" + request.query.query + "%"]);
	
	var search_results = conn.query('SELECT * FROM calTable WHERE name LIKE $1', ["%" + search + "%"]);
	search_results.on('row', function(row){
		array.push({
			"name" : row.name,
			"email": row.email,
			"id" : row.calID,
			"calLoc": row.calLoc
		});
		
	})
	.on('end', function() {
		// response.json(array);
		console.log(array);
		if (array.length == 0) {
			response.redirect('/code/1');
		}
		else {
			response.render('searchresult-template.html', {results: array});
		}
	});

});

// error
app.get('/code/:num',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	var num = request.params.num;
	var error = "";
	if (num == 1) {
		error = "Sorry. We can not find this professor.";
	}
	else if (num == 2) {
		error = "Sorry. This calendar link has been used.";
	}
	else if (num == 3) {
		error = "Sorry. We can not find this calendar.";
	}
	else if (num == 4) {
		error = "The reservation has been canceled.";
	}
	else if (num == 5) {
		error = "Sorry. The reservation does not exist.";
	}
	else if (num == 6) {
		error = "Sorry. The link is not valid.";
	}
	else if (num == 10) {
		error = "Sorry. Server error.";
	}
	response.render('index1-template.html', {error: error});
});

// by default
app.get('*',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	response.render('index1-template.html', {error: ''});
});

//Visit localhost:8080
app.listen(port, function(){
	console.log('- Server listening on port '+port);
});