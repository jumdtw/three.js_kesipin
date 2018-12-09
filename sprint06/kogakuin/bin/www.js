//https://paiza.hatenablog.com/entry/paizacloud_online_multiplayer_game


const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express()
const server = http.Server(app);
const io = socketIO(server);

const FWIDTH = 1000;
const FHEIGHT = 1000;
const PORT = 3000

class GameObject{
  contructor(obj={}){
    this.id = Math.floor(Math.random()*1000000000);
    this.x = obj.x;
    this.y = obj.y;
    this.width = obj.width;
    this.height = obj.height;
    this.angle = obj.angle;
  }
  move(distance){
    const oldX = this.x;
    const oldY = this.y;

    this.x += distance * Math.cos(this.angle);
    this.y += distance * Math.sin(this.angle);

    let collision = false;
    if(this.x < 0 ||this.x + this.width >= FWIDTH || this.y<0 || this.y + this.height >= FHEIGHT){
      collision = true;
    }
    if(this.intersectWalls()){
      collision = true;
    }
    if(collision){
      this.x = oldX;
      this.y = oldY;
    }
    return !collision;
  }

  intersect(obj){
    return (this.x <=obj.x + obj.width)&&
            (this.x + this.width >= obj.x) &&
            (this.y <= obj.y + obj.height) &&
            (this.y + this.height >= obj.y);
  }
  intersectWalls(){
    return Object.values(walls).some((wall) =>{
      if(this.intersect(wall)){
        return true;
      }
    });
  }
  toJSON(){
    return {id: this.id, x: this.x, y: this.y, width: this.width, height: this.height, angle: this.angle};
  }
};

//player class
class Player extends GameObject{
  constructor(obj = {}){
    super(obj);
    this.socketId = obj.socketId;
    this.nickname = obj.nickname;
    this.health = this.maxHealth = 10
    this.width = 80;
    this.height = 80;
    this.bullets = {};
    this.point = 0;
    this.movement = {};

    do{
      this.x = Math.random() * (FWIDTH - this.width);
      this.y = Math.random() * (FHEIGHT - this.height);
      this.angle = Math.random() * 2 * Math.PI;
    }while(this.intersectWalls());
    
  }

  shoot(){
    if(Object.keys(this.bullets).length >= 3){
      return;
    }
    const bullet = new Bullet({
      x: this.x + this.width/2,
      y: this.y + this.height/2,
      angle: this.angle,
      player: this,
    });
    bullet.move(this.width/2);
    this.bullets[bullet.id] = bullet;
    bullets[bullet.id] = bullet
  }
  damage(){
    this.health --;
    if(this.health ===0){
      this.remove();
    }
  }
  remove(){
    delete players[this.id];
    io.to(this.socketId).emit('dead');
  }
  toJSON(){
    return Object.assign(super.toJSON(), {health: this.health, maxHealth: this.maxHealth, socketId: this.socketId, point: this.point, nickname: this.nickname});
  }

  //move(distance){
    //this.x += distance * Math.cos(this.angle);
    //this.y += distance * Math.sin(this.angle);
  //}
};

class Bullet extends GameObject{
  constructor(obj){
    super(obj);
    this.width = 15;
    this.height = 15;
    this.player = obj.player;
  }
  remove(){
    delete this.player.bullets[this.id];
    delete bullets[this.id];
  }
};

class BotPlayer extends Player{
  constructor(obj){
      super(obj);
      this.timer = setInterval(() => {
          if(! this.move(4)){
              this.angle = Math.random() * Math.PI * 2;
          }
          if(Math.random()<0.03){
              this.shoot();
          }
      }, 1000/30);
  }
  remove(){
      super.remove();
      clearInterval(this.timer);
      setTimeout(() => {
          const bot = new BotPlayer({nickname: this.nickname});
          players[bot.id] = bot;
      }, 3000);
  }
};

class Wall extends GameObject{
};

let player_list = {};
let bullets = {};
let walls = {};

for (let i=0;i<3;i++){
  const wall = new Wall({
    x: Math.random() * FWIDTH,
    y: Math.random() * FHEIGHT,
    width: 200,
    height: 50,
  });
  walls[wall.id] = wall;
}

const bot = new BotPlayer({nickname: 'bot'});
player_list[bot.id] = bot;

io.on('connection',onConnection);

function onConnection(socket){
  //initialize list
  console.log('succesfull')
  let player = null;

  socket.on('game-start',(config) =>{
    player = new Player({
      socketId: socket.id,
      nickname: config.nickname,
    });
    player_list[player.id] = player;
  });

  socket.on('movement',function(movement){
    if(!player||player.health===0){return;}
    console.log(movement);
    player.movement = movement;
  });

  socket.on('shoot',function(){
    console.log('shoot');
    if(!player || player.health===0){return;}
    player.shoot();
  });

  socket.on('disconnect',()=>{
    if(!player){return;}
    delete player_list[player.id];
    player = null
  });

}

setInterval(function() {
  Object.values(player_list).forEach((player)=>{
    const movement = player.movement;
    if(movement.forward){
      player.move(5);
      console.log('UP');
    }
    if(movement.back){
      player.move(-5);
      console.log('DOWN');
    }
    if(movement.left){
      player.angle -= -0.1;
      console.log('LEFT');
    }
    if(movement.right){
      player.angle += 0.1;
      console.log('RIGHT');
    }
  });

  Object.values(bullets).forEach((bullet) => {
    if(!bullet.move(10)){
      bullet.remove();
      return;
    }
    Object.values(player_list).forEach((player)=>{
      if(bullet.intersect(player)){
        if(player !==bullet.player){
          player.damage();
          bullet.remove();
          bullet.player.point += 1;
        }
      }
    });
    Object.values(walls).forEach((wall) =>{
      if(bullet.intersect(wall)){
        bullet.remove();
      }
    });
  });
  io.sockets.emit('state',player_list);
},1000/30);


app.use(express.static('public'));

app.get('/',(req,res) => {
  res.sendFile(path.join(__dirname,'/public/index.html'));
});

server.listen(PORT,function() {
  console.log('host port 8888 => port 3000')
});
