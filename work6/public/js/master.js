//master.js
const myname = 'master';
const roomname = 'socket';

const hostname = window.location.hostname;
var ws = null;

function doConnect() {
	ws = new WebSocket('wss://' + hostname + ':4433/' + roomname + '?type=' + myname);
	ws.onopen = function () {
		console.log('Websocket is connected to the signaling server')
	}

	ws.onmessage = function (msg) {
		//console.log("WS Got message", msg.data);
		if ((msg.data !== '') && (msg.data !== 'Hello world')) {
			var data = JSON.parse(msg.data); 
			$(statsBox).append('<p>' + JSON.stringify(data) + '</p>');
			if (data.type !== 'newclient')	{
				switch(data.channel) { 
					case "screen":
						switch(data.type) { 
							//when somebody wants to call us 
							case "offer": 
								wsHandleOffer(data.offer, data.sender); 
							break; 
							case "answer": 
								wsHandleAnswer(data.answer, data.sender, data.clientId); 
							break; 
							//when a remote peer sends an ice candidate to us 
							case "candidate": 
								wsHandleCandidate(data.candidate, data.sender, data.clientId); 
							break; 
							case "start": 
								wsHandleStart(data.start, data.sender, data.clientId); 
							break; 
							case "leave": 
								wsHandleLeave(data.sender, data.clientId); 
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
								xsHandleAnswer(data.answer, data.sender, data.clientId); 
							break; 
							//when a remote peer sends an ice candidate to us 
							case "candidate": 
								xsHandleCandidate(data.candidate, data.sender, data.clientId); 
							break; 
							case "start": 
								xsHandleStart(data.start, data.sender, data.clientId); 
							break; 
							case "leave": 
								xsHandleLeave(data.sender, data.clientId); 
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
						default: 
							break; 
						}
					break;
					default: 
					break; 
				}
			} else {
				//newclient - connect
				$(statsBox).append('<p>You have new client id: ' + data.clientId + '<b>[' + data.clientNo + ']</b> connected</p>');
				/* Step 1, 2, 3 */
				// create an offer 
				doInitStream(data.clientId);
				doInitMedia(data.clientId);
			}
		}
	}

	ws.onerror = function (err) { 
	   console.log("WS Got error", err); 
	}

	doReadyGetStream();
}

 const configuration = { 
	"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }, {'url': 'stun:stun.services.mozilla.com'}]
 }; 

const offerOptions = {
	offerToReceiveVideo: 1,
	offerToReceiveAudio: 1
};

//var localConn; 
var localPeers = [];
//var localMediaConn; 
var localMediaPeers = [];

//* Screen Section *//

function doInitStream(clientId) {
	if (this.clientId !== clientId) {
		
		let localConn = new RTCPeerConnection(configuration); 
			
		// Setup ice handling 
		localConn.onicecandidate = function (event) { 
			if (event.candidate) { 
			   ws.send(JSON.stringify({ 
					channel: "screen",
					type: "candidate", 
					candidate: event.candidate,
					sender: 'local',
					name: myname,
					clientId: clientId					
			   })); 
			} 
		};
		 
		localConn.oniceconnectionstatechange = function(event) {
			const peerConnection = event.target;
			console.log('ICE state change event: ', event);
			localConn = peerConnection;
		};

		localStream.getTracks().forEach(track => localConn.addTrack(track, localStream));

		localPeers.push({localConn: localConn, clientId: clientId});
	}
}

//initiating a call 
function doStartShareScreen() {
	
	//doInitStream();

	/* Step 1, 2, 3 */
	// create an offer 

	for (let i=0; i<localPeers.length; i++){
		delay(2000).then(function() {
			let localConn = localPeers[i].localConn;
			let peerId = localPeers[i].clientId;
			//if (clientId !== peerId )	{
				localConn.createOffer(function (offer) { 
					localConn.setLocalDescription(offer); 
					ws.send(JSON.stringify({ 
						channel: "screen",
						type: "offer", 
						offer: offer ,
						sender: 'local',
						name: myname,
						clientId: peerId
					})); 

				}, function (error) { 
					alert("WSError when creating an offer"); 
				});
			//}
		});
	}
}

function doStopShareScreen() {
	localStream.getTracks()[0].stop();
	localStream.getTracks()[1].stop();

   	ws.send(JSON.stringify({
		channel: "screen",
		type: "leave",
		sender: 'local',
		name: myname,
		clientId: this.clientId,
   	}));  

	doInitSystem();
}

//when somebody sends us an offer 
function wsHandleOffer(offer, sender) {
	/* Step 4, 5, 6, 7 */ 
	/* These steps will be show detail on client side. */
}

//when we got an answer from a remote user
function wsHandleAnswer(answer, sender, clientId) { 
	/* Step 8 */
	if ((sender === 'remote')){
		getLocalConnById(clientId).then(function(localConn) {
			if (localConn){
				localConn.setRemoteDescription(new RTCSessionDescription(answer)).then(
					function() {$(statsBox).append('<p  style="font-weight: bold;">localConn setRemoteDescription success.</p>'); wsHandChecked = true;},
					function(error) {$(errorBox).append('<p>localConn Failed to setRemoteDescription:' + error.toString() + '</p>');}
				);
		  }
		});
	}
};
  
//when we got an ice candidate from a remote user 
function wsHandleCandidate(candidate, sender, AClientId) { 
	//console.log('xsHandleCandidate=> ' + JSON.stringify(candidate));
	console.log('this.clientId=> ' + this.clientId);
	console.log('clientId=> ' + clientId);
	console.log('sender=> ' + sender);
	if (sender === 'remote') {
		console.log('All localPeers=> ' + JSON.stringify(localPeers));
		getLocalConnById(AClientId).then(function(localConn) {
			if (localConn){			
				console.log('localConn Found=> ' + JSON.stringify(localConn));
				localConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
					function() {$(statsBox).append('<p style="font-weight: bold;">localConn AddIceCandidate success.</p>');},
					function(error) {$(errorBox).append('<p>localConn Failed to add Ice Candidate:'+ error.toString() + '</p>');}
				);
			}
		});
	}
};

function wsHandleStart(start, sender, clientId) {
	if (sender==='remote') {
		doStartShareScreen();
	}
}

function wsHandleLeave(sender, clientId) {
	localVideo.srcObject = null; 
	
	localConn.close(); 
	localConn.onicecandidate = null; 
	localConn.onaddstream = null; 
	
	ws.close();
}

function getLocalConnById(clientId) {
	return new Promise(function(resolve, reject) {
		//console.log('clientId:=> ' + clientId);
		//console.log('All Local Peers:=> ' + JSON.stringify(localPeers));
		var result = localPeers.filter(function(item, inx) {
			if(clientId === item.clientId){return (item); }
		});
		//console.log('The Result:=> ' + JSON.stringify(result));
		if (result.length > 0){
			resolve(result[0].localConn);
		}else {
			resolve(null);
		}
	});
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
	doReadyShareMedia();
}

function doStopShareMedia() {
	localMediaStream.getTracks()[0].stop();
	localMediaStream.getTracks()[1].stop();

   	ws.send(JSON.stringify({
			channel: "media",
			type: "leave",
			sender: 'local',
			name: myname,
			clientId: this.clientId
   	}));  

	doInitSystem();
}

function doInitMedia(clientId) {
	if (this.clientId !== clientId) {		
		let localMediaConn = new RTCPeerConnection(configuration); 
			
		 // Setup ice handling 
		localMediaConn.onicecandidate = function (event) { 
			if (event.candidate) { 
			  ws.send(JSON.stringify({ 
					channel: "media",
					type: "candidate", 
					candidate: event.candidate,
					sender: 'local',
					name: myname,
					clientId: this.clientId
			  })); 
			} 
		};
		 
		localMediaConn.oniceconnectionstatechange = function(event) {
			const peerConnection = event.target;
			console.log('Local ICE state change event: ', event);
			console.log('localMediaConn.iceConnectionState: ' + localMediaConn.iceConnectionState);
			localMediaConn = peerConnection;
		 };

		localMediaStream.getTracks().forEach(track => localMediaConn.addTrack(track, localMediaStream));

		localMediaPeers.push({localMediaConn: localMediaConn, clientId: clientId});
	}
}

function doStartShareMedia(){
	
	//doInitMedia();
	/* Step 1, 2, 3 */
	// create an offer 
	for (let i=0; i<localMediaPeers.length; i++){
		delay(2000).then(function() {
			let localMediaConn = localMediaPeers[i].localMediaConn;
			let peerId = localPeers[i].clientId;
			//if (clientId !== peerId )	{
				localMediaConn.createOffer(function (offer) { 
					localMediaConn.setLocalDescription(offer); 
					ws.send(JSON.stringify({ 
						channel: "media",
						type: "offer", 
						offer: offer,
						sender: 'local',
						name: myname,
						clientId: peerId
					})); 

				}, function (error) { 
					alert("XSError when creating an offer"); 
				});
			//}
		});
	}
}

//when somebody sends us an offer 
function xsHandleOffer(offer, sender) {
	/* Step 4, 5, 6, 7 */ 
	/* These steps will be show detail on client side. */
}

//when we got an answer from a remote user
/* Step 8 */
function xsHandleAnswer(answer, sender, clientId) { 
	if ((sender === 'remote')){
		getLocalMediaConnById(clientId).then(function(localMediaConn) {
			if (localMediaConn) {
				localMediaConn.setRemoteDescription(new RTCSessionDescription(answer)).then(
					function() {$(statsBox).append('<p>localMediaConn setRemoteDescription success.</p>'); xsHandChecked = true;},
					function(error) {$(errorBox).append('<p>localMediaConn Failed to setRemoteDescription:' + error.toString() + '</p>');}
				);
		  }
		});
	}
};
  
//when we got an ice candidate from a remote user 
function xsHandleCandidate(candidate, sender, clientId) { 
	console.log('this.clientId=> ' + this.clientId);
	console.log('clientId=> ' + clientId);
	console.log('sender=> ' + sender);
	//if (sender === 'local') {
		console.log('All localPeers=> ' + JSON.stringify(localMediaPeers));
		getLocalMediaConnById(clientId).then(function(localMediaConn) {	
			if (localMediaConn) {			
				console.log('localConn Found=> ' + JSON.stringify(localMediaConn));
				localMediaConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
					function() {$(statsBox).append('<p>localMediaConn AddIceCandidate success.</p>');},
					function(error) {$(errorBox).append('<p>localMediaConn Failed to add Ice Candidate:'+ error.toString() + '</p>');}
				);
			}
		});
	//}
};

function xsHandleStart(start, sender, clientId) {
	if (sender==='remote') {
		doStartShareMedia();
	}
}

function xsHandleLeave(sender, clientId) {
	localMediaVideo.srcObject = null; 
	
	localMediaConn.close(); 
	localMediaConn.onicecandidate = null; 
	localMediaConn.onaddstream = null; 

	ws.close();
}

function getLocalMediaConnById(clientId) {
	return new Promise(function(resolve, reject) {
		var result = localMediaPeers.filter(function(item, inx) {
			if(clientId === item.clientId){return (item); }
		});
		//console.log('The Result:=> ' + JSON.stringify(result));
		if (result.length > 0){
			resolve(result[0].localMediaConn);
		}else {
			resolve(null);
		}
	});
}

///////////////////////////////////////////////////////

function doTest() {
	//socket.emit('message', {message: 'test'});

	ws.send(JSON.stringify({ 
		channel: "media",
		type: "test", 
		name: myname,
		sender: 'local',
		test: {test: 'test', channel: 'media', name: myname, id: ws.id} 
	})); 
	
}

function doCheckRemoteMediaConnState(){
//window.setInterval(function() {
	/*
	if (remoteMediaConn){

		remoteMediaConn.getStats(null).then(stats => {
		let statsOutput = "";

		stats.forEach(report => {
		  statsOutput += `<h2>Report: ${report.type}</h3>\n<strong>ID:</strong> ${report.id}<br>\n` +
						 `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
		  
		  // Now the statistics for this report; we intentially drop the ones we
		  // sorted to the top above

		  Object.keys(report).forEach(statName => {
			if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
			  statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
			}
		  });
		});

		document.querySelector(".stats-box").innerHTML = statsOutput;
		});
	} */
//}, 1000);
}
