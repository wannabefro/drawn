process.env.PWD = process.cwd();
var express = require('express');
var expressLayouts = require('express-ejs-layouts');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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

var clients = [];
var lastConnected;
io.on('connection', function(socket) {
  clients.push(socket);
  lastConnected = socket.id;
  if ( clients.length > 1 ) {
    socket.to(clients[0].id).emit('draw:joined', socket.id);
  }
  socket.on('draw:started', function(uid, event) {
    io.sockets.emit('draw:started', uid, event);
  });
  socket.on('draw:progress', function(uid, event) {
    io.sockets.emit('draw:progress', uid, event);
  });
  socket.on('draw:done', function(uid) {
    io.sockets.emit('draw:done', uid);
  });
  socket.on('draw:canvasExport', function(id, data) {
    setTimeout(function() {
      socket.to(id).emit('draw:canvasImport', data);
    }, 100);
  });
  socket.on('video:offer', function(offer) {
    socket.broadcast.emit('video:offer', offer);
  });
  socket.on('video:answer', function(answer) {
    socket.broadcast.emit('video:answer', answer);
  });
  socket.on('disconnect', function() {
    var i = clients.indexOf(socket);
    clients.splice(i, 1);
  });
});


http.listen(app.get('port'), function() {
  console.log('hello world');
});
