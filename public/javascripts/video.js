var currentID, hangupButton, pc, video, localVideo, remoteVideo, caller;
var server = {
  iceServers: [
    {url: "stun:stun.l.google.com:19302"},
    {url: "turn:numb.viagenie.ca", credential: "drawn", username: "sam.mctaggart+webrtc@gmail.com"}
  ]
}

var options = {
  optional: [
    {DtlsSrptKeyAgreement: true}
  ]
}

var constraints = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  }
};

$(function() {
  createPC();
  video = document.getElementById("video");
  localVideo = document.getElementById("local");
  remoteVideo = document.getElementById("remote");
  users = document.getElementById("users");

  users.onclick = videoCall;

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
      trace(candiate);
      pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
    });
    socket.emit('video:iceCandidate', JSON.stringify(e.candidate));
  };
  pc.onaddstream = function(obj) {
    remoteVideo.src = window.URL.createObjectURL(obj.stream);
  };
}

function getVideo(id, offer) {
  getUserMedia({audio: true, video: true}, 
               function(stream) {
                 video.style.display = 'block';
                 $('#video').append('<button id="hangup">Hang Up</button>').on('click', hangup);
                 localStream = stream;
                 localVideo.src = URL.createObjectURL(stream);
                 pc.addStream(stream);
                 connect(id, offer);
               },
               function(error) {
                 trace("getUserMedia error: ", error);
               });
}

function videoCall(e) {
  var id = e.target.innerHTML;
  getVideo(id);
}

function connect(id, offer) {
  caller = id;
  if (!!offer && !!id) {
    acceptOffer(offer, id);
  } else if (!!id) {
    makeOffer(id);
  }
}

function hangup() {
  socket.emit('video:ended', {to: caller});
  reset();
}

function reset() {
  caller = null;
  localStream.stop();
  $('#hangup').remove();
  video.style.display = 'none';
}

function makeOffer(id) {
  pc.createOffer(function(offer) {
    pc.setLocalDescription(new RTCSessionDescription(offer), function() {
      socket.emit('video:offer', {offer: JSON.stringify(offer), from: currentID, to: id});
    }, error);
  }, error, constraints);
};

socket.on('video:offer', function(offer, id) {
  var offer = JSON.parse(offer);
  getVideo(id, offer);
});

function acceptOffer(offer, id) {
  pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
    pc.createAnswer(function(answer) {
      pc.setLocalDescription(new RTCSessionDescription(answer), function() {
        socket.emit('video:answer', {answer: JSON.stringify(answer), to: id, from: currentID});
      });
    }, error);
  }, error, constraints);
};

socket.on('video:answer', function(answer) {
  var answer = JSON.parse(answer);
  pc.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('video:ended', function() {
  reset();
});

socket.on('room:users', function(clients, id) {
  currentID = id;
});
