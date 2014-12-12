//-----------CLIENT SIDE VARIABLES-------------

var usernames = {};
var socket = io.connect('http://localhost:8080');

//-----------CLIENT DOCUMENT READY-------------

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
	$('.game-waiting').removeClass('hide');
	return;
    });

    // when the client clicks SEND
    $('#datasend').click( function() {
	var message = $('#data').val();
	$('#data').val('');
	// tell server to execute 'sendchat' and send along one parameter
	socket.emit('sendchat', message);
    });

    // when the client hits ENTER on their keyboard
    $('#data').keypress(function(e) {
	if(e.which == 13) {
	    $(this).blur();
	    $('#datasend').focus().click();
	}
    });

    $('.game-begin').on('click', function() {
	//check for enough players
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

    });
});


//-----------CLIENT SIDE FUNCTIONS-------------

//card markup
function drawCard(text, color) {
    if(text == "facedown")
	return '<div class="card '+color+' down"></div>';
    return '<div class="card '+color+'"><span>'+text+'</span></div>';
}


//-----------CLIENT SIDE SOCKET LISTENERS-------------

//on connection to server
socket.on('connect', function(){

    });
//update chat log
socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
});

//update user list
socket.on('updateusers', function(data) {
    usernames = data;
    $('#users').empty();
    $.each(data, function(key, value) {
	$('#users').append('<div>' + value + '</div>');
    });
    if(Object.keys(data).length > 2) {
	$('.game-begin').removeClass('hide');
	$('.game-waiting').addClass('hide');
    }
});

//start the game
socket.on('startgame', function() {
    $('.game-enter').addClass('hide');
    $('.deal').removeClass('hide');
});
//deal red card
socket.on('dealred', function(card) {
    console.log(card);
    $('.player').append('<div class="card red"><span>'+card+'</span></div>');
});

//deal green card
socket.on('dealgreen', function(card) {
    $('.deal-green').html(drawCard(card, "green"));
});

//assigning visuals to current player
socket.on('yourturn', function() {
    $('.player').css('border','1px solid green');

});

//asking user to pick a red card
socket.on('pickred', function() {
    $('.player .red').on('click', function() {
	var selected = $('span', this).text();
	$(this).css('border', '1px solid blue');
	$('.player .red').unbind();
	socket.emit('sendcard', selected);
    });
});


//sending chosen card to center faceup
socket.on('sentcardfaceup', function(card) {
    $('.deal-red').append(drawCard(card,"red"));
});

//sending chosen card to center facedown
socket.on('sentcardfacedown', function() {
    $('.deal-red').append(drawCard("facedown","red"));
});

//determining winner of round
socket.on('selectwinner', function() {
    console.log('select winner');
    $('.deal-red .card').on('click', function() {
	$(this).css('border','3px solid red');
	var text = $('span', this).text();
	$('.deal-red').unbind();
	socket.emit('updatescore', text);
    });
});



