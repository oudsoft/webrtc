const os = require('os');
const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();

const serverPort = 4433;
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
const roomname = 'socket';

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({server: httpsServer, path: '/' + roomname});  

/* Chat*/
/* Rooms*/
const rooms = [];
const newChatRoom = {roomName: roomname, users: [], messages: []};
rooms.push(newChatRoom);
let masterId = '';
let masterNo = '';

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wss.getNextClientNo = function () {
	let countClient = wss.clients.size;
	return padZero((countClient), 2)
};

wss.on('connection', function (ws, req) {
	//console.log(`WS Conn Url : ${req.url}`);
	let fullReqPaths = req.url.split('?');
	let connType = fullReqPaths[1].split('=');
	//console.log(connType);
	ws.id = wss.getUniqueID();
	let yourNo = wss.getNextClientNo();
	//console.log('Client ID: ' + ws.id /*JSON.stringify(ws)*/);
	//console.log('YourNo: ' + yourNo);
	
	let newclientObject = null;
	if (connType[1] === 'master'){
		masterId = ws.id;
		masterNo = yourNo;
		newclientObject = {clientType: 'master', clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo};
	} else if (connType[1] === 'client'){
		newclientObject = {clientType: 'client',  clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo};
	} else {
		newclientObject = {error: 'Wrong Connection'};
	}
	newclientObject.type = "register";
	newclientObject.channel = "chat";
	ws.send(JSON.stringify(newclientObject));

	newclientObject.type = "newclient";
	let clients = wss.clients;
	clients.forEach(function each(client) {
		if (client.readyState === 1 ) {
			client.send(JSON.stringify(newclientObject));
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
				console.log("WS Receive Offer From " + data.name + "[" + masterId + "]" + " and Sending Offer To: " + data.clientId);	
				//console.log("offer : ", JSON.stringify(data.offer));
				wss.clients.forEach(function each(client) {
					console.log('Offer: client.id: ' + client.id);
					console.log('Offer: data.clienId: ' + data.clientId);
					//if (client !== ws && client.readyState === 1) {
					if ((client.readyState === 1 ) && (client.id === data.clientId)){
						client.send(JSON.stringify({ channel: data.channel, type: "offer", offer: data.offer, sender: data.sender, name: data.name, clientId: data.clientId}));
						console.log('Offer: Sent');
					} else {
						console.log('Offer: Unsent');
					}
				});
            break;
				
			case "answer": 
				console.log("WS Receive Answer From " + data.name + "[" + data.clientId + "]" + " and Sending Answer To: " + "[" + masterId + "]"); 
				//console.log("answer : ", JSON.stringify(data.answer));	
				wss.clients.forEach(function each(client) {
					console.log('Answer: client.id: ' + client.id);
					console.log('Answer: data.clienId: ' + data.clientId);
					//if (client !== ws && client.readyState === 1) {
					if ((client.readyState === 1 ) && (client.id === masterId) ){
						client.send(JSON.stringify({ channel: data.channel, type: "answer", answer: data.answer, sender: data.sender, name: data.name, clientId: data.clientId}));
						console.log('Answer: Sent');
					} else {
						console.log('Answer: Unsent');
					}
				});
            break; 
				
			case "candidate": 
				wss.clients.forEach(function each(client) {
					console.log("WS Sending candidate to:"+  data.name  + "[" + client.id + "]"); 
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "candidate", candidate: data.candidate, sender: data.sender, name: data.name, clientId: client.id}));
					}
				});
            break;
			
			case "start": 
				console.log("WS Sending Start Call to:",data.name); 
				console.log("start : ", JSON.stringify(data.start));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "start", start: data.start, sender: data.sender, name: data.name, clientId: client.id}));
					}
				});
            break;

			case "leave": 
				console.log("WS Sending Leave Call to:",data.name); 
				console.log("leave : ", JSON.stringify(data.leave));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "start", leave: data.leave, sender: data.sender, name: data.name, clientId: client.id}));
					}
				});
            break;

			case "test": 
				console.log("WS Sending test to:",data.name); 
				console.log("test : ", JSON.stringify(data.test));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ channel: data.channel, type: "test", test: data.test, sender: data.sender, name: data.name, clientId: client.id}));
					}
				});
            break;
			
			case "message":
				console.log("WS Sending message to:",data.name); 
				console.log("message: ", JSON.stringify(data.message));	
				if (data.sendto === 'all') {
					getRoomByName(data.message.roomName).then(function(room) {
						room.messages.push(data.message);
						wss.clients.forEach(function each(client) {
							client.send(JSON.stringify({channel: 'chat', type: 'message', message: data.message}));
						});
					});
				} else {
					let sendto = wss.clients.filter(function(client){ return client.id === data.sendto;});
					if (sendto) {
						sendto.send(JSON.stringify({channel: 'chat', type: 'message', message: data.message}));
					}
				}
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

/* Utility */
function padZero(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function getRoomByName(roomName) {
	return new Promise(function(resolve, reject) {
		var result = rooms.filter(function(item, inx) {
			if(roomName === item.roomName){return (item); }
		});
		//console.log('The Result:=> ' + JSON.stringify(result));
		if (result.length > 0){
			resolve(result[0]);
		}else {
			resolve({});
		}
	});
}
