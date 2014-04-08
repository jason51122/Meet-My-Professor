var colors = require('colors');
var emailer = require('../emailer');
var moment = require('moment');

// the events map queue
var calsMap = new Object();
// the database connection
var conn = null;

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

function submitHandler(request, response, conn){
	// check request validity
	if (request.body.detail.length !== 7)
		response.send('Invalid request!');

	// which calendar is the submit from
	var calID = request.body.detail[0];

	if (typeof calsMap[calID] === 'undefined'){
		calsMap[calID] = new Object();
		calsMap[calID].isBusy = 0;
		calsMap[calID].tasks = []
	}
	var cal = calsMap[calID];
	var task = {'request':request, 'response':response, 'conn':conn};

	// if a task is being handled, queue the current one
	if (cal.isBusy === 1){
		cal.tasks.push(task);
		return;
	} else {
		// handle the current task
		cal.isBusy = 1;
		handle(task);
	}
}

function handle(task){
	var detail = task.request.body.detail;
	var response = task.response;

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
}

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
			emailOwner(response, detail);
		}
	});
}

// I am confused!!!!
function emailOwner(response, detail){
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[7], // owner email
	    subject: "Reservation Request From "+ detail[2], 
	    html: 
	    "<p>Hello</p>" + 
	    "<p>    Could we meet</p>" + 
	    "<p>    from</p>" + 
	    "<p>        "+moment.unix(detail[5]).format("MMMM Do YYYY, h:mm a")+"</p>"+
	    "<p>    to</p>"+
	    "<p>        "+moment.unix(detail[6]).format("MMMM Do YYYY, h:mm a")+"</p><p></p>"+
	    "<a href='http://localhost:8080/owner/confirm/"+detail[0]+"'> Confirm Request </a>"+
	    "<a href='http://localhost:8080/owner/revoke/"+detail[0]+"'>Revoke Request </a>"
	};

	emailer.send(mailOptions, function(error){
		if (error === null){
			// next: email the reserver
			emailReserver(response, detail);
		} else {
			// the email might be unreachable
			response.send('The calendar owner is unreachable at this moment!');
		}
	});
}

function emailReserver(response, detail){
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[3], // reserver email
	    subject: "Reservation Pending", 
	    html:"<a href='http://localhost:8080/'> Cancel Request </a>"
	};

	emailer.send(mailOptions, function(error){
		if (error === null){
			// next: insert into database
			insertReservation(response, detail)
		} else {
			// the email might be unreachable
			response.send('The calendar owner is unreachable at this moment!');
		}
	});
}

function insertReservation(response, detail){
	conn.query('INSERT INTO resvTable VALUES($1,$2,$3,$4,$5,$6,$7);', detail.slice(0,7), function(error, result){
		if (null !== error){
			console.log(error);
			response.send(error);
			return;
		}

		console.log('* CREATE new reservation: '.red, detail[0].green);
		var respObj = new Object();
		respObj.state = '1';
		sendReservations(response, respObj, detail[1]);

		// to deal with the next task in the queue
		var cal = calsMap[detail[1]];
		if (cal.tasks.length > 0){
			handle(cal.tasks.shift());
		} else {
			cal.isBusy = 0;
		}
	});
}

function sendReservations(response, respObj, calID){
	conn.query('SELECT startTime,endTime FROM resvTable WHERE calID = $1;', [calID],
	function(error,result){
		if (null !== error){
			console.log(error);
			response.send('Server Error!');
		} else {
			respObj.data = result.rows;
			response.json(respObj);
		}
	});
}

function setConn(connection){
	conn = connection;
}

exports.submitHandler = submitHandler;
exports.sendReservations = sendReservations;
exports.setConn = setConn;