var redCards = ["Morgan Freeman", "whatwhat"];
var greenCards = ["sad", "quiet"];
var usernames = {};


$(document).ready(function() {

    //load cards
    // $.get('languages.txt', function(txtFile){
    //    var languages = txtFile.split("\n");
    //    $("#tags").autocomplete({
    //        source: languages
    //    });
    //});

    var socket = io.connect('http://localhost:8080');

    //getting player name
    $('.player-enter').submit(function(event) {
        event.preventDefault();
        var name = $('#player-name').val();
        socket.emit('adduser', name);
        $(this).fadeOut();
        return;
    });
    
    $('.game-begin').on('click', function() {
        $('.game-enter .error').text();
       if(Object.keys(usernames).length > 2) {
           socket.emit('begingame');
       } 
       else {
           $('.game-enter .error').text("You must have more players!");
       }
    });

    // on connection to server, ask for user's name with an anonymous callback
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
            $('#users').append('<div>' + key + '</div>');
        });
    });

    socket.on('dealcards', function(newplayer) {
        $('.player').text(redCards[0]); 
    });
    
    socket.on('startgame', function() {
        $('.game-enter').fadeOut();
        $('.dealer').text(greenCards[0]);
    });

    // on load of page
    $(function(){
    
        });

});
 