//main.js

/* Flow 1 : SDP */
/* STEP 1 => Offer peer */

var STUN = {
    url:'stun:stun.l.google.com:19302'
};

var TURN = {
    url: 'turn:homeo@turn.bistri.com:80',
    credential: 'homeo'
};

var iceServers = {
    iceServers: [STUN, TURN]
};

var socket = io.connect();
var peer;

function doStartShareLocalMedia() {
    //var peer = new RTCPeerConnection(iceServers);
    peer = new RTCPeerConnection(null);

    /* Final */
    
    peer.onaddstream = function (event) {
      vid2.srcObject = event.stream;
      remoteMediaStream = event.stream;
      console.log("New Stream");
      console.log(event.stream);
    };

    peer.onicecandidate = function (event) {
      console.log("New Candidate");
      console.log(event.candidate);
      socket.emit('candidate',event.candidate);
    };

  peer.addStream(localMediaStream);

  peer.createOffer(onSdpSuccess, onSdpError);

}

/* STEP 2 => Offer peer */
function doGetLocalMedia() {
    navigator.webkitGetUserMedia(
    {
      audio: true,
      video: {
        mandatory: {
          maxWidth: screen.width,
          maxHeight: screen.height,
          minFrameRate: 1,
          maxFrameRate: 25
        }
      }
    },
    gotStream, function(e){console.log("getUserMedia error: ", e);});
}

function doStopShareLocalMedia() {
	localMediaStream.getTracks()[0].stop();
	localMediaStream.getTracks()[1].stop();
}

function gotStream(stream){
  //If you want too see your own camera
  vid.srcObject = stream;
  localMediaStream = stream;

}

/* STEP 3 => Offer peer */

function onSdpSuccess(sdp) {
    console.log(sdp);
    peer.setLocalDescription(sdp);
    //I use socket.io for my signaling server
    socket.emit('offer',sdp);
}

function onSdpError(err) {
    console.log('sdp error => ' + err);
}
/* STEP 5 => Answer peer */

//Receive by a socket.io socket
//The callbacks are useless unless for tracking
socket.on('offer', function (sdp) {
    peer.setRemoteDescription(new RTCSessionDescription(sdp), onSdpSuccess, onSdpError);

    peer.createAnswer(function (sdp) {
        peer.setLocalDescription(sdp);
        socket.emit('answer',sdp);
    }, onSdpError);
});

/* STEP 7 => Offer peer */

socket.on('answer', function (sdp) {
  peer.setRemoteDescription(new RTCSessionDescription(sdp), function(){console.log("Remote Description Success")}, function(){console.log("Remote Description Error")});
});

/* Flow 2 : ICECandidate */
/* Both side */

socket.on('candidate', function (candidate) {
  console.log("New Remote Candidate");
  console.log(candidate);

  peer.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
  }));
});

