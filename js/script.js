var redCards = [];
var greenCards = [];
var usernames = {};
var socket = io.connect('http://localhost:8080');


$(document).ready(function() {



    //getting player name
    $('.player-enter').submit(function(event) {
	event.preventDefault();
	var name = $('#player-name').val();
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

		socket.emit('loadcards', redCards, greenCards);
		socket.emit('newround');
	    });
	}
    });
});

socket.on('dealgreen', function(card) {
    $('.dealer').text(card);
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
    $('.player').append(card);
});


// on load of page
$(function(){

    });
