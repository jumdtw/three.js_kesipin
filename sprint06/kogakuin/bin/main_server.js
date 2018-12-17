//https://paiza.hatenablog.com/entry/paizacloud_online_multiplayer_game
//http://marupeke296.com/
//https://hakuhin.jp/as/collide.html

const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express()
const server = http.Server(app);
const io = socketIO(server);

const PORT = 3000

io.on('connection', onConnection);

function onConnection(socket) {
  console.log('connect succesfull')
  let player = null;
  socket.on('game-start', (config) => {

    if(Object.keys(player_list).length < 3){
      player = new Player({
        socketId: socket.id,
        nickname: config.nickname,
      });
      player_list[player.id] = player;
      color_list[player.id] = CreateColor();
    }else{
      io.sockets.emit('over_menber',socket.id);
    }
  });

  socket.on('movement', function (movement) {
    if (!player || player.health === 0) { return; }
    player.movement = movement;
  });

  socket.on('shoot', function () {
    if (!player || player.health === 0) { return; }
    if(player.moveFlag==false){
      player.moveFlag = true;
      player.addF();
    }
  });

  socket.on('disconnect', () => {
    if (!player) { return; }
    delete player_list[player.id];
    player = null
  });

}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('game.html');
});

server.listen(PORT, function () {
  console.log('host port 8888 => port 3000')
});
