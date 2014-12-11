
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
	usernames[username] = username;
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
	delete usernames[socket.username];
	// update list of users in chat, client-side
	io.sockets.emit('updateusers', usernames);
	// echo globally that this client has left
	socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    });

    socket.on('updatecarddata', function(red, green) {
	io.sockets.emit('updatecarddata', red, green);
    });

});