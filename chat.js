let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/chat.html');
});

io.on('connection', function(socket){
  console.log('User connected');

  socket.on('disconnect', function(){
    console.log('User disconnected');
  });

  socket.in('message', function(msg){
    console.log('Message: ' + msg);
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});