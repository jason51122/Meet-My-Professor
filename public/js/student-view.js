$(document).ready(function() {
	$('#calendar').fullCalendar('today');
		
	$('#calendar').fullCalendar({
		header: {
			left: 'prev,next today',
			center: 'title',
			right: 'month,agendaWeek,agendaDay'
		},
		defaultView: 'agendaWeek',
		selectHelper: true,
		selectable: true,
		select: function(start, end) {
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
		editable: true,
		events: 'http://www.google.com/calendar/feeds/brownipp%40gmail.com/public/basic',
		eventColor: '#3a1e1a',
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