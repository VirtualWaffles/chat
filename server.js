/*
Author: Jesse Shewfelt
UUID:   30066463
LAB:    3

Updated:  07/03/20

Resources:
//https://socket.io/docs/emit-cheatsheet/
*/
"use strict";

const PORT_NUMBER = 3000;

let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let moment = require('moment');

let users = [];
let messages = [];

http.listen(PORT_NUMBER, function(){
  console.log('listening on *:' + PORT_NUMBER);
});


//serve client files on connection
app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/chat.html');
});


io.on('connection', function(socket){

  //handle user connecting
  welcome();

  //handle user disconnecting
  socket.on('disconnect', function(){
    console.log('User "' + socket.user + '" disconnected'); 
    users = users.filter(u => u !== socket.user);
    io.emit('user-left', socket.user);
  });

  //shares sent messages across connected clients
  socket.on('message', function(msg){
    console.log('Message: ' + msg['text']);
    msg['time'] = moment().format("DD/MM/YYYY h:m A");
    messages.push(msg);
    io.emit('message', msg);
  });

  //share changed nicknames across connected clients
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

  //shares changed colors across connected clients
  socket.on('nickcolor', function(user){
    if(!is_valid_color(user['color']))
      io.to(socket.id).emit('bad-color');
    else{

      io.emit('color-change', user);    
    }
  });


  function welcome(){
    //parse cookies for an unused username
    //otherwise generate the user a new username
    let cookies = socket.handshake.headers['cookie'];
    let user = get_username(cookies);
    let color = get_color(cookies);
    
    socket.user = user;
    users.push(user);
  
    let data = {
      name: user,
      color: color,
      users: users,
      messages: messages,
    }
  
    io.to(socket.id).emit('welcome', data);
    socket.broadcast.emit('user-join', user);
  }

  //get a username from the cookies or generate a new one
  function get_username(cookies){
    let name;
    let i = cookies.search('username=');
    if(i > 0){
      name = cookies.slice(i+9);
      i = name.search(';');
      if(i > 0)
        name = name.substring(0, i);
    }
    
    if(!name || (users.findIndex(x => x === name) > -1))
      name = new_username();

    return name;
  }

  function new_username(){
    let name;
    do{
      name = 'user' + Math.floor(Math.random() * 1001);
    }while(users.includes[name]);
    return name;
  }

  //get a color from the cookies or return the default
  function get_color(cookies){
    let color;
    let i = cookies.search('color=');
    if(i > 0){
      color = cookies.slice(i+6);
      i = color.search(';');
      if(i > 0)
        color = color.substring(0, i);
    }
    if(!color || !is_valid_color(color))
      color = '000000';
    
    return color;
  }

  //checks if text is a valid hex color
  function is_valid_color(text){
    //https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation/8027444
    return(/^[0-9A-F]{6}$/i.test(text));
  };

});