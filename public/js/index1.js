console.log("reaching here");
$(document).ready(function(){
	$('#theme_view').animate(
		{"top":"-100px",
		"left":"-50px",
		"width": $('#theme').width() + 200, 
		"height":"900px"}, 3000);

	$('#search_btn').click(function(){
		console.log("Click handler");
		var query = $('#search_input').val();
		console.log(query);
		var url = '/searchResult?query=' + encodeURIComponent(query);
		console.log(url);
		window.location.href = url;
	})

	console.log("this works");
});