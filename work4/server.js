var os = require('os');
var fs = require('fs');
var nodeStatic = require('node-static');
var socketIO = require('socket.io');
var fileServer = new(nodeStatic.Server)();

var privateKey = fs.readFileSync(__dirname + '/ssl-cert/key.pem', 'utf8');
var certificate = fs.readFileSync(__dirname + '/ssl-cert/server.crt', 'utf8');

var credentials = { key: privateKey, cert: certificate };

var https = require('https');

const serverPort = 8085;

var httpsServer = https.createServer(credentials, function(req, res) {
	//console.log('Example app listening on port ' + serverPort + '!')
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}

	fileServer.serve(req, res);
}).listen(serverPort);


/* WS */
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: httpsServer, path: '/socket'});

wss.on('connection', function (ws) {
	ws.send("Hello world");  

	ws.on('message', function (message) {
		var data; 
		
		//accepting only JSON messages 
		try { 
			data = JSON.parse(message); 
		} catch (e) { 
			console.log("Invalid JSON"); 
			data = {}; 
		}

		//switching type of the user message 
		switch (data.type) { 
			case "offer": 
				console.log("WS Sending offer to: ", data.name);	
				console.log("offer : ", JSON.stringify(data.offer));
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "offer", offer: data.offer}));
					}
				});
            		break;
				
			case "answer": 
				console.log("WS Sending answer to: ", data.name); 
				console.log("answer : ", JSON.stringify(data.answer));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "answer", answer: data.answer}));
					}
				});
            		break; 
				
			case "candidate": 
				console.log("WS Sending candidate to:",data.name); 
				console.log("candidate : ", JSON.stringify(data.candidate));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "candidate", candidate: data.candidate}));
					}
				});
            		break;

			default: 
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "error", message: "Command not found: " + data.type}));
					}
				});
            		break; 
		}
	});
});

