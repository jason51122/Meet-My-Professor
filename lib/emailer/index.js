var nodemailer = require("nodemailer");

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "meet.my.professor@gmail.com",
        pass: "meetmyprofessor"
    }
});

/* setup e-mail data with unicode symbols
var mailOptions = {
    from: "meet.my.professor@gmail.com", // sender address
    to: "zhixiong_chen@brown.edu", // list of receivers
    subject: "Hello", // Subject line
    text: "Hello world" // plaintext body
} */

function send(mailOptions, callBack){

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log(error);
	        callBack(error);
	    }else{
	        console.log("Message sent: " + response.message);
	        callBack(null);
	    }
	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
}

exports.send = send;