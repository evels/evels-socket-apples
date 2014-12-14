//-----------CLIENT SIDE VARIABLES-------------

var usernames = {};
var socket = io.connect('http://localhost:8080');
var apple_debugger = false;

//-----------CLIENT DOCUMENT READY-------------

$(document).ready(function() {

    //getting player name
    $('.player-enter').submit(function(event) {
	event.preventDefault();
	var name = $('#player-name').val();
	if(name == "") {
	    name = "[no name]";
	}
	$('.info-name span').text(name);
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

function debug(text) {
    if(apple_debugger == true) {
	console.log(text);
    }
}


//-----------CLIENT SIDE SOCKET LISTENERS-------------

//on connection to server
socket.on('connect', function(){

    });
//update chat log
socket.on('updatechat', function (username, data) {
    debug('update chat');
    $('#conversation').append('<strong>'+username + ':</strong> ' + data + '<br>');
    $("#conversation").animate({
	scrollTop: $('#conversation').height()
    }, "slow");
});

//update user list
socket.on('updateusers', function(data) {
    debug('update users');
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
    debug('start game');
    $('.container').addClass('started');
    $('.game-enter').addClass('hide');
    $('.deal, .player, .info-name, .info-turn').removeClass('hide');
    $('#users span').text('0 pts');
});
//deal red card
socket.on('dealred', function(card) {
    debug("deal red "+ card);
    var markup = '<div class="card red"><span>'+card+'</span></div>';
    $(markup).hide().appendTo('.player').fadeIn("slow");
});

//deal green card
socket.on('dealgreen', function(card) {
    debug("drawing green "+card);
    $('.deal-green').html(drawCard(card, "green"));
});

//assigning visuals to current player
socket.on('yourturn', function() {
    debug('it is your turn!');
    $('.player').addClass('star');
});

//broadcasting whose turn it is
socket.on('turnplace', function(user) {
    debug('updating turn to '+ user);
    $('.deal-info span').text(user);
});

//asking user to pick a red card
socket.on('pickred', function() {
    debug("time to pick a red card to send to center");
    $('.player .red').on('click', function() {
	var selected = $('span', this).text();
	$(this).fadeOut("normal", function() {
	    $(this).remove();
	    socket.emit('sendcard', selected);
	});
	$('.player .red').unbind();

    });
});

//sending chosen card to center facedown
socket.on('sentcardfacedown', function(card) {
    debug('sending ' + card + ' to center facedown');
    $('.deal-red').append(drawCard(card,"red", "facedown"));
});

//determining winner of round
socket.on('selectwinner', function() {
    debug('select winner');
    $('.deal-red').addClass('selectwinner');
    $('.card.red.facedown span').css('display', 'block').parent().removeClass('facedown');
    $('.deal-red .card').on('click', function() {
	$(this).addClass('winner');
	var textr = $('span', this).text();
	var textg = $('.deal-green .green span').text();
	$('.deal-red .card').unbind();
	socket.emit('updatescore', textr, textg);
    });
});

//round ends
socket.on('endround', function(users, winner,textr) {
    $('.card.red.facedown span').css('display', 'block').parent().removeClass('facedown');

    $('.card.red').each(function() {
	if($('span',this).text() === textr) {
	    $(this).addClass('winner');
	}
    });
    $('.deal-result').text(winner+' won the round!');
    $('#users').empty();
    for(var r = 0; r < users.length;r++) {
	$('#users').append('<div>' + users[r].name + '<span>'+ users[r].score + ' pts</span></div>');
    }
    $('.deal-newround').removeClass('hide').on('click', function() {
	socket.emit('newround');
    });
});

//clean up, clear the board
socket.on('cleanupround', function() {
    debug('clean u pround');
    $('.deal-green, .deal-red, .deal-result').empty();
    $('.deal-red').removeClass('selectwinner');
    $('.deal-newround').addClass('hide').unbind();
    $('.player').removeClass('star');

});


