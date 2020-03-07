let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let moment = require('moment');

http.listen(3000, function(){
  console.log('listening on *:3000');
});

//serve client files
app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/chat.html');
});

io.on('connection', function(socket){
  console.log('User connected');

  socket.on('disconnect', function(){
    console.log('User disconnected');
  });

  socket.on('message', function(t){
    console.log('Message: ' + t);
    let msg = {
      user: 'test',
      text: t,
      time: moment().format("DD/MM/YYYY h:m A"),
    }
    io.emit('message', msg);
  });

});