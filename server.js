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

function createNewRoom(response){
	var id = generateIdentifier();

	conn.query('SELECT * FROM rooms WHERE room=$1;', [id], function(error, result){
    	if (null != error){
    		console.log(error);
    		return;
    	}
		if (0 !== result.rowCount)
			createNewRoom(response, respObj);
		else {
			conn.query('INSERT INTO rooms VALUES($1);', [id], function(error, result){
				if (null !== error){
					console.log(error);
					return;
				}

				console.log('* CREATE new room: '.red, id.green);
				response.redirect('/room/'+id);
			});
		}
	});
}

// create a new calendar
app.get('/create',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	//createNewRoom(response);
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
	var id = generateIdentifier();

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
			conn.query('INSERT INTO resvTable VALUES($1,$2,$3,$4,$5,$6,$7);', detail, function(error, result){
				if (null !== error){
					console.log(error);
					response.send(error);
					return;
				}

				console.log('* CREATE new reservation: '.red, id.green);
				response.json({'state':1});
			});
		}
	});
}

// post submit requests
app.post('/calendar/submit', function(request, response){
    console.log('- Submit received:', request.method.cyan, request.url.underline);
    var detail = request.body.detail;

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
				response.json({'state':0});
				return;
			}

			// so far so good
			createNewResv(response, detail);
		});
});

// pulling
app.get('/calendar/pulling/:room/:lastMsg',function(request,response){
	console.log('- Pulling received:', request.method.cyan, request.url.underline);

	conn.query('SELECT id,user,nickname,body,time FROM messages WHERE room = $1 AND id > $2;', 
				[request.params.room, parseInt(request.params.lastMsg)],
				function(error,result){
					// the last message is the current message
					if (null !== error){
						console.log(error);
					} else 
						response.json(result.rows);
			});
});

app.get('/search/:what', function(request, response){
	var search = request.params.what;
	if (search.length);
});

// by default
app.get('*',function(request,response){
	console.log('- Request received:', request.method.cyan, request.url.underline);
	var str = 'HOT';
	response.render('index-template.html');
});

//Visit localhost:8080
app.listen(8080, function(){
    console.log('- Server listening on port 8080'.grey);
});