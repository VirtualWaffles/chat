"use strict";

$(document).ready(function(){
    console.log("Script loaded");
    let socket = io(); //Initialize client
    let username;
    let color = '000000';

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
        is_valid_color(text.slice(11)) ? color = text.slice(11) : err('color');

      //change name
      else if(text.startsWith("/nick"))
        socket.emit('nickname', {old: username, new: text.slice(6)})

      //invalid command
      else if(TextTrack.startsWith("/"))
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
      username = data['name'];
      console.log('welcome ' + username);
      document.cookie = 'username=' + username + '; max-age=' + 60*60*24 + ';';
      $('#m').attr('placeholder', 'Enter your message ' + username);
      for(const user of data['users'])
        add_user(user);
      for(const message of data['messages'])
        add_message(message);
    });



    //add users when they join
    socket.on('user-join', function(user){
      console.log('user "' + user + '" joined');
      add_user(user);
    });



    //remove users when they leave
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
        document.cookie = 'username=' + username + '; max-age=' + 60*60*24 + ';';
      }
        
      for(const user of $('.user')){
        if($(user).text() === names['old']){
          $(user).text(names['new']);
          break;
        }
      }      
    });

    
    //alert user when name is taken
    socket.on('name-taken', function(names){
      err('name');
    });


    function add_user(name){
      let li = $('<li class="list-group-item text-center"></li>');
      let usr = $('<label class="user">' + name + '</label>');
      if(name === username)
        usr.css('font-weight', 'bold');
      li.append(usr);
      $('#users').append(li);       
    };

    function add_message(message){
      let li = $('<li class="list-group-item"></li>');
      let usr = $('<label class="username" style="color: #' + message['color'] + ';">' + message['user'] + '</label>');
      if(message['user'] === username)
        usr.css('font-weight', 'bold');
      let tim = $('<label class="timestamp">' + message['time'] + '</label>');
      let txt = $('<p class="message">' + message['text'] + '</p>');
      
      li.append(usr);
      li.append(tim);
      li.append(txt);

      $('#messages').append(li);
      $('#messages').scrollTop($('#messages').prop("scrollHeight"));
    };


    //checks if text is a valid hex color
    function is_valid_color(text){
      //https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation/8027444
      console.log('Testing color ' + text);
      return(/^[0-9A-F]{6}$/i.test(text));
    };


    //displays error messages to the user
    function err(type){
      let err_message = {
        user: 'Alert',
        color: 'ee5502',
        time: 'Only you can view this message',
      }
      if(type === 'color')
        err_message['text'] = "Invalid color selection. Format should be /nickcolor RRGGBB."
      else if(type === 'name')
        err_message['text'] = "Invalid name choice. That name is already taken."
      else if(type === 'command')
        err_message['text'] = "Invalid command. Valid commands are /nick and /nickcolor"
      else
        err_message['text'] = "An unknown error occured."
      add_message(err_message);
    };
    

});
