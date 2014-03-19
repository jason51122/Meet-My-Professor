$(document).ready(function() {
	$('#calendar').fullCalendar({
		height: 700,
		aspectRatio: 1,
		header: {
			left: 'prev,next today',
			center: 'title',
			right: 'month,basicWeek,basicDay'
		},
		defaultDate: '2014-01-12',
		editable: true,
		events: [
			{
				title: 'All Day Event',
				start: '2014-01-01'
			},
			{
				title: 'Long Event',
				start: '2014-01-07',
				end: '2014-01-10'
			},
			{
				id: 999,
				title: 'Repeating Event',
				start: '2014-01-09T16:00:00'
			},
			{
				id: 999,
				title: 'Repeating Event',
				start: '2014-01-16T16:00:00'
			},
			{
				title: 'Meeting',
				start: '2014-01-12T10:30:00',
				end: '2014-01-12T12:30:00'
			},
			{
				title: 'Lunch',
				start: '2014-01-12T12:00:00'
			},
			{
				title: 'Birthday Party',
				start: '2014-01-13T07:00:00'
			},
			{
				title: 'Click for Google',
				url: 'http://google.com/',
				start: '2014-01-28'
			}
		]
	});
});