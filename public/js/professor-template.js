var dbEvents = [];
var old = [];

$(document).ready(function() {
	url = document.URL;
	if (url.indexOf("create") != -1) {
		$('#registration_wrapper').show();
		$('#start_time').datetimepicker({
			datepicker:false,
			format:'H:i',
			step:30
		});
		$('#end_time').datetimepicker({
			datepicker:false,
			format:'H:i',
			step:30
		});
		$('#your_interim').datetimepicker({
			datepicker:false,
			format:'H:i',
			allowTimes:['00:00','00:05','00:10','00:15','00:20','00:25','00:30','00:35','00:40','00:45','00:50','00:55','01:00']
		});
		$('#your_expireDate').datetimepicker({
			lang:'en',
			timepicker:false,
			format:'Y-m-d',
			formatDate:'Y-m-d',
			minDate:'0', // yesterday is minimum date
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

		fetchDBEvents();
	}
});

function paste_events(events){
	// could be more efficient, just change those modified
	$("#calendar").fullCalendar('removeEvents', 'dbEvents');
	
	var i;
	for (i = 0; i < events.length; i++){
		var newEvent = new Object();
		newEvent.id = 'dbEvents';
		newEvent.title = events[i].name + ': ' + events[i].forWhat;
		newEvent.start = events[i].startTime;
		newEvent.end = events[i].endTime;
		$('#calendar').fullCalendar('renderEvent', newEvent, true);
	}
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

function settings(){
	$('#registration_wrapper').show();
	old[0] = $("#your_calDesp").val().trim();
	old[1] = $("#your_name").val().trim();
	old[2] = $("#your_email").val().trim();
	old[3] = $("#your_expireDate").val().trim();
	old[4] = $("#start_time").val().trim();
	old[5] = $("#end_time").val().trim();
	old[6] = $("#your_interim").val().trim();
}

function pop_ok(){
	// check description
	str1 = $("#your_calDesp").val().trim();
	if (0 === str1.length){
		$("#calDesp_description").css("color","red");
		return;
	}
	$("#calDesp_description").css("color","rgb(230, 230, 230)");
	
	// check name
	str2 = $('#your_name').val().trim();
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
	str3 = $('#your_email').val().trim();
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

	str5 = $("#end_time").val().trim();
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
	
	// check interim
	str6 = $('#your_interim').val().trim();
	if (0 === str6.length){
		$("#interim_description").css("color","red");
		return;
	}
	if (!validateTime(str6)){
		$("#interim_description").css("color","red");
		return;
	}
	$("#interim_description").css("color","rgb(230, 230, 230)");
	
	// check expire date
	str7 = $('#your_expireDate').val().trim();
	if (0 === str7.length){
		$("#expireDate_description").css("color","red");
		return;
	}
	if (!validateDate(str7)){
		console.log('hhh');
		$("#expireDate_description").css("color","red");
		return;
	}
	$("#expireDate_description").css("color","rgb(230, 230, 230)");
	
	if (old[0] !== str1 || old[1] !== str2 || old[2] !== str3 || old[3] !== str4 || old[4] !== str5 || old[5] !== str6 || old[6] !== str7) {
		$('#registration_wrapper').hide();
		$("#result_wrapper").show();
		$("#message").hide();
		var posting = $.post( document.URL, { calDesp: str1, name: str2, email: str3, startTime: str4, endTime: str5, interim: str6, expireDate: str7} );
		
		posting.done(function( data ) {
			$("#progress").hide();
			$("#message").show();
			$('#message').html(data);
		});
	}
	else {
		$('#registration_wrapper').hide();
	}
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