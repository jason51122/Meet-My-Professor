var emailer = require('../emailer');
var colors = require('colors');
var moment = require('moment');

// the events map queue
var calsMap = new Object();
// the database connection
var conn = null;

// the domain of the server
var url = process.env.DOMAIN || 'localhost';
var port = process.env.PORT || 8080;

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
	if (request.body.detail.length !== 10)
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
	conn.query('SELECT * FROM resvTable WHERE calID = $1 AND (($2 > startTime AND $2 < endTime)'
	+' OR ($3 > startTime AND $3 < endTime) OR ($2 <= startTime AND $3 >= endTime)) LIMIT 1;',
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
			email(response, detail);
		}
	});
}

function formatTime(time){
	var t = time.replace(/[-:]/g,'');
	t = t.replace(' ','T')+'00';
	return t;
}

function email(response, detail){
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[7]+","+detail[3], 
	    subject: "Meet My Professor: Reservation Confirmation",
	    html:
	    "<p> Dear Meet My Professor user: </p>" +
	    "<p> You have set a meeting at Meet My Professor. <p> " +
	    "<p> <strong>Host: </strong>"+ detail[8] + " </p> " +
	    "<p> <strong>Visitor: </strong> "+ detail[2] + " </p>" +
	    "<p> <strong>Meeting time: </strong>"+ detail[5] + " -- " + detail[6] + " </p>" + 
	    "<a href='http://"+url+":"+port+"/cancel/"+detail[0]+"'> Cancel Request </a>" +
		"<p>Regards,<br>Meet My Professor team",
		attachments: [
			{
				fileName: "resv.ics",
				contents: 
				"BEGIN:VCALENDAR\n"+
				"VERSION:2.0\n"+
				"PRODID:-//www.marudot.com//iCal Event Maker\n"+
				"X-WR-TIMEZONE:"+detail[9]+"\n"+
				"BEGIN:VEVENT\n"+
				"DTSTART;TZID="+detail[9]+":"+formatTime(detail[5])+"\n"+
				"DTEND;TZID="+detail[9]+":"+formatTime(detail[6])+"\n"+
				"ORGANIZER;CN="+detail[8]+":mailto:"+detail[7]+"\n"+
				"ATTENDEE;CN="+detail[2]+":mailto:"+detail[3]+"\n"+
				"LOCATION:"+detail[10]+"\n"+
				"SUMMARY:"+detail[4]+"\n"+
				"END:VEVENT\n"+
				"END:VCALENDAR"
			}
		]
	};

	console.log(mailOptions.attachments[0].contents);

	emailer.send(mailOptions, function(error){
		if (error === null){
			// insert reservation into database
			insertReservation(response, detail);
		} else {
			// the email might be unreachable
			response.send({state:2, message: 'Sorry, we are unable to setup the meeting for now.'});
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
			response.redirect('/code/5');
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
	    subject: "Meet My Professor: Reservation Cancellation", 
	    html: 
	    "<p>Dear " + data.ownerName+' and '+data.name+
	    "<p>The meeting from "+data.startTime+" to "+data.endTime+" has been cancelled."+
	    "<p>Regards,<br>Meet My Professor team"
	};

	emailer.send(mailOptions, function(error){
		if (error === null){
			// delete reservation
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
			response.send('/code/10');
		}

		response.redirect('/code/4');
	});
}

exports.submitHandler = submitHandler;
exports.sendReservations = sendReservations;
exports.setConn = setConn;
exports.cancelReservation = cancelReservation;