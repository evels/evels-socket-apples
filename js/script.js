var usernames = {};
var socket = io.connect('http://localhost:8080');


$(document).ready(function() {

    //getting player name
    $('.player-enter').submit(function(event) {
	event.preventDefault();
	var name = $('#player-name').val();
	if(name == "") {
	    name = "[no name]";
	}
	socket.emit('adduser', name);
	$(this).fadeOut();
	return;
    });

    $('.game-begin').on('click', function() {

	//check for enough players
	if(Object.keys(usernames).length < 2) {
	    $('.game-enter .error').text("You must have more players!");
	}
	else {
	    var redCards = [];
	    var greenCards = [];
	    $.when(
		// load cards
		$.get('redcards.txt', function(txtFile){
		    var temp_array = txtFile.split("\n");
		    for(var l = 0; l < temp_array.length; l++) {
			redCards.push({
			    key:temp_array[l],
			    used:false
			});
		    }
		}),
		$.get('greencards.txt', function(txtFile){
		    var temp_array = txtFile.split("\n");
		    for(var l = 0; l < temp_array.length; l++) {
			greenCards.push({
			    key:temp_array[l],
			    used:false
			});
		    }
		})

		).then(function() {

		socket.emit('initgame', redCards, greenCards);
		socket.emit('newround');
	    });
	}
    });
});

socket.on('dealgreen', function(card) {
    $('.deal-green').html(drawCard(card, "green"));
});

socket.on('pickred', function() {
    $('.player .red').on('click', function() {
	var selected = $('span', this).text();
	$(this).css('border', '1px solid blue');
	$('.player .red').unbind();
	socket.emit('sendcard', selected);
    });
});

socket.on('yourturn', function() {
    $('.player').css('border','1px solid green');

});

socket.on('sentcard', function(card) {
    $('.deal-red').append(drawCard(card,"red"));
});

// on connection to server
socket.on('connect', function(){

    });


// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
});

// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function(data) {
    usernames = data;
    $('#users').empty();
    $.each(data, function(key, value) {
	$('#users').append('<div>' + key+ value + '</div>');
    });
});


socket.on('dealred', function(card) {
    console.log(card);
    $('.player').append('<div class="card red"><span>'+card+'</span></div>');
});


socket.on('selectwinner', function() {
    console.log('select winner');
    $('.deal-red .card').on('click', function() {
	$(this).css('border','3px solid red');
	var text = $('span', this).text();
	$('.deal-red').unbind();
	socket.emit('updatescore', text);
    });
});

// on load of page
$(function(){

    });


function drawCard(text, color) {
    return '<div class="card '+color+'"><span>'+text+'</span></div>';
}