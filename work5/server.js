const os = require('os');
const fs = require('fs');
/*
const nodeStatic = require('node-static');
const socketIO = require('socket.io');
const fileServer = new(nodeStatic.Server)();
*/
const https = require('https');
const express = require('express');
const app = express();


const serverPort = 443;
const privateKey = fs.readFileSync(__dirname + '/ssl-cert/server.pem', 'utf8');
const certificate = fs.readFileSync(__dirname + '/ssl-cert/server.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate /* , passphrase: '' */ };

app.use(express.static('public'));
app.use(function(req, res, next) {
	if(req.headers['x-forwarded-proto']==='http') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Request-Method', '*');
		res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
		res.setHeader('Access-Control-Allow-Headers', '*');
		if ( req.method === 'OPTIONS' ) {
			res.writeHead(200);
			res.end();
			return;
		}
		return res.redirect(['https://', req.get('Host'), req.url].join(''));
	}
	next();
});

const httpsServer = https.createServer(credentials, app).listen(serverPort);

/* WS */
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({server: httpsServer, path: '/socket'});  

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wss.on('connection', function (ws, req) {
	ws.id = wss.getUniqueID();
	console.log('Client ID: ' + ws.id /*JSON.stringify(ws)*/);

	let clients = wss.clients;
	clients.forEach(function each(client) {
		if (client.readyState === 1 ) {
			client.send(JSON.stringify({ type: "newclient", id: ws.id}));
		}
	});

	/*
	const parameters = url.parse(req.url, true);
	ws.uid = wss.getUniqueID();
    ws.chatRoom = {uid: parameters.query.myCustomID};
    ws.hereMyCustomParameter = parameters.query.myCustomParam;
	*/
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
				//console.log("offer : ", JSON.stringify(data.offer));
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "offer", offer: data.offer, sender: data.sender, name: data.name, id: client.id}));
					}
				});
            break;
				
			case "answer": 
				console.log("WS Sending answer to: ", data.name); 
				//console.log("answer : ", JSON.stringify(data.answer));	
				wss.clients.forEach(function each(client) {
					console.log('wsId: ' + ws.id);
					console.log('clienId: ' + client.id);
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "answer", answer: data.answer, sender: data.sender, name: data.name, id: client.id}));
					}
				});
            break; 
				
			case "candidate": 
				console.log("WS Sending candidate to:",data.name); 
				//console.log("candidate : ", JSON.stringify(data.candidate));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "candidate", candidate: data.candidate, sender: data.sender, name: data.name, id: client.id}));
					}
				});
            break;
			
			case "start": 
				console.log("WS Sending Start Call to:",data.name); 
				console.log("start : ", JSON.stringify(data.start));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "start", start: data.start, sender: data.sender, name: data.name, id: client.id}));
					}
				});
            break;

			case "leave": 
				console.log("WS Sending Leave Call to:",data.name); 
				console.log("leave : ", JSON.stringify(data.leave));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "start", leave: data.leave, sender: data.sender, name: data.name, id: client.id}));
					}
				});
            break;

			case "test": 
				console.log("WS Sending test to:",data.name); 
				console.log("test : ", JSON.stringify(data.test));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "test", test: data.test, sender: data.sender, name: data.name, id: client.id}));
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

