
var express = require('express')
, app = express()
, http = require('http')
, server = http.createServer(app)
, io = require('socket.io').listen(server);

//allowing directory
app.use(express.static(__dirname));

server.listen(8080, function() {
    console.log("starting server on 8080");
});

// routing
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var redcards = [];
var greencards = [];
var currentturn = -1;
var users = [];

io.sockets.on('connection', function (socket) {
    // when the client emits 'sendchat', this listens and executes
    //socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    ///  io.sockets.emit('updatechat', socket.username, data);
    //});

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username){
	console.log('add user '+ username);
	// we store the username in the socket session for this client
	socket.username = username;
	// add the client's username to the global list
	users[Object.keys(usernames).length] = socket.id;
	usernames[socket.id] = username;
	// echo to client they've connected
	socket.emit('updatechat', 'SERVER', 'you have connected');
	// echo globally (all clients) that a person has connected
	socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
	// update the list of users in chat, client-side
	io.sockets.emit('updateusers', usernames);

    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
	// remove the username from global usernames list
	delete usernames[socket.id];
	// update list of users in chat, client-side
	io.sockets.emit('updateusers', usernames);
	// echo globally that this client has left
	socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    });

    //update card data for every user
    socket.on('loadcards', function(red, green) {
	console.log('update card data');
	redcards = red;
	greencards = green;
    });

    socket.on('newround', function() {
	currentturn++;
	for (var user in usernames) {
	    if (usernames.hasOwnProperty(user)) {
		console.log('dealing hand for '+user);
		for(var c = 0; c < 3; c++) {
		    io.to(user).emit('dealred', getCard(redcards));
		    console.log('deal one card');
		}
		if(users[currentturn] == user) {
		    io.to(user).emit('yourturn');
		}
	    }
	}
	io.sockets.emit('dealgreen', getCard(greencards));
    });
});


function getCard(cards) {
    var random = getRandomInt(0, cards.length);
    if (cards[random].used == true) {
	getCard(cards);
    }
    cards[random].used = true;
    return cards[random].key;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}