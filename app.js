
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , app = express()
  , server = http.createServer(app)
  , socketio = require('socket.io');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/new', routes.newRoom);
app.get('/r/:id', routes.admin);
app.get('/c/:id', routes.client);

io = socketio.listen(server);

routes.setUpSocketIO(io);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
