
//https://stackoverflow.com/questions/47627244/how-to-make-express-js-and-socket-io-listen-to-different-ports

var exApp = require('express')();
var exServer = require('http').Server(exApp);

var ioApp = require('http').createServer(handler);
var io = require('socket.io')(ioApp);

exServer.listen(80);
ioApp.listen(81);

function handler (req, res) {
  res.writeHead(200).end({});
}

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// Then whatever you want to do with `io`, and `exApp`.
