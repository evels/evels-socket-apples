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
var rounddata = [];
var lookup = {};
var gameinsession = false;


//-----------SERVER SOCKET LISTENERS-------------

io.sockets.on('connection', function (socket) {

    socket.emit('updateusers', usernames);

    //add a new user
    socket.on('adduser', function(username){
	console.log('add user '+ username);
	//use for this session
	socket.username = username;
	// add the client's username to the global list
	users.push({
	    iden:socket.id,
	    name: username,
	    score:0,
	    words:[]
	});
	usernames[socket.id] = username;
	//update client with list of users
	io.sockets.emit('updateusers', usernames);

	//update users that player has connected
	socket.emit('updatechat', 'SERVER', 'you have connected');
	socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');

    });

    //chat
    socket.on('sendchat', function (data) {
	// we tell the client to execute 'updatechat' with 2 parameters
	io.sockets.emit('updatechat', socket.username, data);
    });


    //user disconnects
    socket.on('disconnect', function(){
	//update username list
	delete usernames[socket.id];
	// update list of users in chat, client-side
	io.sockets.emit('updateusers', usernames);
	socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    });

    //game init
    socket.on('initgame', function(red, green) {
	//load card data
	console.log('update card data');
	redcards = red;
	greencards = green;
	//create lookup by username
	for (var r = 0; r < users.length; r++) {
	    lookup[users[r].name] = r;
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
	rounddata = [];

	var dealcount = 0;
	var newredcard = '';
	var newgreencard = '';
	if(gameinsession == false) {
	    dealcount = 3;
	    gameinsession = true;
	}
	else {
	    dealcount = 1;
	    io.sockets.emit('cleanupround');
	}

	//deal every player red cards
	for (var user in usernames) {
	    if (usernames.hasOwnProperty(user)) {
		console.log('dealing hand for '+ user);
		if(!(dealcount == 1 && user == users[currentturn-1].iden)) {
		    for(var c = 0; c < dealcount; c++) {
			//console.log('card '+ c + 'of ' + dealcount);
			newredcard = getCard(redcards);
			//this is a hack for a bug.
			if(newredcard == undefined) {
			    newredcard = 'Crazy Pants WHAT';
			    console.log(redcards);
			}
			//console.log('deal '+ newredcard);
			io.to(user).emit('dealred', newredcard);

		    }
		}

		//identify turn
		console.log("compare", user);
		console.log(users);
		if (currentturn != 2) {
		if(user[socket.id] == users[currentturn].name) {
		    io.to(user).emit('yourturn');
		}
		else {
		    io.to(user).emit('pickred');
		}
		}
		else {
		    console.log('lololo');
		}
	    }
	}
	//deal green card
	newgreencard = getCard(greencards);
	io.sockets.emit('dealgreen', newgreencard);
	io.sockets.emit('turnplace',users[currentturn].name);
    });

    //send card to center
    socket.on('sendcard', function(card) {
	console.log("sending card");
	//store who gave which card
	rounddata.push({
	    user:socket.username,
	    card:card
	});

	for (var user in usernames) {
	    if (usernames.hasOwnProperty(user)) {
		//identify turn
		if(users[currentturn].iden == user) {
		    io.to(user).emit('sentcardfaceup', card);
		}
		else {
		    io.to(user).emit('sentcardfacedown');
		}
	    }
	}

	if(rounddata.length == users.length-1) { //everyone has submitted
	    console.log('time to select the winner');
	    io.to(users[currentturn].iden).emit('selectwinner');
	}
    });

    //update the score
    socket.on('updatescore', function(text) {
	console.log("updating score " + text);
	var winner;
	for(var w = 0; w < rounddata.length; w++) {
	    if(rounddata[w].card == text) {
		winner = rounddata[w].user;
		console.log('winner',winner);
		var winnernum = lookup[winner];
		users[winnernum].score++;
		var words = users[winnernum].words;
		words.push(text);
		users[winnernum].words = words;
		console.log(users);
		break;
	    }
	}
	io.sockets.emit('endround', users, winner);
    });


});

//-----------SERVER SIDE FUNCTIONS-------------

//get card from which deck
function getCard(cards) {
    var random = getRandomInt(0, cards.length);
    if (cards[random].used == false) {
	cards[random].used = true;
	console.log("key", cards[random].key);
	return cards[random].key;
    }
    return getCard(cards);
}
//get random number
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}