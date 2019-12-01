var os = require('os');
var nodeStatic = require('node-static');
var socketIO = require('socket.io');
var fileServer = new(nodeStatic.Server)();

var ws = require('./ws')
var xs = require('./xs')

var http = require('http');

const serverPort = 8085;

var app = http.createServer(function(req, res) {
	//console.log('Example app listening on port ' + serverPort + '!')
	fileServer.serve(req, res);
}).listen(serverPort);

var io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {

	log('ok');
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

});