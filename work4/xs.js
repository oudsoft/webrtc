var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 4061})

wss.on('connection', function (ws) {
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
				console.log("XS Sending offer to: ", data.name);	
				console.log("offer : ", JSON.stringify(data.offer));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ type: "offer", offer: data.offer}));
					}
				});
				/*
				sendTo(ws, { 
					type: "offer", 
					offer: data.offer, 
				}); 
				*/
            break;
				
			case "answer": 
				console.log("XS Sending answer to: ", data.name); 
				console.log("answer : ", JSON.stringify(data.answer));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ type: "answer", answer: data.answer}));
					}
				});
				/*
				sendTo(ws, { 
					type: "answer", 
					answer: data.answer 
				}); 
				*/
            break; 
				
			case "candidate": 
				console.log("XS Sending candidate to:",data.name); 
				console.log("candidate : ", JSON.stringify(data.candidate));	
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ type: "candidate", candidate: data.candidate}));
					}
				});
				/*
				sendTo(ws, { 
					type: "candidate", 
					candidate: data.candidate 
				}); 
				*/
            break;

			default: 
				wss.clients.forEach(function each(client) {
					//if (client !== ws && client.readyState === 1) {
					if (client.readyState === 1 ) {
						client.send(JSON.stringify({ type: "error", message: "Command not found: " + data.type}));
					}
				});
				/*
				sendTo(ws, { 
				   type: "error", 
				   message: "Command not found: " + data.type 
				}); 
				*/
            break; 

		}
	})
})

function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}
