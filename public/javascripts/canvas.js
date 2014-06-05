var path;
var paths = {};
var room = document.URL.split('/').pop();
socket.emit('room', room);
var currentUID = new Date().getTime();
var strokeColor = 'black';
var strokeWidth = 20;
var strokeCap = 'round';
var previousSettings = {
  strokeColor: '',
  strokeWidth: '',
  strokeCap: ''
}

onMouseDown = function(event) {
  path = new Path();
  path.strokeColor = strokeColor;
  path.strokeWidth = strokeWidth;
  path.strokeCap = strokeCap;
  path.add(event.point);
  socket.emit('draw:started', currentUID, {x: event.point.x, y: event.point.y});
}

onMouseDrag = function(event) {
  path.add(event.point);
  socket.emit('draw:progress', currentUID, {x: event.point.x, y: event.point.y});
}

onMouseUp = function(event) {
  path.smooth();
  socket.emit('draw:done', currentUID);
}

function backupPathSettings() {
  previousSettings.strokeColor = strokeColor;
  previousSettings.strokeWidth = strokeWidth;
  previousSettings.strokeCap = strokeCap;
}

function restorePathSettings() {
  strokeColor = previousSettings.strokeColor;
  strokeWidth = previousSettings.strokeWidth;
  strokeCap = previousSettings.strokeCap;
}

$('button#erase').on('click', function() {
  backupPathSettings();
  strokeColor = 'white';
});

$('button#draw').on('click', function() {
  restorePathSettings();
});

$('input#width').on('change', function(e) {
  strokeWidth = e.target.value;
});

$('input#color').on('change', function(e) {
  strokeColor = e.target.value;
});

socket.on('draw:started', function(uid, event) {
  if ( currentUID !== uid && event ) {
    paths[uid] = new Path();
    path = paths[uid];
    var point = new Point(event.x, event.y)

    path.strokeColor = 'black';
    path.strokeWidth = 20;
    path.strokeCap = 'round';
    path.add(point);
  }
});

socket.on('draw:progress', function(uid, event) {
  if ( currentUID !== uid && event ) {
    path = paths[uid];
    var point = new Point(event.x, event.y)
    path.add(point);
    path.smooth();
    paper.view.update();
  }
});

socket.on('draw:done', function(uid) {
  if ( currentUID !== uid ) {
    paths[uid].smooth();
    paths[uid] = null;
  }
});

socket.on('draw:canvasExport', function(data) {
  paper.project.importJSON(data);
});

socket.on('draw:joined', function(id) {
  var data = paper.project.exportJSON();
  socket.emit('draw:canvasExport', id, data);
});

socket.on('draw:canvasImport', function(data) {
  paper.project.importJSON(data);
  paper.view.update();
});

socket.on('draw:load', function(data) {
  paper.project.importJSON(data);
  paper.view.update();
});

socket.on('room:users', function(clients, id) {
  var users = $('#users');
  clients.forEach(function(client) {
    users.append('<p>' + client + '</p>');
  });
});

socket.on('room:left', function(id) {
  $('p:contains("' + id + '")').remove();
});

socket.on('room:joined', function(id) {
  $('body').prepend('<p class="notice">A new artist has joined</p>');
  setTimeout(function() {
    $('.notice').remove();
  }, 2000);
  $('#users').append('<p>' + id + '</p>');
});

window.onbeforeunload = function() {
  var data = paper.project.exportJSON();
  socket.emit('draw:save', data, room);
}
