//client.js
const myname = 'client';

var hostname = window.location.hostname;
var ws = new WebSocket('wss://' + hostname + ':8085/socket');

ws.onopen = function () {
	console.log('websocket is connected to the signaling server')
}

ws.onmessage = function (msg) {
	console.log("WS Got message", msg.data);
	if ((msg.data !== '') && (msg.data !== 'Hello world')) {
	   var data = JSON.parse(msg.data); 
	   switch(data.channel) { 
		case "screen":
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
		break;
		case "media":
		   switch(data.type) { 
			//when somebody wants to call us 
			case "offer": 
				xsHandleOffer(data.offer, data.sender); 
				break; 
			case "answer": 
				xsHandleAnswer(data.answer, data.sender); 
				break; 
			//when a remote peer sends an ice candidate to us 
			case "candidate": 
				xsHandleCandidate(data.candidate, data.sender); 
				break; 
			case "leave": 
				xsHandleLeave(data.sender); 
				break; 
			default: 
				break; 
		  }
		break;
		default: 
		break; 
	}
     }
}

ws.onerror = function (err) { 
   console.log("WS Got error", err); 
}

 //using Google public stun server 
 const configuration = { 
	"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }, {'url': 'stun:stun.services.mozilla.com'}]
 }; 

const offerOptions = {
	offerToReceiveVideo: 1,
	offerToReceiveAudio: 1
};


//* Screen Section *//

var localConn; 
var remoteConn;

function doCallStream() {
   ws.send(JSON.stringify({
		channel: "screen",
		type: "start",
		name: myname,
		sender: 'remote',
		start: {start: 'start', channel: 'screen', name: myname, id: ws.id, sender: 'remote'} 
	}));  
}

function doInitStream() {
	/*	
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
	*/

	 remoteConn = new RTCPeerConnection(configuration); 

	 remoteConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				channel: "screen",
				type: "candidate", 
				candidate: event.candidate,
				name: myname,
				sender: 'remote',
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

	//localConn.addStream(localStream); 
}

//initiating a call 
function doStartShareScreen() {
	
	doInitStream();

	// create an offer 
	localConn.createOffer(function (offer) { 
		ws.send(JSON.stringify({ 
			channel: "screen",
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
		channel: "screen",
		type: "leave",
		name: myname,
		sender: 'remote',
		leave: {leave: 'leave', channel: 'screen', name: myname, id: ws.id, sender: 'remote'} 

   }));  
}

//when somebody sends us an offer 
function wsHandleOffer(offer) {
	//alert('ok');
	remoteConn.setRemoteDescription(new RTCSessionDescription(offer));
	
	//create an answer to an offer 
	remoteConn.createAnswer(function (answer) { 
		console.log(JSON.stringify(answer));
		remoteConn.setLocalDescription(answer); 

		ws.send(JSON.stringify({ 
			channel: "screen",
			type: "answer", 
			answer: answer,
			sender: 'remote',
			name: myname
		})); 
		
	}, function (error) { 
		console.log(JSON.stringify(error));
		alert("Error when creating an answer"); 
	}); 
}

//when we got an answer from a remote user
function wsHandleAnswer(answer) { 
   //localConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function wsHandleCandidate(candidate) { 
	//console.log('event=> ' + JSON.stringify(candidate));
	remoteConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};

function wsHandleLeave() {
	//localVideo.srcObject = null; 
	remoteVideo.srcObject = null; 
	
	//localConn.close(); 
	//localConn.onicecandidate = null; 
	//localConn.onaddstream = null; 

	remoteConn.close(); 
	remoteConn.onicecandidate = null; 
	remoteConn.onaddstream = null; 
}

////////////////////////////////////////////////////

//* Media Section *//

//var localMediaConn; 
var remoteMediaConn;
/*
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
*/
function doCallMedia() {
   ws.send(JSON.stringify({
		channel: "media",
		type: "start",
		name: myname,
		sender: 'remote',
		start: {start: 'start', channel: 'media', name: myname, id: ws.id, sender: 'remote'} 
	}));  
}

function doStopShareMedia() {
   ws.send(JSON.stringify({
		channel: "media",
		type: "leave",
		name: myname,
		sender: 'remote',
		leave: {leave: 'leave', channel: 'media', name: myname, id: ws.id, sender: 'remote'} 
	}));  
}

function doInitMedia() {
	/*
	 localMediaConn = new RTCPeerConnection(configuration); 
		
	 // Setup ice handling 
	 localMediaConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   xs.send(JSON.stringify({ 
				type: "candidate", 
				candidate: event.candidate,
				name: myname
		   })); 
		} 
	 };
	 
	 localMediaConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		console.log('Local ICE state change event: ', event);
		console.log('localMediaConn.iceConnectionState: ' + localMediaConn.iceConnectionState);
		localMediaConn = peerConnection;
	 };
	
	*/
	 remoteMediaConn = new RTCPeerConnection(configuration); 

	 remoteMediaConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				channel: "media",
				type: "candidate", 
				candidate: event.candidate,
				sender: 'remote',
				name: myname
		   })); 
		} 
	 };

 	 remoteMediaConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		console.log('Remote ICE state change event: ', event);
		console.log('remoteMediaConn.iceConnectionState: ' + remoteMediaConn.iceConnectionState);
		remoteMediaConn = peerConnection;
	 };

	remoteMediaConn.ontrack = function(event) {
		remoteMediaStream = event.streams[0];
		console.log('Remote MediaConn ontrack event: ', event);
		remoteMediaVideo.srcObject = remoteMediaStream;
		event.track.onended = e => remoteMediaVideo.srcObject = remoteMediaVideo.srcObject;
	};

	//localMediaConn.addStream(localMediaStream); 
}

function doStartShareMedia(){

	doInitMedia();

	// create an offer 
	/*
	localMediaConn.createOffer(function (offer) { 
		ws.send(JSON.stringify({ 
			channel: "media",
			type: "offer", 
			offer: offer,
			name: myname
		})); 

		localMediaConn.setLocalDescription(offer); 

	}, function (error) { 
		alert("XSError when creating an offer"); 
	});
	*/
}

//when somebody sends us an offer 
function xsHandleOffer(offer, sender) {
   remoteMediaConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   remoteMediaConn.createAnswer(function (answer) { 
		console.log('Client\'s Answer with message' + JSON.stringify(answer));
		remoteMediaConn.setLocalDescription(answer); 
		ws.send(JSON.stringify({ 
			channel: "media",
			type: "answer", 
			answer: answer,
			sender: 'remote',
			name: myname
		})); 
		
   }, function (error) { 
		console.log('Media Creaate Answer Error: ' + JSON.stringify(error));
   }); 
}

//when we got an answer from a remote user
function xsHandleAnswer(answer, sender) { 
	console.log('The Answer from Remote: ' + JSON.stringify(answer));
   //remoteMediaConn.setLocalDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function xsHandleCandidate(candidate, sender) { 
	console.log('xsHandleCandidate=> ' + JSON.stringify(candidate));
	if (sender === 'local') {
		remoteMediaConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
			function() {console.log('remoteMediaConn AddIceCandidate success.');},
			function(error) {console.log('remoteMediaConn Failed to add Ice Candidate:' + error.toString());}
		);
	}
};

function xsHandleLeave(sender) {
	//localMediaVideo.srcObject = null; 
	remoteMediaVideo.srcObject = null; 
	
	//localMediaConn.close(); 
	//localMediaConn.onicecandidate = null; 
	//localMediaConn.onaddstream = null; 

	remoteMediaConn.close(); 
	remoteMediaConn.onicecandidate = null; 
	remoteMediaConn.onaddstream = null; 
}

////////////////////////////////////////////////////////////////////
/*
if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}
*/
function requestTurn(turnURL) {
	var turnExists = false;
	for (var i in configuration.iceServers) {
		if (configuration.iceServers[i].urls.substr(0, 5) === 'turn:') {
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
				configuration.iceServers.push({
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
