//client.js
var ws = new WebSocket('ws://localhost:4060');
var xs = new WebSocket('ws://localhost:4061');

ws.onopen = function () {
	console.log('WS websocket is connected to the signaling server')
}

ws.onmessage = function (msg) {
	console.log("WS Got message", msg.data);
	if ((msg.data !== '') && (msg.data !== 'ws Hello world')) {
	   var data = JSON.parse(msg.data); 
	   switch(data.type) { 
			//when somebody wants to call us 
			case "offer": 
				wsHandleOffer(data.offer); 
				break; 
			case "answer": 
				wsHandleAnswer(data.answer); 
				break; 
			//when a remote peer sends an ice candidate to us 
			case "candidate": 
				wsHandleCandidate(data.candidate); 
				break; 
			case "leave": 
				wsHandleLeave(); 
				break; 
			default: 
				break; 
	   }
	}
}

ws.onerror = function (err) { 
   console.log("WS Got error", err); 
}

xs.onopen = function () {
	console.log('XS websocket is connected to the signaling server');
}

xs.onmessage = function (msg) {
	console.log("XS Got message", msg.data);
	if ((msg.data !== '') && (msg.data !== 'xs Hello world')) {
	   var data = JSON.parse(msg.data); 
	   switch(data.type) { 
			//when somebody wants to call us 
			case "offer": 
				xsHandleOffer(data.offer); 
				break; 
			case "answer": 
				xsHandleAnswer(data.answer); 
				break; 
			//when a remote peer sends an ice candidate to us 
			case "candidate": 
				xsHandleCandidate(data.candidate); 
				break; 
			case "leave": 
				xsHandleLeave(); 
				break; 
			default: 
				break; 
	   }
	}
}

xs.onerror = function (err) { 
   console.log("XS Got error", err); 
}

 //using Google public stun server 
 const configuration = { 
	"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
 }; 

const offerOptions = {
	offerToReceiveVideo: 1,
	offerToReceiveAudio: 1
};

var localConn; 
var remoteConn;

var localMediaConn; 
var remoteMediaConn;


//* Screen Section *//

function doInitStream() {
		
	 localConn = new RTCPeerConnection(configuration); 
		
	 // Setup ice handling 
	 localConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				type: "candidate", 
				candidate: event.candidate 
		   })); 
		} 
	 };
	 
	 localConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		console.log('ICE state change event: ', event);
	 };

	 remoteConn = new RTCPeerConnection(configuration); 

	 remoteConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				type: "candidate", 
				candidate: event.candidate 
		   })); 
		} 
	 };

 	 remoteConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		console.log('ICE state change event: ', event);
	 };

	remoteConn.onaddstream = function(event) {
		const stream = event.stream;
		remoteVideo.srcObject = stream;
		remoteStream = stream;
	};

	localConn.addStream(localStream); 

	//localConn.createOffer(offerOptions).then(createdOffer).catch(setSessionDescriptionError);

}

//initiating a call 
function doStartShareScreen() {
	
	doInitStream();

	// create an offer 
	localConn.createOffer(function (offer) { 
		ws.send(JSON.stringify({ 
			type: "offer", 
			offer: offer 
		})); 

		localConn.setLocalDescription(offer); 

	}, function (error) { 
		alert("WSError when creating an offer"); 
	});
}

function doStopShareScreen() {
   ws.send(JSON.stringify({
		type: "leave" 
   }));  
}

//when somebody sends us an offer 
function wsHandleOffer(offer) {
   remoteConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   remoteConn.createAnswer(function (answer) { 
		console.log(JSON.stringify(answer));
		remoteConn.setLocalDescription(answer); 

		ws.send(JSON.stringify({ 
			type: "answer", 
			answer: answer 
		})); 
		
   }, function (error) { 
		console.log(JSON.stringify(error));
		alert("Error when creating an answer"); 
   }); 
}

//when we got an answer from a remote user
function wsHandleAnswer(answer) { 
   localConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function wsHandleCandidate(candidate) { 
	//console.log('event=> ' + JSON.stringify(candidate));
	localConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};

function wsHandleLeave() {
	localVideo.srcObject = null; 
	remoteVideo.srcObject = null; 
	
	localConn.close(); 
	localConn.onicecandidate = null; 
	localConn.onaddstream = null; 

	remoteConn.close(); 
	remoteConn.onicecandidate = null; 
	remoteConn.onaddstream = null; 
}

////////////////////////////////////////////////////

//* Media Section *//

function doGetLocalMedia() {
	navigator.mediaDevices.getUserMedia({
		audio: true,
		video: true
	})
	.then(gotMediaStream)
	.catch(function(e) {
		alert('getUserMedia() error: ' + e.name);
	});
}

function gotMediaStream(stream) {
	console.log('Adding local media stream.');
	localMediaStream = stream;
	localMediaVideo.srcObject = stream;
}

function doStopShareMedia() {
	localMediaStream.getTracks()[0].stop();
	localMediaStream.getTracks()[1].stop();

   xs.send(JSON.stringify({
		type: "leave" 
   }));  
}

function doInitMedia() {
		
	 localMediaConn = new RTCPeerConnection(configuration); 
		
	 // Setup ice handling 
	 localMediaConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   xs.send(JSON.stringify({ 
				type: "candidate", 
				candidate: event.candidate 
		   })); 
		} 
	 };
	 
	 localMediaConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		console.log('ICE state change event: ', event);
	 };

	 remoteMediaConn = new RTCPeerConnection(configuration); 

	 remoteMediaConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   xs.send(JSON.stringify({ 
				type: "candidate", 
				candidate: event.candidate 
		   })); 
		} 
	 };

 	 remoteMediaConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		console.log('ICE state change event: ', event);
	 };

	remoteMediaConn.onaddstream = function(event) {
		const stream = event.stream;
		remoteMediaVideo.srcObject = stream;
		remoteMediaStream = stream;
	};

	localMediaConn.addStream(localMediaStream); 
}

function doStartShareMedia(){

	doInitMedia();

	// create an offer 
	localMediaConn.createOffer(function (offer) { 
		xs.send(JSON.stringify({ 
			type: "offer", 
			offer: offer 
		})); 

		localMediaConn.setLocalDescription(offer); 

	}, function (error) { 
		alert("XSError when creating an offer"); 
	});

}

//when somebody sends us an offer 
function xsHandleOffer(offer) {
   remoteMediaConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   remoteMediaConn.createAnswer(function (answer) { 
		console.log(JSON.stringify(answer));
		remoteMediaConn.setLocalDescription(answer); 

		xs.send(JSON.stringify({ 
			type: "answer", 
			answer: answer 
		})); 
		
   }, function (error) { 
		console.log(JSON.stringify(error));
		alert("XSError when creating an answer"); 
   }); 
}

//when we got an answer from a remote user
function xsHandleAnswer(answer) { 
   localMediaConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function xsHandleCandidate(candidate) { 
	//console.log('event=> ' + JSON.stringify(candidate));
	localMediaConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};

function xsHandleLeave() {
	localMediaVideo.srcObject = null; 
	remoteMediaVideo.srcObject = null; 
	
	localMediaConn.close(); 
	localMediaConn.onicecandidate = null; 
	localMediaConn.onaddstream = null; 

	remoteMediaConn.close(); 
	remoteMediaConn.onicecandidate = null; 
	remoteMediaConn.onaddstream = null; 
}


////////////////////////////////////////////////////////////////////
if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function requestTurn(turnURL) {
	var turnExists = false;
	for (var i in pcConfig.iceServers) {
		if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
			turnExists = true;
			turnReady = true;
			break;
		}
	}
	if (!turnExists) {
		console.log('Getting TURN server from ', turnURL);
		// No TURN server. Get one from computeengineondemand.appspot.com:
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var turnServer = JSON.parse(xhr.responseText);
				console.log('Got TURN server: ', turnServer);
				pcConfig.iceServers.push({
					'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
					'credential': turnServer.password
				});
				turnReady = true;
			}
		};
		xhr.open('GET', turnURL, true);
		xhr.send();
	}
}

///////////////////////////////////////////////////////
var socket = io.connect();

function doTest() {
	//socket.emit('message', {message: 'test'});

	ws.send(JSON.stringify({ 
		type: "offer", 
		offer: {offer: 'test'} 
	})); 
	
}