var isExist = false; 
var eventData = null;
var dbEvents = [];

$(document).ready(function() {
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
		slotDuration: '00:30:00',
		snapDuration: '00:30:00',
		selectHelper: true,
		selectable: true,
		select: function(start, end) {
			if (isExist)
				return;

			eventData = {
				id: 'reservation',
				start: start,
				end: end,
				backgroundColor: '#3a87ad',
				borderColor: '#3a87ad'
			};

			$("#reservation_wrapper").show();
			$("#start_time").val(eventData.start.format("HH:mm"));
			$("#end_time").val(eventData.end.format("HH:mm"));
			$("#your_name").val('');
			$("#your_email").val('');
			$("#for_what").val('');

			$('#calendar').fullCalendar('renderEvent', eventData, true);
			$('#calendar').fullCalendar('unselect');
		},
		editable: false,
		events: calObj.calLink,
		eventColor: '#a52d23',
		eventClick: function(event) {
			// opens events in a popup window
			if (event.id !== 'reservation')
				return false;

			$("#reservation_wrapper").show();

			return false;
		},
		loading: function(bool) {
			$('#loading').toggle(bool);
		}
	});
	
	if ('0' !== calObj.startTime)
		$('#calendar').fullCalendar({
			minTime:calObj.startTime
		});

	if ('0' !== calObj.endTime)
		$('#calendar').fullCalendar({
			maxTime:calObj.endTime
		});

	fetchDBEvents();
});

function format_checker(time){
	time = time.trim();
	var timeFormat = /^([01]\d|2[0-3]):?([0-5]\d)$/;
	if(false === timeFormat.test(time))
		return null;
	var item = time.split(":");
	var new_moment = eventData.start.clone();
	new_moment.hour(parseInt(item[0]));
	new_moment.minute(parseInt(item[1]));

	return new_moment;
}

function time_validate(start, end){
	var i;
	var test = [start.unix(), end.unix()];
	var cur;

	for (i = 0; i < outerEvents.length; i++){
		cur = [outerEvents[i].start.unix(), outerEvents[i].end.unix()];
		if (test[0] >= cur[0] && test[0] <= cur[1])
			return false;
		if (test[1] >= cur[0] && test[1] <= cur[1])
			return false;
		if (cur[0] > test[0] && cur[1] < test[1])
			return false;
	}

	for (i = 0; i < dbEvents.length; i++){
		cur = [dbEvents[i].startTime, dbEvents[i].endTime];

		if (test[0] >= cur[0] && test[0] <= cur[1])
			return false;
		if (test[1] >= cur[0] && test[1] <= cur[1])
			return false;
		if (cur[0] > test[0] && cur[1] < test[1])
			return false;
	}

	return true;
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

function pop_ok(){
	// should make sure outerEvents are ready! 
	// think about unpredictable event order
	// how should we fetch the DB events?
	// refetch?

	console.log(outerEvents);

	// check time
	var str = $("#start_time").val().trim();
	if (0 === str.length){
		$("#time_description").css("color","red");
		return;
	}
	var new_start = format_checker(str);

	str = $("#end_time").val().trim();
	if (0 === str.length){
		$("#time_description").css("color","red");
		return;
	}

	var new_end = format_checker(str);
	if (null === new_start || null === new_end ){
		$("#time_description").html("The valid time format is XX:XX of 24 hours");
		$("#time_description").css("color","red");
		return;
	}

	// check range
	if (new_end.isBefore(new_start) || !time_validate(new_start, new_end)){
		$("#time_description").html("Time range invalid or confilicts with others");
		$("#time_description").css("color","red");
		return;
	}

	// restore time item
	$("#time_description").html("From what time to what time");
	$("#time_description").css("color","rgb(230, 230, 230)");

	// check name
	str = $('#your_name').val().trim();
	if (0 === str.length){
		$("#name_description").css("color","red");
		return;
	}
	if (!validateName(str)){
		$("#name_description").html("A valid name should not have special characters");
		$("#name_description").css("color","red");
		return;
	}
	$("#name_description").html("put your name here");
	$("#name_description").css("color","rgb(230, 230, 230)");
	eventData.name = str;

	// check email
	str = $('#your_email').val().trim();
	if (0 === str.length){
		$("#email_description").css("color","red");
		return;
	}
	if (!validateEmail(str)){
		$("#email_description").html("invalid email format");
		$("#email_description").css("color","red");
		return;
	}

	eventData.email = str;
	$("#email_description").html("your email address to receive notification");
	$("#email_description").css("color","rgb(230, 230, 230)");

	// check for
	str = $("#for_what").val().trim();
	if (0 === str.length){
		$("#for_description").css("color","red");
		return;
	}
	$("#for_description").css("color","rgb(230, 230, 230)");
	eventData.title = str;

	$("#reservation_wrapper").hide();

	// update reservation detail and show
	eventData.start = new_start;
	eventData.end = new_end;

	$("#start_time_static").html(eventData.start.format("HH:mm"));
	$("#end_time_static").html(eventData.end.format("HH:mm"));
	$("#name_static").html(eventData.name);
	$("#email_static").html(eventData.email);
	$("#for_static").html(eventData.title);
	$("#reservation_detail").show();

	// update event
	$("#calendar").fullCalendar('removeEvents', eventData.id);
	$('#calendar').fullCalendar('renderEvent', eventData, true);

	isExist = true;
}

function pop_cancel(){
	if (false === isExist){
		// clear the pending event from the calendar
		$("#calendar").fullCalendar('removeEvents', eventData.id);
	}

	$("#reservation_wrapper").hide();
}

function detail_reset(){
	isExist = false;

	// clear the event from the calendar
	$("#calendar").fullCalendar('removeEvents', eventData.id);

	// clear reservation detail and hide
	$("#reservation_detail").hide();
}

function paste_events(events){
	// could be more efficient, just change those modified

	$("#calendar").fullCalendar('removeEvents', 'dbEvents');

	var i;
	for (i = 0; i < events.length; i++){
		var newEvent = new Object();
		newEvent.id = 'dbEvents';
		newEvent.title = 'Busy';
		newEvent.start = moment.unix(events[i].startTime);
		newEvent.end = moment.unix(events[i].endTime);
		$('#calendar').fullCalendar('renderEvent', newEvent, true);
	}
}

function detail_submit(){
	// submit the reservation detail
	var resvObj = new Object();
	resvObj.detail = [
		calObj.calID,
		eventData.name,
		eventData.email,
		eventData.title,
		eventData.start.unix(),
		eventData.end.unix()
	];

	$.ajax({
	    type: "POST",
	    url: "/calendar/submit",
	    data: resvObj,
	    dataType: "json",
	    success: function(data) {
	    	// db events are pigpacked
	    	
		    if ('0' === data.state) {
		    	alert('Reservation request failed because of time confilicts.');
		    } else if ('1' == data.state) {
		    	alert('Reservation request succeeded. Remember to check your email.');
		    }

			// reset
	    	detail_reset();

		    // reload db events into calendar
		    dbEvents = data.data;
		    paste_events(dbEvents);

	    },
	    error: function(err) {
	    	isNetworkError = true;
	        console.log(err);
	    }
	});
}

function fetchDBEvents(){
	$.ajax({
	    type: "GET",
	    url: "/calendar/pulling/"+calObj.calID,
	    dataType: "json",
	    success: function(data) {
		    dbEvents = data.data;
		    paste_events(dbEvents);
	    },
	    error: function(err) {
	    	isNetworkError = true;
	        console.log(err);
	    }
	});
}

function refetch(){
	$('#calendar').fullCalendar('refetchEvents');
	fetchDBEvents();
}