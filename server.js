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

//serve client files on connection
app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/chat.html');
});


io.on('connection', function(socket){
  let cookies = socket.handshake.headers['cookie'];
  let user = parse_username(cookies);
  if(!user)
    user = new_username();

  if(users.findIndex(x => x === user) > -1)
    user = new_username();

  socket.user = user;
  users.push(user);

  let data = {
    name: user,
    color: '000000',
    users: users,
    messages: messages,
  }

  io.to(socket.id).emit('welcome', data);
  socket.broadcast.emit('user-join', user);


  socket.on('disconnect', function(){
    console.log('User "' + socket.user + '" disconnected'); 
    users = users.filter(u => u !== socket.user);
    io.emit('user-left', socket.user);
  });

  socket.on('message', function(msg){
    console.log('Message: ' + msg['text']);
    msg['time'] = moment().format("DD/MM/YYYY h:m A");
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('nickname', function(names){
    console.log(names['old'] + ' wants to be ' + names['new']);
    if(users.includes(names['new']))
      io.to(socket.id).emit('name-taken');
    else{
      socket.user = names['new'];
      users = users.filter(u => u !== names['old']);
      users.push(names['new']);
      io.emit('name-change', names);
    }
  });

  socket.on('nickcolor', function(user){
    if(!is_valid_color(user['color']))
      io.to(socket.id).emit('bad-color');
    else
      io.emit('color-change', user);
    
  });


  function parse_username(cookies){
    let name;
    let i = cookies.search('username=');
    if(i > 0){
      name = cookies.slice(i+9);
      i = name.search(';');
      if(i > 0)
        name = name.substring(0, i)    
    }
    console.log("Parsed name: " + name);
    return name
  }

  function new_username(){
    let name;
    do{
      name = 'user' + Math.floor(Math.random() * 1001);
    }while(users.includes[name]);
    console.log("Generated name: " + name);
    return name;
  }

    //checks if text is a valid hex color
    function is_valid_color(text){
      //https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation/8027444
      console.log('Testing color ' + text);
      return(/^[0-9A-F]{6}$/i.test(text));
    };

});