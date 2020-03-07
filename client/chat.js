$(document).ready(function(){
    console.log("Script loaded");
    let socket = io(); //Initialize client
    
    //on form submitted or button clicked event handler
    $('form').submit(function(e){
      console.log('message entered');

      e.preventDefault(); //Prevents page reloading
      socket.emit('message', $('#m').val()); //Send message to server by sending the message as an event.
      $('#m').val(''); //Clear message box
      return false;
    });
    
    //'chat message' event listener.
    socket.on('message', function(msg){
      console.log('message received')
      
      let li = $('<li class="list-group-item"></li>');
      let usr = $('<label class="username">' + msg['user'] + '</label>');
      let tim = $('<label class="timestamp">' + msg['time'] + '</label>');
      let txt = $('<p class="message">' + msg['text'] + '</p>');
      
      li.append(usr);
      li.append(tim);
      li.append(txt);

      $('#messages').append(li);
      $('#messages').scrollTop($('#messages').prop("scrollHeight"));
    });
});