$(document).ready(function(){
	$('#theme_view').animate(
		{"top":"-100px",
		"left":"-50px",
		"width": $('#theme').width() + 200, 
		"height":"800px"}, 3000);
});

function gofor(){
	var str = $("#search_input").val().trim();
	if (0 === str.length)
		return;

	window.location.href = "/search/"+str;
}
