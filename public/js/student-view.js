var isExist = false; 
var eventData = null;
var datetd = null;

$(document).ready(function() {

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
		minTime: '09:00',
		maxTime: '19:00',
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

			$('#calendar').fullCalendar('renderEvent', eventData, true);
			$('#calendar').fullCalendar('unselect');
		},
		editable: false,
		events: 'http://www.google.com/calendar/feeds/brownipp@gmail.com/public/basic',
		eventColor: '#a52d23',
		eventClick: function(event) {
			// opens events in a popup window
			if (event.id !== 'reservation')
				return false;

			$("#reservation_wrapper").show();
			$("#start_time").val(eventData.start.format("HH:mm"));
			$("#end_time").val(eventData.end.format("HH:mm"));

			return false;
		},
		loading: function(bool) {
			$('#loading').toggle(bool);
		}
	});
});

function fetchTempEvents(){

}

function format_checker(time){
	time = time.trim();
	var timeFormat = /^([01]\d|2[0-3]):?([0-5]\d)$/;
	if(false === timeFormat.test(time))
		return null;
	var item = time.split(":");
	var new_moment = eventData.start.clone();
	new_moment.hour(parseInt(new_moment[0]));
	new_moment.minute(parseInt(new_moment[1]));

	return new_moment;
}

function time_validate(start, end){

}

function pop_ok(){
	console.log(outerEvents);

	var new_start = format_checker($("#start_time").val());
	var new_end = format_checker($("#end_time").val());
	if (null === new_start || null === new_end ){
		$("#time_description").html("The valid time format is XX:XX of 24 hours");
		$("#time_description").css("color","red");
		return;
	}

	var date = new_start.format('YYYY-MM-DD');
	var events = $('#calendar').fullCalendar('clientEvents',function(event){
		return event.start.format('YYYY-MM-DD') === date;
	});

	// check range
	if (new_end.isBefore(new_start) || time_validate(new_start, new_end)){

	}

	if (false === moment($("#end_time").val(),"HH:mm").isValid()){
		// should check whether the time is in a proper range
		$("#time_description").html("Invalid end time");
		$("#time_description").css("color","red");
		return;
	}

	$("#time_description").html("From what time to what time");
	$("#time_description").css("color","rgb(230, 230, 230)");

	$("#reservation_wrapper").hide();

	// update reservation detail and show
	$("#reservation_detail").show();
	$("#start_time_static").html(eventData.start.format("HH:mm"));
	$("#end_time_static").html(eventData.end.format("HH:mm"));

	isExist = true;
}

function pop_cancel(){
	if (false === isExist){
		// clear the pending event from the calendar
		$("#calendar").fullCalendar('removeEvents', eventData.id);
		return;
	}

	$("#reservation_wrapper").hide();
}

function detail_submit(){
	// submit the reservation detail
}

function detail_reset(){
	isExist = false;

	// clear the event from the calendar
	$("#calendar").fullCalendar('removeEvents', eventData.id);

	// clear reservation detail and hide
	$("#reservation_detail").hide();
}