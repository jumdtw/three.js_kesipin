//https://paiza.hatenablog.com/entry/paizacloud_online_multiplayer_game
//http://marupeke296.com/
//

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
    //自分で押した時
    this.v0 = 0;
    this.v = 0;
    this.t = 0;
    this.a = 12.0;
    this.old_dis = 0;
    this.distance = 0;
    this.spaceFlag = 0;
    this.m = 1;

    //自身が進む最終的な方法
    this.move_angle = 0;

    do {
      this.x = Math.random() * (FWIDTH - this.width);
      this.y = Math.random() * (FHEIGHT - this.height);
      this.angle = Math.random() * 2 * Math.PI;
    } while (this.intersectWalls() && this.x >= 40 && this.y >= 40);
  }

  addF() {
    this.v0 = 150.0;
    this.t = 0;
    this.old_dis = 0;
    this.add_point_x = this.x;
    this.add_point_y = this.y;
    this.move_angle = this.angle;
  }

  remove() {
    delete player_list[this.id];
    io.to(this.socketId).emit('dead');
  }

  toJSON() {
    return Object.assign(super.toJSON(), { health: this.health, maxHealth: this.maxHealth, socketId: this.socketId, point: this.point, nickname: this.nickname });
  }

  move(distance) {
      this.x = this.add_point_x + distance * Math.cos(this.move_angle);
      this.y = this.add_point_y + distance * Math.sin(this.move_angle);
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
    player.addF();
  });

  socket.on('disconnect', () => {
    if (!player) { return; }
    delete player_list[player.id];
    player = null
  });

}

setInterval(() => {
  
  Object.values(player_list).forEach((player) => {
    const movement = player.movement;

    if (movement.left) {
      player.angle -= 0.1;
    }
    if (movement.right) {
      player.angle += 0.1;
    }

    //移動処理
    if(player.v0!=0){
      shoot_move(player);
    }
    //場外判定

    //あたり判定
    hit_judge(player);
  
  });

  io.sockets.emit('state', player_list, color_list);

}, 1000 / 30);


function CreateColor() {
  let r = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  let g = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  let b = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  return '#' + r + g + b;
}

function shoot_move(player){
  player.t += dt;
  player.v = player.v0 - player.a * player.t;
  //if(player.distance - player.old_dis >=0)
  if(player.v >= 0){
    player.distance = player.v0 * player.t - (player.a * player.t * player.t)/2;
    player.move(player.distance,0);
  } else {
    player.v = 0;
    player.v0 = 0;
    player.t = 0;
    player.distance = 0
  }
}

function hit_judge(player){
  flag = 0;
  Object.values(player_list).forEach((subplayer) => {
    if(player.id===subplayer.id){flag=1;return;}
    if(flag){
      R = radius + radius;
      r1 = Math.sqrt(Math.pow((player.x-subplayer.x),2)+Math.pow(player.y-subplayer.y,2));
      if(R>=r1){
        change_move_info(subplayer,player);
      }
    }
  });
}

function energy_diff(player){
}

function change_move_info(player,adderFplayer){
  player.add_point_x = player.x;
  player.add_point_y = player.y;
  adderFplayer.add_point_x = adderFplayer.x
  adderFplayer.add_point_y = adderFplayer.y
  //当たった方向との差分の角度
  diffangle = Math.atan2(player.y-adderFplayer.y,player.x-adderFplayer.y)
  //当たった方向の反対ベクトル
  hit_point_return = adderFplayer.move_angle+(diffangle) - Math.PI;
  //change player.v0 and adderFplayer
  player.v0 = 100;//adderFplayer.move_angle * Math.cos(diffangle);
  adderFplayer.v0 = 100;
  //change player.move_angle and adderFplayer.move_angle
  player.move_angle = adderFplayer.move_angle+(diffangle);
  adderFplayer.move_angle = hit_point_return;//hit_point_return + ((adderFplayer.move_angle - (hit_point_return))/2);
}


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

server.listen(PORT, function () {
  console.log('host port 8888 => port 3000')
});
