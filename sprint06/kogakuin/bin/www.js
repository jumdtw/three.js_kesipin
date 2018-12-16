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

const FWIDTH = 1000;
const FHEIGHT = 1000;
const PORT = 3000

const radius = 40;

//時間差分
const dt = 0.1;
//重力
const g = 0.98;
//動摩擦係数
const u = 0.8

class GameObject {
  contructor(obj = {}) {
    this.id = Math.floor(Math.random() * 1000000000);
    this.x = obj.x;
    this.y = obj.y;
    this.width = obj.width;
    this.height = obj.height;
    this.angle = obj.angle;
  }

  move(distance) {
    const oldX = this.x;
    const oldY = this.y;

    this.x += distance * Math.cos(this.angle);
    this.y += distance * Math.sin(this.angle);

    let collision = false;
    if (this.x < 0 || this.x + this.width >= FWIDTH || this.y < 0 || this.y + this.height >= FHEIGHT) {
      collision = true;
    }
    if (this.intersectWalls()) {
      collision = true;
    }
    if (collision) {
      this.x = oldX;
      this.y = oldY;
    }
    return !collision;
  }

  intersect(obj) {
    return (this.x <= obj.x + obj.width) &&
      (this.x + this.width >= obj.x) &&
      (this.y <= obj.y + obj.height) &&
      (this.y + this.height >= obj.y);
  }
  intersectWalls() {
    return Object.values(walls).some((wall) => {
      if (this.intersect(wall)) {
        return true;
      }
    });
  }
  toJSON() {
    return { id: this.id, x: this.x, y: this.y, width: this.width, height: this.height, angle: this.angle };
  }
};

//player class
class Player extends GameObject {
  constructor(obj = {}) {
    super(obj);
    //なぜか継承できないのでidを再度定義
    this.id = Math.floor(Math.random() * 1000000000);
    this.socketId = obj.socketId;
    this.nickname = obj.nickname;
    this.health = this.maxHealth = 10
    this.width = 40;
    this.height = 40;
    this.bullets = {};
    this.point = 0;
    this.movement = {};
    //速度ベクトル
    this.vx = 0;
    this.vy = 0;
    // 加速度
    this.a = 12.0;
    //消しゴムとしての尊厳を守るためのFlag
    this.moveFlag = false;
    //質量
    this.m = 1;

    do {
      this.x = Math.random() * (FWIDTH - this.width);
      this.y = Math.random() * (FHEIGHT - this.height);
      this.angle = Math.random() * 2 * Math.PI;
    } while (this.intersectWalls() && this.x >= 40 && this.y >= 40);
  }

  addF() {
    this.v0 = 100.0;
  }

  remove() {
    delete player_list[this.id];
  }

  toJSON() {
    return Object.assign(super.toJSON(), { health: this.health, maxHealth: this.maxHealth, socketId: this.socketId, point: this.point, nickname: this.nickname });
  }

  move() {
      this.x = this.x + this.vx;
      this.y = this.y + this.vy;
  }
};



class Wall extends GameObject {
};

let player_list = {};
let walls = {};
let color_list = {};

for (let i = 0; i < 3; i++) {
  const wall = new Wall({
    x: Math.random() * FWIDTH,
    y: Math.random() * FHEIGHT,
    width: 200,
    height: 50,
  });
  walls[wall.id] = wall;
}


io.on('connection', onConnection);

function onConnection(socket) {
  console.log('connect succesfull')
  let player = null;
  socket.on('game-start', (config) => {
    player = new Player({
      socketId: socket.id,
      nickname: config.nickname,
    });
    player_list[player.id] = player;
    color_list[player.id] = CreateColor();
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

setInterval(() => {//-----------------------------------------------------------------------------------------------------------------------------------
  Object.values(player_list).forEach((player) => {
    const movement = player.movement;
    if (movement.left && player.moveFlag===false) {
      player.angle -= 0.1;
    }
    if (movement.right && player.moveFlag===false) {
      player.angle += 0.1;
    }
    //移動処理
    if(player.vx > 0 || player.vy >0 || player.v0 > 0){
      v_diff(player);
    }else{
      player.v0 = 0;
      player.vx = 0;
      player.vy = 0;
      player.moveFlag = false;
    }
    player.move();
    //場外判定
    out_judge(player);
    //あたり判定
    hit_judge(player);
  
  });//--------------------------------------------------------------------------------------------------------------------------------------------------------

  io.sockets.emit('state', player_list, color_list);

}, 1000 / 30);


function CreateColor() {
  let r = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  let g = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  let b = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  return '#' + r + g + b;
}

//速度計算と移動位置計算
function v_diff(player){
  player.v0 = player.v0 - player.a *dt;
  distance = player.v0 * dt - (player.a * dt * dt)/2;
  player.vx = distance * Math.cos(player.angle);
  player.vy = distance * Math.sin(player.angle);
}

function hit_judge(adderplayer){
  flag = false;
  Object.values(player_list).forEach((subplayer) => {
    if(flag === false){
      if(adderplayer.id===subplayer.id){
        flag=true;
        return;
      }else{
        return;
      }
    }
    if(flag){
      R = radius + radius;
      r1 = Math.pow((adderplayer.x-subplayer.x),2)+Math.pow(adderplayer.y-subplayer.y,2);
      if((R*R) > r1){
        change_move_info(subplayer,adderplayer);
      }
    }
  });
}


function change_move_info(player,adderFplayer){
  vx = (player.x - adderFplayer.x);
  vy = (player.y - adderFplayer.y);
  len = Math.sqrt(vx*vx + vy*vy);
  distance = 2 * R - len;
  if(len>0) len =  1/len;
  distance = distance/2;
  player.vx = vx * distance;
  adderFplayer.vx = vx * distance;
  player.vy = vy * distance;
  adderFplayer.vy = vy * distance;
}


function out_judge(player){
  if(player.x <0 || player.x >1000 || player.y < 0 || player.y >1000){
    io.sockets.emit('dead', player.socketId);
    player.remove();
  }
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('kogkauin/public/index.html');
});

server.listen(PORT, function () {
  console.log('host port 8888 => port 3000')
});
