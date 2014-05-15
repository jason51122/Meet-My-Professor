var dbEvents = [];
var timeformat = 'YYYY-MM-DD HH:mm';

$(document).ready(function() {
	
	callNext = fetchDBEvents;

	url = document.URL;
	if (url.indexOf("create") != -1) {
		var part = decodeURIComponent(url.split("create/")[1]);
		var name = "";
		var email = "";

		$.ajax({
  			dataType: "jsonp",
			url: part.replace(/\/basic$/, '/free-busy') + '?alt=json-in-script',
			success: function(data) {
				$.each(data.feed.author, function(i, v) {
					name = v.name.$t;
					console.log(name);
					$('#registration_wrapper').show();
					$('#start_time').datetimepicker({
						datepicker:false,
						value:'09:00',
						format:'H:i',
						step:30
					});
					$('#end_time').datetimepicker({
						datepicker:false,
						value:'18:00',
						format:'H:i',
						step:30
					});
					$('#your_interim').datetimepicker({
						datepicker:false,
						value:'00:10',
						format:'H:i',
						allowTimes:['00:00','00:05','00:10','00:15','00:20','00:25','00:30','00:35','00:40','00:45','00:50','00:55','01:00']
					});
					$("#your_name").val(name);

					$('#your_openPeriod').val("2");
				});

				if (name == "") {
					window.location.href = "/code/6";
				}
			},
			error: function() {
				window.location.href = "/code/6";
			}
		});
	}
	if (url.indexOf("update") != -1) {
		// refetch outer events and db events in 1 minute
		setInterval(refetch, 60000);
		
		$('#calendar').fullCalendar('today');
		
		$('#calendar').fullCalendar({
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,agendaWeek,agendaDay'
			},
			defaultView: 'agendaWeek',
			allDaySlot: true,
			lazyFetching: false,
			minTime: calObj.startTime + ':00',
			maxTime: calObj.endTime + ':00',
			slotDuration: '00:30:00',
			snapDuration: '00:30:00',
			selectHelper: false,
			selectable: false,
			editable: false,
			eventClick: function(event) {
				return false;
			},
			events: calObj.calLink,
			eventColor: '#a52d23',
			loading: function(bool) {
				$('#loading').toggle(bool);
			}
		});
	}

	adjust_calendar(calObj.startTime, calObj.endTime);
});

function paste_events(events){
	if (events.length === 0)
		return;

	// could be more efficient, just change those modified
	$("#calendar").fullCalendar('removeEvents', 'dbEvents');

	// refresh dbEvents
	dbEvents = [];

	var i;
	for (i = 0; i < events.length; i++){
		var newEvent = new Object();
		newEvent.id = 'dbEvents';
		newEvent.title = 'reservation';
		newEvent.start = events[i].startTime;
		newEvent.end = events[i].endTime;
		newEvent.backgroundColor = '#3a87ad';
		newEvent.borderColor = '#3a87ad';

		// if the event is stored in outerEvents(confirmed), avoid duplicates
		if (inOuterEvents(newEvent))
			continue;

		dbEvents.push(events[i]);
		$('#calendar').fullCalendar('renderEvent', newEvent, true);
	}
}

function inOuterEvents(event){
	for (var i = 0; i < outerEvents.length; i++){
		if (outerEvents[i].start.format(timeformat) === event.start && 
			outerEvents[i].end.format(timeformat) === event.end &&
			outerEvents[i].id !== event.id)
			return true;
	}

	return false;
}

function fetchDBEvents(){
	$.ajax({
	    type: "GET",
	    url: "/calendar/pulling/"+calObj.calID,
	    dataType: "json",
	    success: function(data) {
		    paste_events(data.data);
	    },
	    error: function(err) {
	    	isNetworkError = true;
	        console.log(err);
	    }
	});
}

function refetch(){
	$('#calendar').fullCalendar('refetchEvents');
	callNext = fetchDBEvents;
}

function settings(){
	$('#registration_wrapper').show();
	$('#start_time').datetimepicker({
		datepicker:false,
		value:'09:00',
		format:'H:i',
		step:30
	});
	$('#end_time').datetimepicker({
		datepicker:false,
		value:'18:00',
		format:'H:i',
		step:30
	});
	$('#your_interim').datetimepicker({
		datepicker:false,
		value:'00:10',
		format:'H:i',
		allowTimes:['00:00','00:05','00:10','00:15','00:20','00:25','00:30','00:35','00:40','00:45','00:50','00:55','01:00']
	});

	$("#your_calLoc").val(calObj.calLoc);
	$("#your_name").val(calObj.name);
	$("#your_email").val(calObj.email);
	$("#start_time").val(calObj.startTime);
	$("#end_time").val(calObj.endTime);
	$("#your_interim").val(calObj.interim);
	$('#your_instructions').val(calObj.instructions);
	$('#your_openPeriod').val(calObj.openPeriod);
}

function pop_ok(){
	// check location
	var str1 = $("#your_calLoc").val().trim();
	if (0 === str1.length){
		$("#calLoc_description").css("color","red");
		return;
	}
	$("#calLoc_description").css("color","rgb(230, 230, 230)");
	
	//check instructions
	var str7 = $("#your_instructions").val().trim();
	if (0 === str7.length){
		$("#instruction_description").css("color","red");
		return;
	}
	$("#instruction_description").css("color","rgb(230, 230, 230)");

	// check name
	var str2 = $('#your_name').val().trim();
	if (0 === str2.length){
		$("#name_description").css("color","red");
		return;
	}
	if (!validateName(str2)){
		$("#name_description").css("color","red");
		return;
	}
	$("#name_description").css("color","rgb(230, 230, 230)");
	
	// check email
	var str3 = $('#your_email').val().trim();
	if (0 === str3.length){
		$("#email_description").css("color","red");
		return;
	}
	if (!validateEmail(str3)){
		$("#email_description").css("color","red");
		return;
	}
	$("#email_description").css("color","rgb(230, 230, 230)");
	
	// check time
	var str4 = $("#start_time").val().trim();
	if (0 === str4.length){
		$("#time_description").css("color","red");
		return;
	}
	var new_start = validateTime(str4);

	var str5 = $("#end_time").val().trim();
	if (0 === str5.length){
		$("#time_description").css("color","red");
		return;
	}
	var new_end = validateTime(str5);
	
	if (null === new_start || null === new_end || !validateRange(new_start, new_end)){
		$("#time_description").css("color","red");
		return;
	}
	$("#time_description").css("color","rgb(230, 230, 230)");
	
	adjust_calendar(str4, str5);

	// check interim
	var str6 = $('#your_interim').val().trim();
	if (0 === str6.length){
		$("#interim_description").css("color","red");
		return;
	}
	if (!validateTime(str6)){
		$("#interim_description").css("color","red");
		return;
	}
	$("#interim_description").css("color","rgb(230, 230, 230)");

	
	//check open period
	var str8 = $('#your_openPeriod').val().trim();
	if (0 === str8.length){
		$("#openPeriod_description").css("color","red");
		return;
	}
	if (!validateNumber(str8)){
		console.log('hhh');
		$("#openPeriod_description").css("color","red");
		return;
	}
	$("#openPeriod_description").css("color","rgb(230, 230, 230)");

	calObj.calLoc = str1;
	calObj.instructions = str7;
	calObj.name = str2;
	calObj.email = str3;
	calObj.startTime = str4;
	calObj.endTime = str5;
	calObj.interim = str6;
	calObj.openPeriod = str8;
	
	$('#static_calLoc p').html(calObj.calLoc);
	$('#static_instructions p').html(calObj.instructions);
	$('#static_name').html(calObj.name);
	$('#static_email').html(calObj.email);
	$('#static_startTime').html(calObj.startTime);
	$('#static_endTime').html(calObj.endTime);
	$('#static_interim').html(calObj.interim);
	$('#static_openPeriod').html(calObj.openPeriod+' week(s)');

	$('#registration_wrapper').hide();
 }

function detail_submit(){
	$("#result_wrapper").show();
	$("#message").hide();
	// var posting = $.post( document.URL, { calDesp: str1, name: str2, email: str3, startTime: str4, endTime: str5, interim: str6, expireDate: str7} );
	var posting = $.post( document.URL, calObj);
	posting.done(function( data ) {
		$("#progress").hide();
		$("#message").show();
		$('#message').html(data);
	});
}

function pop_cancel(){
	if (url.indexOf("create") != -1) {
		window.location.href = '/';
	}
	if (url.indexOf("update") != -1) {
		$('#registration_wrapper').hide();
	}	
}

function validateTime(time){
	time = time.trim();
	var timeFormat = /^([01]\d|2[0-3]):?([0-5]\d)$/;
	if(false === timeFormat.test(time))
	return null;
	var item = time.split(":");
	
	return item;
}

function validateRange(start, end){
	if (start[0] > end[0]) {
		return false;
	}
	else if (start[0] == end[0]){
		return start[1] < end[1]
	}
	else {
		return true;
	}
}

function validateEmail(email) 
{
	var re = /\S+@\S+\.\S+/;
	return re.test(email);
}

function validateName(name){
	var re = /[~`!@#\$%\^&*+=\-\[\]\\';,/{}|'"':<>?]/g;
	return !(re.test(name));
}

function validateNumber(number){
	var re = /^\d+$/;
	var isPosNumber = re.test(number);
	if (number == 0){
		isPosNumber = false;
	}
	return isPosNumber;
}

function validateDate(date)
{
	var currVal = date;
	if(currVal == '')
	return false;
  
	var rxDatePattern = /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/; 
	var dtArray = currVal.match(rxDatePattern); // is format OK?

	if (dtArray == null)
		return false;
 	
	dtYear = dtArray[1];
	dtMonth = dtArray[3];
	dtDay= dtArray[5];
	
	if (dtMonth < 1 || dtMonth > 12)
		return false;
	else if (dtDay < 1 || dtDay> 31)
		return false;
	else if ((dtMonth==4 || dtMonth==6 || dtMonth==9 || dtMonth==11) && dtDay ==31)
		return false;
	else if (dtMonth == 2) {
		var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
		if (dtDay> 29 || (dtDay ==29 && !isleap))
		return false;
	}
	return true;
}

function validateInterim(interim) {
	var re = /^\d+$/;
	return re.test(interim);
}

function message_ok(data){
	$("#result_wrapper").hide();
	var encoded = encodeURIComponent(calObj.calLink);
	window.location.href = '/update/' + encoded;
}

// adjust the height of the calendar, let the scroll bar disappear
function adjust_calendar(startTime, endTime){
	var date = moment().format('YYYY-MM-DD');
	var start = moment(date+' '+startTime);
	var end = moment(date+' '+endTime);
	var hours = end.diff(start, 'hours');
	if (end.diff(start, 'hours', true) > hours)
		hours++;

	$('#calendar').fullCalendar('option', 'height', 50*(hours+1));
}