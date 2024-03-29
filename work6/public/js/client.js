//client.js
const myname = 'client';
const roomname = 'socket';

const hostname = window.location.hostname;
var ws = null;

function doConnect() {
	//ws = new WebSocket('wss://' + hostname + ':4433/' + roomname + '?type=' + myname);
	ws = new WebSocket('wss://' + hostname + '/' + roomname + '?type=' + myname);
	ws.onopen = function () {
		console.log('Websocket is connected to the signaling server');
	}

	ws.onmessage = function (msg) {
		//console.log("WS Got message", msg.data);
		if ((msg.data !== '') && (msg.data !== 'Hello world')) {
		   var data = JSON.parse(msg.data); 
			if (data.type !== 'newclient')	{
				switch(data.channel) { 
				case "screen":
				   switch(data.type) { 
					//when somebody wants to call us 
					case "offer": 
						wsHandleOffer(data.offer, data.sender); 
						break; 
					case "answer": 
						wsHandleAnswer(data.answer, data.sender); 
						break; 
					//when a remote peer sends an ice candidate to us 
					case "candidate": 
						wsHandleCandidate(data.candidate, data.sender); 
						break; 
					case "leave": 
						wsHandleLeave(data.sender); 
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
				case "chat":
					switch(data.type) {
					case "register": 
						handleRegister(data);
					break;
					case "message": 
						handleMessage(data.message);
					break;
					case "refresh": 
						handleRefreshWindow();
					break;
					default: 
						break; 
					}
				break;
				default: 
				break; 
				}
			} else {
				//clientId = data.clientId;
			}
		}
	}

	ws.onerror = function (err) { 
	   console.log("WS Got error", err); 
	}

	doInitStream();
	doInitMedia();
	doReadySystem();
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

var remoteConn;

function doCallStream() {
   ws.send(JSON.stringify({
		channel: "screen",
		type: "start",
		name: myname,
		sender: 'remote',
		start: {start: 'start', channel: 'screen', name: myname, id: ws.id, sender: 'remote'},
		clientId: this.clientId
	}));  
}

function doInitStream() {

	remoteConn = new RTCPeerConnection(configuration); 
	console.log("ICE gathering state of remoteConn: "  + remoteConn.iceGatheringState); 

	remoteConn.onicecandidate = function (event) { 
		console.log("ICE gathering state change: " + event.target.iceGatheringState);
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				channel: "screen",
				type: "candidate", 
				candidate: event.candidate,
				name: myname,
				sender: 'remote',
				clientId: this.clientId
		   })); 
		} 
	};

	console.log("ICE connection state: " + remoteConn.iceConnectionState); 

 	remoteConn.oniceconnectionstatechange = function(event) {
		console.log('ICE state change event: ', event);
		//console.log("ICE connection state change: " + event.target.iceConnectionState);
		const peerConnection = event.target;
		const ref = peerConnection.iceConnectionState;
		if (ref!== "closed" && ref !== "failed" && ref !== "disconnected" && ref !== "completed") {
			remoteConn = peerConnection;
		}
	};
	
	remoteConn.ontrack = function(event) {
		remoteStream = event.streams[0];
		console.log('RemoteSteamConn ontrack event: ', event);
		remoteVideo.srcObject = remoteStream;
		event.track.onended = e => remoteVideo.srcObject = remoteVideo.srcObject;
	};

}

//initiating a call 
function doStartShareScreen() {
	
	doInitStream();

	// create an offer 
	localConn.createOffer(function (offer) { 
		ws.send(JSON.stringify({ 
			channel: "screen",
			type: "offer", 
			offer: offer,
			sender: 'remote',
			name: myname,
			clientId: clientId			
		})); 

		localConn.setLocalDescription(offer); 

	}, function (error) { 
		alert("WSError when creating an offer"); 
	});
}

function doDisconnect() {
	doStopShareScreen();
	doStopShareMedia();
	doInitSystem();
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
function wsHandleOffer(offer, sender) {
	console.log('clientId:=> ' + clientId );
	remoteConn.setRemoteDescription(new RTCSessionDescription(offer));
	
	//create an answer to an offer 
	remoteConn.createAnswer(function (answer) { 
		//console.log(JSON.stringify(answer));
		remoteConn.setLocalDescription(answer); 

		ws.send(JSON.stringify({ 
			channel: "screen",
			type: "answer", 
			answer: answer,
			sender: 'remote',
			name: myname,
			clientId: this.clientId,
		})); 
		
	}, function (error) { 
		console.log(JSON.stringify(error));
		alert("Error when creating an answer"); 
	}); 
}

//when we got an answer from a remote user
function wsHandleAnswer(answer, sender) { 
   //localConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function wsHandleCandidate(candidate, sender) { 
	console.log('wsHandleCandidate sender=> ' + sender);
	//if (sender === 'local') {
		//console.log("wsHandleCandidate ICE connection state: <Before> " + remoteConn.iceConnectionState); 
		remoteConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
			function() {
				//$(statsBox).append('<p style="font-weight: bold;">remoteConn AddIceCandidate success.</p>');
				console.log("remoteConn AddIceCandidate success.");
				//console.log("wsHandleCandidate ICE connection state: <After> " + remoteConn.iceConnectionState); 
			},
			function(error) {$(errorBox).append('<p>remoteConn Failed to add Ice Candidate:'+ error.toString() + '</p>');}
		);
	//}
};

function wsHandleLeave() {
	remoteVideo.srcObject = null; 

	remoteConn.close(); 
	remoteConn.onicecandidate = null; 
	remoteConn.onaddstream = null; 
	ws.close();
}

////////////////////////////////////////////////////

//* Media Section *//

var remoteMediaConn;

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
	 remoteMediaConn = new RTCPeerConnection(configuration); 

	 remoteMediaConn.onicecandidate = function (event) { 
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				channel: "media",
				type: "candidate", 
				candidate: event.candidate,
				sender: 'remote',
				name: myname,
				clientId: this.clientId
		   })); 
		} 
	 };

 	remoteMediaConn.oniceconnectionstatechange = function(event) {
		console.log('RemoteMedia ICE state change event: ', event);
		const peerConnection = event.target;
		//console.log('remoteMediaConn.iceConnectionState: ' + remoteMediaConn.iceConnectionState);
		const ref = peerConnection.iceConnectionState;
		if (ref!== "closed" && ref !== "failed" && ref !== "disconnected" && ref !== "completed") {
			remoteMediaConn = peerConnection;
		}

	};

	remoteMediaConn.ontrack = function(event) {
		remoteMediaStream = event.streams[0];
		//console.log('Remote MediaConn ontrack event: ', event);
		remoteMediaVideo.srcObject = remoteMediaStream;
		event.track.onended = e => remoteMediaVideo.srcObject = remoteMediaVideo.srcObject;
	};
}

function doStartShareMedia(){
	doInitMedia();
}

//when somebody sends us an offer 
function xsHandleOffer(offer, sender) {
	remoteMediaConn.setRemoteDescription(new RTCSessionDescription(offer));
	
	//create an answer to an offer 
	remoteMediaConn.createAnswer(function (answer) { 
		//console.log('Client\'s Answer with message' + JSON.stringify(answer));
		remoteMediaConn.setLocalDescription(answer); 
		ws.send(JSON.stringify({ 
			channel: "media",
			type: "answer", 
			answer: answer,
			sender: 'remote',
			name: myname,
			clientId: this.clientId,
		})); 
		
   }, function (error) { 
		console.log('Media Creaate Answer Error: ' + JSON.stringify(error));
   }); 
}

//when we got an answer from a remote user
function xsHandleAnswer(answer, sender) { 
	//console.log('The Answer from Remote: ' + JSON.stringify(answer));
   //remoteMediaConn.setLocalDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function xsHandleCandidate(candidate, sender) { 
	//console.log('xsHandleCandidate=> ' + JSON.stringify(candidate));
	console.log('xsHandleCandidate sender=> ' + sender);
	if (sender === 'local') {
		remoteMediaConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
			function() {
				//$(statsBox).append('<p style="font-weight: bold;">remoteConn AddIceCandidate success.</p>');
				console.log("remoteMediaConn AddIceCandidate success.");
				//console.log("xsHandleCandidate ICE connection state: <After> " + remoteConn.iceConnectionState); 
			},
			function(error) {$(errorBox).append('<p>remoteMediaConn Failed to add Ice Candidate:'+ error.toString() + '</p>');}
		);
	}
};

function xsHandleLeave(sender) {

	remoteMediaVideo.srcObject = null; 
	
	remoteMediaConn.close(); 
	remoteMediaConn.onicecandidate = null; 
	remoteMediaConn.onaddstream = null; 
	
	//ws.close();
}
