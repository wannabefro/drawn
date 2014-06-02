var startButton, callButton, hangupButton, pc, video, localVideo, remoteVideo;
$(function() {
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

function gotStream(stream) {
  pc = new RTCPeerConnection();
  video.style.display = "block";
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  callButton.disabled = false;
  pc.addStream(localStream);
}

function start() {
  startButton.disabled = true;
  getUserMedia({audio: true, video: true}, gotStream,
               function(error) {
                 trace("getUserMedia error: ", error);
               });
}

function call() {
  makeOffer();
}

function hangup() {
}

function error(e) {
  trace(e);
}

function makeOffer() {
  pc.createOffer(function(offer) {
    pc.setLocalDescription(new RTCSessionDescription(offer), function() {
      socket.emit('video:offer', JSON.stringify(offer));
    }, error);
  }, error);
};

socket.on('video:offer', function(offer) {
  pc = new RTCPeerConnection();
  var offer = JSON.parse(offer);
  pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
    pc.createAnswer(function(answer) {
      pc.setLocalDescription(new RTCSessionDescription(answer), function() {
        socket.emit('video:answer', JSON.stringify(answer));
      });
    }, error);
  }, error);
});

socket.on('video:answer', function(answer) {
  var answer = JSON.parse(answer);
  pc.setRemoteDescription(new RTCSessionDescription(answer), function() { }, error);
});
