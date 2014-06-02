var startButton, callButton, hangupButton, pc1, pc2, video, localVideo, remoteVideo;
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
  pc1 = new RTCPeerConnection();
  video.style.display = "block";
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  callButton.disabled = false;
  pc1.addStream(localStream);
}

function start() {
  startButton.disabled = true;
  getUserMedia({audio: true, video: true}, gotStream,
               function(error) {
                 trace("getUserMedia error: ", error);
               });
}

// Use sockets to call the second user, on acceptance send back pc2 and then establish connection between the 2
function call() {
  socket.emit('video:call', JSON.stringify(pc1));
}

function hangup() {
}

socket.on('video:callReceived', function(pc) {
  var pc = JSON.parse(pc);
  pc1 = pc;
  pc2 = new RTCPeerConnection();
  socket.emit('video:callAccepted', JSON.stringify(pc2));
});
