var emailer = require('../emailer');
var colors = require('colors');

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
			conn.query('INSERT INTO calTable VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', 
				[id, request.params.calLink, request.body.calLoc, request.body.instructions, request.body.name, request.body.email, 
			 	request.body.startTime, request.body.endTime, request.body.interim, request.body.openPeriod], 
				function(error, result){
				if (null !== error){
					console.log(error);
					return;
				}
				
				var detail = [];
				detail[0] = id;
				detail[1] = request.params.calLink;
				detail[2] = request.body.calLoc;
				detail[3] = request.body.instructions;
				detail[4] = request.body.name;
				detail[5] = request.body.email;
				detail[6] = request.body.startTime;
				detail[7] = request.body.endTime;
				detail[8] = request.body.interim;
				detail[9] = request.body.openPeriod;
				console.log(detail);
				emailOwner(detail, response);
			});
		}
	});
}

function emailOwner(detail, response){
	console.log(detail[5]);
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[5], 
	    subject: "Meet My Professor: Registration Confirmation",
	    html:
	    "<p> Dear Meet My Professor user: </p>" +
	    "<p> You have set a calendar at Meet My Professor. <p> " +
	    "<p>    <strong>Link:</strong> " + detail[1] + "</p>" + 
	    "<p>    <strong>Meeting Location:</strong> " + detail[2] + "</p>" + 
	    "<p>    <strong>Open Period:</strong> " + detail[9] + "</p>" + 
		"<p>    <strong>Start time:</strong> " + detail[6] + "</p>" + 
	    "<p>    <strong>End time:</strong> " + detail[7] + "</p>" + 
		"<p>    <strong>Interim:</strong> " + detail[8] + "</p>" + 
		"<p>    <strong>Link to share:</strong> http://"+url+":"+port+"/calendar/" + detail[0] + " </p>" + 
	    "<a href='http://"+url+":"+port+"/update/" + encodeURIComponent(detail[1]) +"'> Update your settings </a>" +
		"<p>Regards,<br>Meet My Professor team"
	};
	
	emailer.send(mailOptions, function(error){
		if (error === null){
			// next: email the reserver
			console.log('Create new calendar: '.red, detail[0].green);
			response.send('Calendar ' + detail[0] + ' has been created. Remember to check your email.');
		} else {
			// the email might be unreachable
			response.send('The email is unreachable at this moment!');
		}
	});
}

function setConn(connection){
	conn = connection;
}

exports.createNewCal = createNewCal;
exports.setConn = setConn;