var PORT = 8008;

var options = {};

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

var io = require('socket.io').listen(server, options);
server.listen(PORT);

app.use(express.static(__dirname + '/static'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');

require('./routes.js')(app, io);
require('./chat.js')(app, io);

console.log('server starter on port ' + PORT);
