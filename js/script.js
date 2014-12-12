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
	$('.game-waiting, .players-chat').removeClass('hide');
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
		redCards = txtFile.split("\n");
		shuffle(redCards);
	    }),
	    $.get('greencards.txt', function(txtFile){
		greenCards = txtFile.split("\n");
		shuffle(greenCards);
	    })

	    ).then(function() {

	    socket.emit('initgame', redCards, greenCards);
	    socket.emit('newround');

	});

    });
});


//-----------CLIENT SIDE FUNCTIONS-------------

//card markup
function drawCard(text, color, face) {
    face = typeof face !== 'undefined' ?  " "+face : ' ';
    return '<div class="card '+color+face+'"><span>'+text+'</span></div>';
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
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
	$('#users').append('<div>' + value + '<span></span></div>');
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
    $('#users span').text('0');
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
    $('.player').addClass('star');

});

//broadcasting whose turn it is
socket.on('turnplace', function(user) {
    $('.deal-info span').text(user);
});

//asking user to pick a red card
socket.on('pickred', function() {
    $('.player .red').on('click', function() {
	var selected = $('span', this).text();
	$(this).addClass('chosenred');
	$('.player .red').unbind();
	socket.emit('sendcard', selected);
    });
});


//sending chosen card to center faceup
socket.on('sentcardfaceup', function(card) {
    $('.deal-red').append(drawCard(card,"red", "facedown"));
});

//sending chosen card to center facedown
socket.on('sentcardfacedown', function() {
    $('.deal-red').append(drawCard("","red", "facedown"));
});

//determining winner of round
socket.on('selectwinner', function() {
    console.log('select winner');
    $('.card.red.facedown span').show();
    $('.deal-red .card').on('click', function() {
	$(this).addClass('winner');
	var textr = $('span', this).text();
	var textg = $('.deal-green .green span').text();
	$('.deal-red').unbind();
	socket.emit('updatescore', textr, textg);
    });
});

//round ends
socket.on('endround', function(users, winner) {
    $('.deal-result').text(winner+' won the round!');
    $('#users').empty();
    for(var r = 0; r < users.length;r++) {
	$('#users').append('<div>' + users[r].name + '<span>'+ users[r].score + '</span></div>');
    }
    $('.deal-newround').removeClass('hide').on('click', function() {
	socket.emit('newround');
    });
});

//clean up, clear the board
socket.on('cleanupround', function() {
    console.log('cleanupround');
    $('.deal-green, .deal-red, .deal-result').empty();
    $('.deal-newround').addClass('hide');
    $('.player').removeClass('star');
    $('.chosenred').remove();
    $('.deal-newround').unbind();

});


