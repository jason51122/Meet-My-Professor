$(document).ready(function() {
	$('#calendar').fullCalendar('today');
		
	$('#calendar').fullCalendar({
		header: {
			left: 'prev,next today',
			center: 'title',
			right: 'month,agendaWeek,agendaDay'
		},
		defaultView: 'agendaWeek',
		editable: false,
		events: 'http://www.google.com/calendar/feeds/brownipp%40gmail.com/public/basic',
		eventClick: function(event) {
			// opens events in a popup window
			window.open(event.url, 'gcalevent', 'width=700,height=600');
			return false;
		},
		loading: function(bool) {
			$('#loading').toggle(bool);
		}
	});
});