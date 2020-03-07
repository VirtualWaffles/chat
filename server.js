//https://socket.io/docs/emit-cheatsheet/

"use strict";

let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let moment = require('moment');

let users = [];
let messages = [];

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
  let user = 'User' + Math.floor(Math.random() * 1001);
  socket.user = user;

  users.push(user);

  let data = {
    name: user,
    users: users,
    messages: {},
  }

  io.to(socket.id).emit('welcome', data);
  // socket.send('welcome', data);
  socket.broadcast.emit('user-join', user);

  socket.on('disconnect', function(){
    console.log('User "' + socket.user + '" disconnected'); 
    users = users.filter(u => u !== socket.user);
    io.emit('user-left', socket.user);
  });

  socket.on('message', function(msg){
    console.log('Message: ' + msg['text']);
    msg['time'] = moment().format("DD/MM/YYYY h:m A");
    io.emit('message', msg);
  });

  socket.on('nickname', function(names){
    console.log(names['old'] + ' wants to be ' + names['new']);
    if(users.includes(names['new']))
      io.to(socket.id).emit('name-taken', names);

  });

});