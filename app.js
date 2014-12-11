//-----------SERVER and SOCKET INIT-------------
var express = require('express')
, app = express()
, http = require('http')
, server = http.createServer(app)
, io = require('socket.io').listen(server);

//allowing directory
app.use(express.static(__dirname));

//starting server
server.listen(8080, function() {
    console.log("starting server on 8080");
});

// routing
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

//-----------SERVER VARIABLES-------------
var usernames = {};
var redcards = [];
var greencards = [];
var currentturn = -1;
var users = [];
var data = [];
var lookup = {};


//-----------SERVER SOCKET LISTENERS-------------

io.sockets.on('connection', function (socket) {

    //add a new user
    socket.on('adduser', function(username){
	console.log('add user '+ username);
	//use for this session
	socket.username = username;
	// add the client's username to the global list
	users.push({
	    id:socket.id,
	    name: username,
	    score:0
	});
	usernames[socket.id] = username;
	//update client with list of users
	io.sockets.emit('updateusers', usernames);

    });

    //user disconnects
    socket.on('disconnect', function(){
	//update username list
	delete usernames[socket.id];
	// update list of users in chat, client-side
	io.sockets.emit('updateusers', usernames);
    });

    //game init
    socket.on('initgame', function(red, green) {
	//load card data
	console.log('update card data');
	redcards = red;
	greencards = green;
	//create lookup by username
	for (var r = 0; r < users.length; r++) {
	    lookup[users[r].username] = r;
	}
	io.sockets.emit('startgame');
    });

    //new round
    socket.on('newround', function() {
	console.log(currentturn, users.length);
	//advance turn
	if (currentturn < users.length) {
	    currentturn++;
	}
	else {
	    currentturn = 0;
	}

	//clear data
	data = [];

	//deal every player red cards
	for (var user in usernames) {
	    if (usernames.hasOwnProperty(user)) {
		console.log('dealing hand for '+ user);
		for(var c = 0; c < 3; c++) {
		    var newredcard = getCard(redcards);
		    console.log('deal '+ newredcard);
		    io.to(user).emit('dealred', newredcard);

		}
		//identify turn
		if(users[currentturn].id == user) {
		    io.to(user).emit('yourturn');
		}
		else {
		    io.to(user).emit('pickred');
		}
	    }
	}
	//deal green card
	var newgreencard = getCard(greencards);
	io.sockets.emit('dealgreen', newgreencard);
    });

    //send card to center
    socket.on('sendcard', function(card) {
	console.log("sending card");
	//store who gave which card
	data.push({
	    user:socket.username,
	    card:card
	});
	io.to(users[currentturn].id).emit('sentcard', card);
	if(data.length == users.length-1) { //everyone has submitted
	    console.log('time to select the winner');
	    io.to(users[currentturn].id).emit('selectwinner');
	}
    });

    //update the score
    socket.on('updatescore', function(text) {
	console.log("updating score" + text);
	for(var w = 0; w < data.length;w++) {
	    console.log(data[w].card);
	    if(data[w].card == text) {
		var winner = data[w].username;
		var winnernum = lookup[winner];
		users[winnernum].score++;
		break;
	    }
	}
	console.log(users);
    });

});

//-----------SERVER SIDE FUNCTIONS-------------

//get card from which deck
function getCard(cards) {
    console.log('getting card', cards[0]);
    var random = getRandomInt(0, cards.length);
    if (cards[random].used != true) {
	cards[random].used = true;
	return cards[random].key;
    }
    console.log("nope " + random  + cards[random].key + " found");
    getCard(cards);
}
//get random number
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}