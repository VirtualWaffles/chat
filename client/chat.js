/*
Author: Jesse Shewfelt
UCID:   30066463
LAB:    3

Updated:  07/03/20
*/
"use strict";

$(document).ready(function(){
    console.log("Script loaded");
    let socket = io(); //Initialize client
    let username;
    let color;

    //on form submitted or button clicked event handler
    $('form').submit(function(e){
      console.log('message entered');
      e.preventDefault(); //Prevents page reloading
      let text = $('#m').val();

      //ignore empty input
      if(!text)
        return false;

      //change color
      else if(text.startsWith("/nickcolor"))
        socket.emit('nickcolor', {name: username, color: text.slice(11)});

      //change name
      else if(text.startsWith("/nick"))
        socket.emit('nickname', {old: username, new: text.slice(6)});

      //invalid command
      else if(text.startsWith("/"))
          err('command');
      
      //send message
      else
        socket.emit('message', {user: username, text: text, color: color});
      
      //clear message box
      $('#m').val('');        
      return false;
    });
    

    //'chat message' event listener.
    socket.on('message', function(msg){
      console.log('message received')
      add_message(msg);
    });
    
    //when a client joins update their log of users and messages and
    //give them a username
    socket.on('welcome', function(data){
      //set user info
      username = data['name'];
      color = data['color'];
      $('#m').attr('placeholder', 'Enter your message ' + username);
      
      //update cookie with user info
      document.cookie = 'username=' + username + '; max-age=' + 60*60*24 + ';';
      document.cookie = 'color=' + color + '; max-age=' + 60*60*24 + ';';
      
      //load in users and message backlog
      for(const user in data['users']){
        add_user(user, data['users'][user]);
      }
      for(const message of data['messages'])
        add_message(message);
    });


    //add users to the list when they join
    socket.on('user-join', function(user){
      add_user(user['name'], user['color']);
    });


    //remove users from the list when they leave
    socket.on('user-left', function(name){
      console.log('user "' + name + '" left');
      for(const user of $('.user')){
        if($(user).text() === name){
          $(user).parent().remove();
          break;
        }
      }
    });


    //edit the online users list when a name is changed
    socket.on('name-change', function(names){
      //if my name was changed
      if(names['old'] === username){
        username = names['new'];
        $('#m').attr('placeholder', 'Enter your message ' + username);
        document.cookie = 'username=' + username + '; max-age=' + 60*60*24 + ';';
      }
        
      for(const user of $('.user')){
        if($(user).text() === names['old']){
          $(user).text(names['new']);
          break;
        }
      }      
    });


    //edit the online users list when a color is changed
    socket.on('color-change', function(data){
      if(data['name'] === username){
        color = data['color'];
        document.cookie = 'color=' + color + '; max-age=' + 60*60*24 + ';';
      }

      console.log('Setting color of "' + data['name'] + ' to ' + data['color']);
      for(const user of $('.user')){
        if($(user).text() === data['name']){
          $(user).css('color', ('#' + data['color']));
          break;
        }
      }            
    });

    
    //alert user when name is taken
    socket.on('name-taken', function(){
      err('name');
    });

    //alert user when invalid color is input
    socket.on('bad-color', function(){
      err('color');
    });

    function add_user(name, color){
      let li = $('<li class="list-group-item user-item text-center"></li>');
      let usr = $('<label class="user">' + name + '</label>');
      usr.css('color', ('#' + color));
      if(name === username)
        usr.css({'font-weight':'bold', 'font-style':'italic'});
      li.append(usr);
      $('#users').append(li);       
    };

    function add_message(message){
      let li = $('<li class="list-group-item"></li>');
      let usr = $('<label class="username" style="color: #' + message['color'] + ';">' + message['user'] + '</label>');
      if(message['user'] === username)
        usr.css({'font-weight':'bold', 'font-style':'italic'});
      let tim = $('<label class="timestamp">' + message['time'] + '</label>');
      let txt = $('<p class="message">' + message['text'] + '</p>');
      
      li.append(usr);
      li.append(tim);
      li.append(txt);

      $('#messages').append(li);
      $('#messages').scrollTop($('#messages').prop("scrollHeight"));
    };

    //displays error messages to the user
    function err(type, data){
      let err_message = {
        user: 'Alert',
        color: 'ee5502',
        time: 'Only you can view this message',
      }
      if(type === 'color')
        err_message['text'] = 'Color format should be /nickcolor RRGGBB.'
      else if(type === 'name')
        err_message['text'] = 'The name "' + data + '" is already taken.'
      else if(type === 'command')
        err_message['text'] = 'Invalid command. Valid commands are /nick and /nickcolor'
      else
        err_message['text'] = 'An unknown error occured.'
      add_message(err_message);
    };
    

});
