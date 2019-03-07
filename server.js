var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/index.html'); 
});

app.set('port', (process.env.PORT || 5000));
http.listen(app.get('port'), function(){
  console.log('listening on port',app.get('port'));
});

var players = {};
var bullet_array = [];
io.on('connection', function(socket){

	socket.on('new-player',function(state){
		console.log("New player joined with state:",state);
		players[socket.id] = state;
	
		io.emit('update-players',players);
	})
  

  socket.on('disconnect',function(state){
    delete players[socket.id];
    io.emit('update-players',players);
  }) 
  

  socket.on('move-player',function(position_data){
    if(players[socket.id] == undefined) return;
    players[socket.id].x = position_data.x;  
    players[socket.id].y = position_data.y; 
    players[socket.id].angle = position_data.angle; 
    io.emit('update-players',players);
  })
  
  
  socket.on('shoot-bullet',function(data){
    if(players[socket.id] == undefined) return;
    var new_bullet = data;
    data.owner_id = socket.id; 
    if(Math.abs(data.speed_x) > 20 || Math.abs(data.speed_y) > 20){
      console.log("Player",socket.id,"is cheating!");
    }
    bullet_array.push(new_bullet);
  });
})


function ServerGameLoop(){
  for(var i=0;i<bullet_array.length;i++){
    var bullet = bullet_array[i];
    bullet.x += bullet.speed_x; 
    bullet.y += bullet.speed_y; 
    
    
    for(var id in players){
      if(bullet.owner_id != id){
        
        var dx = players[id].x - bullet.x; 
        var dy = players[id].y - bullet.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < 70){
          io.emit('player-hit',id); 
        }
      }
    }
    
    
    if(bullet.x < -10 || bullet.x > 1000 || bullet.y < -10 || bullet.y > 1000){
        bullet_array.splice(i,1);
        i--;
    }
        
  }
  
  io.emit("bullets-update",bullet_array);
}

setInterval(ServerGameLoop, 16); 
