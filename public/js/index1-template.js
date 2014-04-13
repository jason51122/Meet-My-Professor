$(document).ready(function() {
	$("#result_wrapper").hide();
	
	$('#theme_view').animate(
		{"top":"-100px",
		"left":"-50px",
		"width": $('#theme').width() + 200, 
		"height":"800px"}, 3000);
	
	$("#nav_about").click(function() {
    	$('html, body').animate({
     	   scrollTop: $("#about").offset().top
    	}, 500);
	});
	
	$("#nav_contact").click(function() {
    	$('html, body').animate({
     	   scrollTop: $("#contact").offset().top
    	}, 500);
	});
	
	if (error != '') {
		$("#result_wrapper").show();
		$('#message').html(error);
	}
});

$(document).keypress(function(e) {
    if(e.which == 13) {
        gofor();
    }
});

function gofor(){
	var str = $("#search_input").val().trim();
	if (0 === str.length || str === 'Calendar link/Calendar ID/Professor Name')
		return;
		
	window.location.href = "/searchResult/"+encodeURIComponent(str);
}

function message_ok(data){
	$("#result_wrapper").hide();
}