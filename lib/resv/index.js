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
			emailReserver(response, detail);
		}
	});
}

function emailOwner(response, detail){
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[7], 
	    subject: "Reservation Request From "+ detail[2], 
	    html: 
	    "<p>Hello</p>" + 
	    "<p>    Could we meet</p>" + 
	    "<p>    from</p>" + 
	    "<p>        "+detail[5]+"</p>"+
	    "<p>    to</p>"+
	    "<p>        "+detail[6]+"</p><p></p>"+
	    "<a href='http://localhost:8080/cancel/"+detail[0]+"'> Cancel Request </a>"
	};

	emailer.send(mailOptions, function(error){
		if (error === null){
			// next: insert into database
			insertReservation(response, detail);
		} else {
			// the email might be unreachable
			response.send({state:2, message:'The calendar owner is unreachable at this moment!'});
		}
	});
}

function emailReserver(response, detail){
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[3], // reserver email
	    subject: "Reservation Pending", 
	    html:
	    "<h1> Hi, </h1>" +
	    "<p> You have made a reservation at Meet My Professor. <p> " +
	    "<p> Name:"+ detail[2] + " </p> " +
	    "<p> Email: "+ detail[3] + " </p>" +
	    "<p> Meeting time:"+ detail[5] + " -- " + detail[6] + " </p>" + 

	    "<a href='http://localhost:8080/cancel/"+detail[0]+"'> Cancel Request </a>"
	};

	emailer.send(mailOptions, function(error){
		if (error === null){
			// next: email the onwer
			emailOwner(response, detail);
		} else {
			// the email might be unreachable
			response.send({state:2, message: 'Your email address is unreachable!'});
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

		// Deal with the next task in the queue
		var cal = calsMap[detail[1]];
		if (cal.tasks.length > 0){
			handle(cal.tasks.shift());
		} else {
			cal.isBusy = 0;
		}
	});
}

function sendReservations(response, respObj, calID){
	conn.query('SELECT name,forWhat,startTime,endTime FROM resvTable WHERE calID = $1;', [calID],
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

function cancelReservation(resvID, response){
	conn.query('SELECT calTable.name AS ownerName, calTable.email AS ownerEmail, resvTable.* '+
		'FROM calTable,resvTable WHERE resvID=$1 AND resvTable.calID=calTable.calID;', 
		[resvID], function(error, result){
		if (null != error){
			console.log(error);
			// server error
			response.send('Server error!');
			return;
		}

		if (0 === result.rowCount) {
			response.send('There is no such reservation!');
			return;
		}

		cancel(result.rows[0], response);
	});
}

function cancel(data, response){
	// email the owner
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: data.ownerEmail+","+data.email,
	    subject: "Request Cancellation", 
	    html: 
	    "<p>Hello " + data.ownerName+' and '+data.name+
	    "<p>The meeting from "+data.startTime+" to "+data.endTime+" has been cancelled."+
	    "<p>Regards,<br>Meet.My.Professor"
	};

	emailer.send(mailOptions, function(error){
		if (error === null){
			// next: delete reservation
			deleteReservation(data.resvID, response);
		} else {
			// the email might be unreachable
			response.send('The calendar owner is unreachable at this moment!');
		}
	});
}

function deleteReservation(resvID, response){
	conn.query('DELETE FROM resvTable WHERE resvID=$1', [resvID], function(error, result){
		if (null != error){
			console.log(error);
			// server error
			response.send('/error/5');
		}

		response.send('Reservation is successfully cancelled!');
	});
}

exports.submitHandler = submitHandler;
exports.sendReservations = sendReservations;
exports.setConn = setConn;
exports.cancelReservation = cancelReservation;