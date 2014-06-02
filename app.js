process.env.PWD = process.cwd();
var express = require('express');
var expressLayouts = require('express-ejs-layouts');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongopath = (process.env.mongo || 'mongodb://localhost/drawn')
var Canvas = require('./models/canvas');
mongoose.connect(mongopath);

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('port', process.env.PORT || 3000);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('node-compass')({mode: 'expanded'}));
app.use(express.static(path.join(process.env.PWD, 'public'), { maxAge: 86400000 }));
app.use(expressLayouts);

app.use('/', routes);
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var http = require('http').Server(app);
var io = require('socket.io')(http);

var clients = {};
io.on('connection', function(socket) {
  socket.on('room', function(room) {
    socket.join(room);
    clients[room] = clients[room] || [];
    clients[room].push(socket.id);
    if ( clients[room].length > 1 ) {
      socket.to(clients[room][0]).emit('draw:joined', socket.id);
    } else {
      var canvas = Canvas.findById(room, function(err, canvas){
        io.in(room).emit('draw:load', canvas.data);
      });
    }
  });
  socket.on('draw:started', function(uid, event) {
    var room = socket.rooms[1];
    io.in(room).emit('draw:started', uid, event);
  });
  socket.on('draw:progress', function(uid, event) {
    var room = socket.rooms[1];
    io.in(room).emit('draw:progress', uid, event);
  });
  socket.on('draw:done', function(uid) {
    var room = socket.rooms[1];
    io.in(room).emit('draw:done', uid);
  });
  socket.on('draw:canvasExport', function(id, data) {
    setTimeout(function() {
      socket.to(id).emit('draw:canvasImport', data);
    }, 100);
  });
  socket.on('draw:save', function(data, room) {
    Canvas.findByIdAndUpdate(room, {data: data}, function(err, success){
      console.log(err);
    });
  });
  socket.on('video:offer', function(offer) {
    socket.broadcast.emit('video:offer', offer);
  });
  socket.on('video:answer', function(answer) {
    socket.broadcast.emit('video:answer', answer);
  });
  socket.on('video:ended', function(answer) {
    socket.broadcast.emit('video:ended');
  });
  socket.on('video:iceCandidate', function(candidate) {
    socket.broadcast.emit('video:iceCandidate', candidate);
  });
  socket.on('disconnect', function() {
    try {
      var room = socket.rooms[1];
      var i = clients[room].indexOf(socket.id);
      clients[room].splice(i, 1);
    }
    catch(e) {
    }
  });
});


http.listen(app.get('port'), function() {
  console.log('hello world');
});
