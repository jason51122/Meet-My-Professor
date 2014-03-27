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
		slotDuration: '00:30:00',
		snapDuration: '00:30:00',
		minTime: '09:00:00',
		maxTime: '19:00:00',
		selectHelper: true,
		selectable: true,
		select: function(start, end) {
			$("#reservation_wrapper").show();
			var eventData = {
				reservationID: 1,
				start: start,
				end: end,
				backgroundColor: '#3a87ad',
				borderColor: '#3a87ad'
			};

			$('#calendar').fullCalendar('renderEvent', eventData, true);
			$('#calendar').fullCalendar('unselect');
		},
		editable: false,
		events: 'http://www.google.com/calendar/feeds/brownipp%40gmail.com/public/basic',
		eventColor: '#a52d23',
		eventClick: function(event) {
			// opens events in a popup window
			if (event.reservationID == null)
				return false;

			$("#reservation_wrapper").show();
			return false;
		},
		loading: function(bool) {
			$('#loading').toggle(bool);
		}
	});
});

function pop_ok(){
	$("#reservation_wrapper").hide();

	// update reservation detail and show
	$("#reservation_detail").show();

}

function pop_cancel(){
	$("#reservation_wrapper").hide();

	// update reservation detail and show
	$("#reservation_detail").show();
}

function detail_submit(){
	// submit the reservation detail
}

function detail_reset(){
	// clear the event from the calendar
	
	// clear reservation detail and hide
	$("#reservation_detail").hide();
}