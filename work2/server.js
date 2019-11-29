//server.js
var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);

var io = socketIO.listen(app);



io.on('connection', function (socket) {

  console.log('NEW CONNECTION');

  socket.on('offer', function (data) {
    console.log(data);
    socket.broadcast.emit("offer",data);
  });

  socket.on('answer', function (data) {
    console.log(data);
    socket.broadcast.emit("answer",data);
  });

  socket.on('candidate', function (data) {
    console.log(data);
    socket.broadcast.emit("candidate",data);
  });
});