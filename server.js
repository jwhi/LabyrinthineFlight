var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var Rogue = require('./Rogue.js');

app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected');
    socket.on('disconnect', function() {
        console.log('user disconnected.');
    });
    socket.on('request', function(data) {
        console.log(data);
        var rot = new Rogue();
        var map = rot.generateMap();
    
        var str = "";
        for (var y = 0; y < 30; y++) {
            for (var x = 0; x < 30; x++) {
                str += map[x+","+y];
            }
            str += "\n";
        }
        console.log(str);
        socket.emit('map', map);
        
    });
})

http.listen(3000, function() {
    console.log('Listening on port 3000.');
});