var isExist = false; 
var eventData = null;
var dbEvents = [];
var timeformat = 'YYYY-MM-DD HH:mm';
var dateStart = null;
var dateEnd = null;

$(document).ready(function() {
	// refetch outer events and db events in 1 minute
	setInterval(refetch, 60000);
	callNext = fetchDBEvents;

	var date = moment();
	// set up display range
	dateStart = date.format('YYYY-MM-DD');
	dateEnd = date.add('d', 7*calObj.period-1).format('YYYY-MM-DD');

	var start = moment(dateStart+' '+calObj.startTime);
	var end = moment(dateStart+' '+calObj.endTime);
	var hours = end.diff(start, 'hours');
	if (end.diff(start, 'hours', true) > hours)
		hours++;

	//console.log(hours);
	
	$('#calendar').fullCalendar('today');

	$('#calendar').fullCalendar({
		googleCalendarApiKey: 'AIzaSyBBpoUdMM5b3fdaGbjdpkE_vTq0nbEFvMo',
		events: {
           	googleCalendarId: get_calId(calObj.calLink),
        },
		header: {
			left: 'prev,next',
			center: 'title',
			right: ''
		},
		defaultView: 'agendaWeek',
		timeFormat: 'HH:mm',
		allDaySlot: false,
		lazyFetching: false,
		firstDay: moment().day(),
		minTime: calObj.startTime + ':00',
		maxTime: calObj.endTime + ':00',
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

			pasteSuggestedTimes();
			$("#reservation_wrapper").show();
			
			$("#start_time").datetimepicker({
				datepicker:false,
				value: eventData.start.format("HH:mm"),
				format:'H:i',
				step:5
			});
			$('#end_time').datetimepicker({
				datepicker:false,
				value: eventData.end.format("HH:mm"),
				format:'H:i',
				step:5
			});
			
			$("#start_time").val(eventData.start.format("HH:mm"));
			$("#end_time").val(eventData.end.format("HH:mm"));

			// reset the interface
			$("#your_name").val('');
			$("#your_email").val('');
			$("#for_what").val('');

			$("#time_description").html("Your start time and end time");
			$("#time_description").css("color","rgb(230, 230, 230)");
			$("#name_description").html("Your name");
			$("#name_description").css("color","rgb(230, 230, 230)");
			$("#email_description").html("Your email address to receive notifications");
			$("#email_description").css("color","rgb(230, 230, 230)");
			$("#for_description").css("color","rgb(230, 230, 230)");

			$('#calendar').fullCalendar('renderEvent', eventData, true);
			$('#calendar').fullCalendar('unselect');
		},
		editable: false,
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
		},
		viewRender: function(view) {
			var startDate = view.start.format('YYYY-MM-DD');
			var endDate = view.end.clone().add('d','-1').format('YYYY-MM-DD');
			if (startDate === dateStart){
				// hide previous button
				$('.fc-prev-button').hide();
			} else {
				// display previous button
				$('.fc-prev-button').show();
			}

			if (endDate === dateEnd){
				// hide next button
				$('.fc-next-button').hide();
			} else {
				// display next button
				$('.fc-next-button').show();
			}
		},
		height: 50*(hours+1)
	});
});

function get_calId(url) {
	var googleCalendarId;
	var match;

	if ((match = /^[^\/]+@([^\/]+\.)?calendar\.google\.com$/.test(url))) {
		googleCalendarId = url;
	}
	// try to scrape it out of a V1 or V3 API feed URL
	else if (
		(match = /^https:\/\/www.googleapis.com\/calendar\/v3\/calendars\/([^\/]*)/.exec(url)) ||
		(match = /^https?:\/\/www.google.com\/calendar\/feeds\/([^\/]*)/.exec(url))
	) {
		googleCalendarId = decodeURIComponent(match[1]);
	}
	else {
		googleCalendarId = null;
	}

	googleCalendarId = googleCalendarId.trim();
	console.log(googleCalendarId);
	
	return googleCalendarId;
}

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

function range_checker(start, end){
	var startTime = start.format('HH:mm');
	var endTime = end.format('HH:mm');
	if (endTime <= startTime)
		return false;

	if (startTime < calObj.startTime || startTime > calObj.endTime)
		return false;

	if (endTime < calObj.startTime || endTime > calObj.endTime)
		return false;

	return true;
}

function time_validate(start, end){
	var i;
	var test = [start.format(timeformat), end.format(timeformat)];
	var cur;

	for (i = 0; i < outerEvents.length; i++){
		if (outerEvents[i].id === eventData.id)
			continue;
		
		cur = [outerEvents[i].start.format(timeformat), outerEvents[i].end.format(timeformat)];
		if (test[0] > cur[0] && test[0] < cur[1])
			return false;
		if (test[1] > cur[0] && test[1] < cur[1])
			return false;
		if (cur[0] >= test[0] && cur[1] <= test[1])
			return false;
	}

	for (i = 0; i < dbEvents.length; i++){
		cur = [dbEvents[i].startTime, dbEvents[i].endTime];

		if (test[0] > cur[0] && test[0] < cur[1])
			return false;
		if (test[1] > cur[0] && test[1] < cur[1])
			return false;
		if (cur[0] >= test[0] && cur[1] <= test[1])
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
		$("#time_description").html("The time is not in 24-hour HH:MM format");
		$("#time_description").css("color","red");
		return;
	}

	// check range
	if (!range_checker(new_start, new_end)||!time_validate(new_start, new_end)){
		$("#time_description").html("The time range is invalid or overlapped");
		$("#time_description").css("color","red");
		return;
	}

	// restore time item
	$("#time_description").html("Your start time and end time");
	$("#time_description").css("color","rgb(230, 230, 230)");

	// check name
	str = $('#your_name').val().trim();
	if (0 === str.length){
		$("#name_description").css("color","red");
		return;
	}
	if (!validateName(str)){
		$("#name_description").html("Your name should not contain any special characters");
		$("#name_description").css("color","red");
		return;
	}
	$("#name_description").html("Your name");
	$("#name_description").css("color","rgb(230, 230, 230)");
	eventData.name = str;

	// check email
	str = $('#your_email').val().trim();
	if (0 === str.length){
		$("#email_description").css("color","red");
		return;
	}
	if (!validateEmail(str)){
		$("#email_description").html("Your email format is invalid");
		$("#email_description").css("color","red");
		return;
	}

	eventData.email = str;
	$("#email_description").html("Your email address to receive notifications");
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
		newEvent.title = 'busy';
		newEvent.start = events[i].startTime;
		newEvent.end = events[i].endTime;

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

function detail_submit(){
	$('#result_wrapper').show();

	// submit the reservation detail
	var resvObj = new Object();
	resvObj.detail = [
		calObj.calID,
		eventData.name,
		eventData.email,
		eventData.title,
		eventData.start.format('YYYY-MM-DD HH:mm'),
		eventData.end.format('YYYY-MM-DD HH:mm'),
		calObj.email,
		calObj.name,
		calTimezone,
		calObj.calLoc
	];

	$.ajax({
	    type: "POST",
	    url: "/calendar/submit",
	    data: resvObj,
	    dataType: "json",
	    success: function(data) {
	    	$("#progress").hide();

	    	// db events are pigpacked
		    if ('0' === data.state) {
		    	$('#message').html('Reservation failed because of time conflicts.');
		    } else if ('1' == data.state) {
		    	$('#message').html('Reservation is confirmed. Please check your email.');
		    } else {
		    	$('#message').html(data.message);
		    }

			// reset
	    	detail_reset();

		    // reload db events into calendar
		    if (typeof data.data !== 'undefined'){
		    	paste_events(data.data);
		    }
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

function message_ok(){
	$("#result_wrapper").hide();
	$("#progress").show();
}

function getSuggestedTimes(){
	var times = [];
	var date = eventData.start.format('YYYY-MM-DD');
	var pieces = calObj.interim.split(':');
	var hour, minute;
	
	if(pieces.length === 2) {
	    hour = parseInt(pieces[0], 10);
	    minute = parseInt(pieces[1], 10);
	}
	var interim = hour * 60 + minute;

	var i,j,item,start;
	for (i = 0; i < outerEvents.length; i++){
		item = outerEvents[i];
		if (item.start.format('YYYY-MM-DD') === date){
			start = item.start.format(timeformat);
			for (j = 0; j < times.length; j++){
				if (times[j] >= start)
					break;
			}

			// avoid duplicates
			if (times[j] !== start)
				times.splice(j,0,start, item.end.format(timeformat));
			
		}
	}

	for (i = 0; i < dbEvents.length; i++){
		item = dbEvents[i];
		if (item.startTime.split(' ')[0] === date){
			for (j = 0; j < times.length; j++){
				if (times[j] >= item.startTime)
					break;
			}

			// avoid duplicates
			if (times[j] !== item.startTime)
				times.splice(j,0, item.startTime, item.endTime);
		}
	}

	// initialize start and the final end
	start = date+' '+calObj.startTime;
	var end = date+' '+calObj.endTime;

	if (times.length === 0)
		return [{'start': start.split(' ')[1], 'end': end.split(' ')[1]}];

	var suggestedTimes = [];
	i = 0;
	// check a valid start
	if (start === times[0]){
		start = moment(times[1]).add('m',interim);
		i = 2;
	} else
		start = moment(start);

	var curEnd;
	while (i < times.length){
		curEnd = moment(times[i]).add('m',-interim);
		if (curEnd.isAfter(start))
			suggestedTimes.push({'start': start.format('HH:mm'), 'end': curEnd.format('HH:mm')});
		start = moment(times[i+1]).add('m',interim);
		i += 2;
	}
	
	// check remaining end
	if (end !== times[times.length-1]){
		end = moment(end);
		if (end.isAfter(start))
			suggestedTimes.push({'start': start.format('HH:mm'), 'end': end.format('HH:mm')});
	}
	return suggestedTimes;
}

function pasteSuggestedTimes(){
	var times = getSuggestedTimes();
	$('#suggested_list').html('');
	for (var i = 0; i < times.length; i++){
		$('#suggested_list').append("<li class='suggested_item'>"
			+times[i].start+" - "+times[i].end+"</li>");
	}
}