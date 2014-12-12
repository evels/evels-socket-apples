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
var redcardstracker = 0;
var greencardstracker = 0;
var currentturn = -1;
var currentuser = '';
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
	console.log("new round");

	//clear data
	rounddata = [];

	var dealcount = 0;
	var newredcard = '';
	var newgreencard = '';
	if(gameinsession == false) {
	    dealcount = 3;
	    gameinsession = true;
	    for (var u = 0; u < users.length; u++) {
		console.log('dealing hand for '+ users[u].name);
		for(var c = 0; c < dealcount; c++) {
		    newredcard = redcards[redcardstracker];
		    console.log(redcardstracker,redcards.length-1);
		    console.log((redcardstracker == redcards.length-1));
		    redcardstracker = (redcardstracker == redcards.length-1) ? 0 : redcardstracker+1;
		    console.log(redcardstracker);
		    io.to(users[u].iden).emit('dealred', newredcard);
		}
	    }
	}
	else {
	    io.sockets.emit('cleanupround');
	}

	//advance turn
	if (currentturn >= users.length-1) {
	    currentturn = -1;
	}
	currentturn++;

	//identify turn
	for (var u = 0; u < users.length; u++) {
	    if(users[u].name == users[currentturn].name) {
		console.log("turn:"+ users[currentturn].name);
		io.to(users[u].iden).emit('yourturn');
	    }
	    else {
		io.to(users[u].iden).emit('pickred');
	    }
	}

	//deal green card
	newgreencard = greencards[greencardstracker];
	greencardstracker = (greencardstracker == greencards.length-1) ? 0 : greencardstracker+1;
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

	newredcard = redcards[redcards.length-1];
	redcards.pop();
	io.to(socket.id).emit('dealred', newredcard);

	if(rounddata.length == users.length-1) { //everyone has submitted
	    console.log('time to select the winner');
	    io.to(users[currentturn].iden).emit('selectwinner');
	}
    });

    //update the score
    socket.on('updatescore', function(textr, textg) {
	console.log("updating score " + textr + textg);
	var winner;
	for(var w = 0; w < rounddata.length; w++) {
	    if(rounddata[w].card == textr) {
		winner = rounddata[w].user;
		console.log('winner',winner);
		var winnernum = lookup[winner];
		users[winnernum].score++;
		var words = users[winnernum].words;
		words.push(textg);
		users[winnernum].words = words;
		console.log(users);
		break;
	    }
	}
	io.sockets.emit('endround', users, winner);
    });


});

//-----------SERVER SIDE FUNCTIONS-------------


