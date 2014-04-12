$(document).ready(function() {
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
});