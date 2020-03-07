//https://socket.io/docs/emit-cheatsheet/

"use strict";

let express = require('express');
let app = express();
let cookieParser = require('cookie-parser'); 
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let moment = require('moment');

let users = [];
let messages = [];

http.listen(3000, function(){
  console.log('listening on *:3000');
});

//serve client files on connection
app.use(cookieParser());
app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res){
  // console.log('Request recieved');

  // let cookies = req.cookies;
  // if(!cookies['username']){
  //   let user = new_username();
  //   console.log('No username found. Assigning name "' + user + '"');
  //   res.cookie('username', user, {'maxAge' : 1000 * 60 * 1});//valid for 1 minute
  // }
  // else{
  //   console.log('Username found. Assigning name "' + cookies['username'] + '"');
  // }
  
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
      io.to(socket.id).emit('name-taken', names);
    else{
      users = users.filter(u => u !== names['old']);
      users.push(names['new'])
      io.emit('name-change', names);
    }
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

});