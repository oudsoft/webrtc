//share.js

function doGetScreenSignal() {
    this.disabled = true;

    invokeGetDisplayMedia(function(screen) {
        addStreamStopListener(screen, function() {
            location.reload();
        });
		
		localStream = screen;        
        
		localvideo.srcObject = screen;

		if (isInitiator) {
			maybeStart();
		}

        var _capabilities = screen.getTracks()[0].getCapabilities();
        $(capabilities).val('capabilities:\n\n' + JSON.stringify(_capabilities, null, '\t'));
        $(capabilities).css({display: 'block'});

        var _settings = screen.getTracks()[0].getSettings();
        $(settings).val('settings:\n\n' + JSON.stringify(_settings, null, '\t'));
        $(settings).css({display: 'block'});
    }, function(e) {
        //button.disabled = false;

        var error = {
            name: e.name || 'UnKnown',
            message: e.message || 'UnKnown',
            stack: e.stack || 'UnKnown'
        };

        if(error.name === 'PermissionDeniedError') {
            if(location.protocol !== 'https:') {
                error.message = 'Please use HTTPs.';
                error.stack   = 'HTTPs is required.';
            }
        }

        console.error(error.name);
        console.error(error.message);
        console.error(error.stack);

        alert('Unable to capture your screen.\n\n' + error.name + '\n\n' + error.message + '\n\n' + error.stack);
    });
}

function invokeGetDisplayMedia(success, error) {
    var videoConstraints = {};

    if(aspectRatio.value !== 'default') {
        videoConstraints.aspectRatio = aspectRatio.value;
    }

    if(frameRate.value !== 'default') {
        videoConstraints.frameRate = frameRate.value;
    }

    if(cursor.value !== 'default') {
        videoConstraints.cursor = cursor.value;
    }

    if(displaySurface.value !== 'default') {
        videoConstraints.displaySurface = displaySurface.value;
    }

    if(logicalSurface.value !== 'default') {
        videoConstraints.logicalSurface = true;
    }

    if(resolutions.value !== 'default') {
        if (resolutions.value === 'fit-screen') {
            videoConstraints.width = screen.width;
            videoConstraints.height = screen.height;
        }

        if (resolutions.value === '4K') {
            videoConstraints.width = 3840;
            videoConstraints.height = 2160;
        }

        if (resolutions.value === '1080p') {
            videoConstraints.width = 1920;
            videoConstraints.height = 1080;
        }

        if (resolutions.value === '720p') {
            videoConstraints.width = 1280;
            videoConstraints.height = 720;
        }

        if (resolutions.value === '480p') {
            videoConstraints.width = 853;
            videoConstraints.height = 480;
        }

        if (resolutions.value === '360p') {
            videoConstraints.width = 640;
            videoConstraints.height = 360;
        }

        /*
        videoConstraints.width = {
            exact: videoConstraints.width
        };

        videoConstraints.height = {
            exact: videoConstraints.height
        };
        */
    }

    if(!Object.keys(videoConstraints).length) {
        videoConstraints = true;
    }

    var displayMediaStreamConstraints = {
        video: videoConstraints
    };

    if(navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
    }
    else {
        navigator.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
    }
}

function addStreamStopListener(stream, callback) {
    stream.addEventListener('ended', function() {
        callback();
        callback = function() {};
    }, false);
    stream.addEventListener('inactive', function() {
        callback();
        callback = function() {};
    }, false);
    stream.getTracks().forEach(function(track) {
        track.addEventListener('ended', function() {
            callback();
            callback = function() {};
        }, false);
        track.addEventListener('inactive', function() {
            callback();
            callback = function() {};
        }, false);
    });
}


///////////////////////////////////////////////////////////////////////////////////////
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var pc;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////
/*
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}
*/

var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  //if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  //}
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
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

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
