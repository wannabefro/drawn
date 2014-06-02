var startButton, callButton, hangupButton, pc, video, localVideo, remoteVideo;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var server = {
  iceServers: [
    {url: "stun:stun.l.google.com:19302"}
  ]
}

var options = {
  optional: [
    {DtlsSrptKeyAgreement: true}
  ]
}

var constraints = {
  mandatory: {
    OfferToReceiveAudio: false,
    OfferToReceiveVideo: true
  }
};

$(function() {
  createPC();
  video = document.getElementById("video");
  localVideo = document.getElementById("local");
  remoteVideo = document.getElementById("remote");

  startButton = document.getElementById("startButton");
  callButton = document.getElementById("callButton");
  hangupButton = document.getElementById("hangupButton");
  startButton.disabled = false;
  callButton.disabled = true;
  hangupButton.disabled = true;
  startButton.onclick = start;
  callButton.onclick = call;
  hangupButton.onclick = hangup;
});

function trace(text) {
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

function error(e) {
  trace(e);
}

function createPC() {
  pc = new RTCPeerConnection(server, options);
  pc.onicecandidate = function (e) {
    if (!e.candidate) { return; }
    pc.onicecandidate = null;
    socket.on('video:iceCandidate', function(candidate) {
      pc.addIceCandidate(new IceCandidate(JSON.parse(candidate)));
    });
    socket.emit('video:iceCandidate', JSON.stringify(e.candidate));
  };
  pc.onaddstream = function(obj) {
    console.log('hello');
    remoteVideo.src = window.URL.createObjectURL(obj.stream);
    remoteVideo.play();
  };
}

function start() {
  getVideo();
  startButton.disabled = true;
  callButton.disabled = false;
}

function getVideo(offer) {
  getUserMedia({audio: false, video: true}, 
               function(stream) {
                 localVideo.src = URL.createObjectURL(stream);
                 localVideo.play();
                 pc.addStream(stream);
                 if (!!offer) {
                   acceptOffer(offer);
                 }
               },
               function(error) {
                 trace("getUserMedia error: ", error);
               });
}

function call() {
  makeOffer();
  callButton.disabled = true;
  hangupButton.disabled = false;
}

function hangup() {
  pc.close();
  localStream.stop();
  socket.emit('video:ended');
}


function makeOffer() {
  pc.createOffer(function(offer) {
    pc.setLocalDescription(new RTCSessionDescription(offer), function() {
      socket.emit('video:offer', JSON.stringify(offer));
    }, error);
  }, error, constraints);
};

socket.on('video:offer', function(offer) {
  var offer = JSON.parse(offer);
  getVideo(offer);
});

function acceptOffer(offer) {
  pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
    pc.createAnswer(function(answer) {
      pc.setLocalDescription(new RTCSessionDescription(answer), function() {
        socket.emit('video:answer', JSON.stringify(answer));
      });
    }, error);
  }, error, constraints);
};

socket.on('video:answer', function(answer) {
  var answer = JSON.parse(answer);
  pc.setRemoteDescription(new RTCSessionDescription(answer), function() { }, error);
});

socket.on('video:ended', function() {
  pc.close();
  localStream.stop();
});
