var colors = require('colors');
var emailer = require('../emailer');

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
				[id, request.params.calLink, request.body.calDesp, request.body.name, request.body.email, 
				request.body.expireDate, request.body.startTime, request.body.endTime, request.body.interim], 
				function(error, result){
				if (null !== error){
					console.log(error);
					return;
				}
				
				var detail = [];
				detail[0] = id;
				detail[1] = request.params.calLink;
				detail[2] = request.body.calDesp;
				detail[3] = request.body.name;
				detail[4] = request.body.email;
				detail[5] = request.body.expireDate;
				detail[6] = request.body.startTime;
				detail[7] = request.body.endTime;
				detail[8] = request.body.interim;
				emailOwner(detail, response);
			});
		}
	});
}

function emailOwner(detail, response){
	var mailOptions = {
	    from: "meet.my.professor@gmail.com",
	    to: detail[4], 
	    subject: "Meet My Professor: Registration Confirmation",
	    html:
	    "<p> Dear Meet My Professor user: </p>" +
	    "<p> You have set a calendar at Meet My Professor. <p> " +
		"<p>    <strong>ID:</strong> " + detail[0] + "</p>" + 
	    "<p>    <strong>Link:</strong> " + detail[1] + "</p>" + 
	    "<p>    <strong>Description:</strong> " + detail[2] + "</p>" + 
	    "<p>    <strong>Expire date:</strong> " + detail[5] + "</p>" + 
		"<p>    <strong>Start time:</strong> " + detail[6] + "</p>" + 
	    "<p>    <strong>End time:</strong> " + detail[7] + "</p>" + 
		"<p>    <strong>Interim:</strong> " + detail[8] + "</p>" + 
	    "<a href='http://localhost:8080/update/" + encodeURIComponent(detail[1]) +"'> Update your settings </a>" +
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