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
    this.a = 12.0;
    this.distance = 0;
    this.moveFlag = 0;
    this.m = 1;
    //自身が進む最終的な方向
    this.move_angle = 0;

    do {
      this.x = Math.random() * (FWIDTH - this.width);
      this.y = Math.random() * (FHEIGHT - this.height);
      this.angle = Math.random() * 2 * Math.PI;
    } while (this.intersectWalls() && this.x >= 40 && this.y >= 40);
  }

  addF() {
    this.v0 = 100.0;
    this.move_angle = this.angle;
  }

  remove() {
    delete player_list[this.id];
  }

  toJSON() {
    return Object.assign(super.toJSON(), { health: this.health, maxHealth: this.maxHealth, socketId: this.socketId, point: this.point, nickname: this.nickname });
  }

  move() {
      this.x = this.x + this.distance * Math.cos(this.move_angle);
      this.y = this.y + this.distance * Math.sin(this.move_angle);
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
    if(player.v0!=0){
      shoot_move(player);
    }else{
      player.moveFlag = false;
    }
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

function shoot_move(player){
  player.v = player.v0 - player.a * dt;
  if(player.v >= 0){
    player.distance = player.v0 * dt - (player.a * dt*dt)/2;
    player.v0 = player.v
    player.move();
  } else {
    player.v = 0;
    player.v0 = 0;
    player.distance = 0
  }
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
      if((R*R)>=r1){
        change_move_info(subplayer,adderplayer);
      }
    }
  });
}


function change_move_info(player,adderFplayer){
  //当てた方の消しゴムの向いている方向ベクトル円上のx,yを計算する。
  player_circle_on_x = adderFplayer.x + radius * Math.cos(adderFplayer.move_angle); 
  player_circle_on_y = adderFplayer.y + radius * Math.sin(adderFplayer.move_angle); 
  //当たった方向との差分の角度
  //diffangle = Math.atan2(player.y-player_circle_on_y,player.x-player_circle_on_x);
  diffangle = Math.atan2(player_circle_on_y - player.y,player_circle_on_x - player.x);
  //当たった方向の反対ベクトル
  hit_point_return = adderFplayer.move_angle+(diffangle) + Math.PI;
  //change player.v0 and adderFplayer--------------------------------------------------------------------
  energy = (adderFplayer.v * adderFplayer.v *adderFplayer.m)/2
  afterV = (Math.sqrt(energy))/2
  //console.log(afterV);
  player.v0 = 50;//afterV;
  adderFplayer.v0 = 50;//afterV;
  //random rad-------------------------------------------------------------------------------------------
  randrad = Math.floor(Math.random()*((Math.PI/2)-Math.PI/6)+Math.PI/6);
  /*
  counter = 0;
  adderflag = false;
  playerflag = false;
  player_angle_diff = 0;
  adderFplayer_angle_diff = 0;
  while(after_move_check(player,adderFplayer,diffangle,adderFplayer_angle_diff,player_angle_diff)===true){
    //counter += 0.1;
    adderFplayer_angle_diff -= 0.01;
    player_angle_diff += 0.01;
    console.log('a');
    
    if(counter <= Math.PI || adderflag === true){
      adderFplayer_angle_diff += 0.1;
    }else if(counter <= Math.PI || playerflag === true){
      adderFplayer_angle_diff = 0;
      playerflag = true;
      player_angle_diff += 0.1;
    }else{
      if(c)
      adderFplayer.move_angle -= 0.01;
      player.move_angle += 0.01;
    }
  }
  */
  //change player.move_angle and adderFplayer.move_angle
  player.move_angle = adderFplayer.move_angle+diffangle;
  adderFplayer.move_angle = ((adderFplayer.move_angle - (hit_point_return))/2);//adderFplayer.move_angle - diffangle;
}

function after_move_check(player,adderFplayer,diffangle,adderFplayer_angle_diff,player_angle_diff){
  Flag = false;
  //それぞれの移動後のx,y座標を計算し、重なっていないか確認する。
  adderFplayer_x_after = adderFplayer.x + adderFplayer.distance * Math.cos(adderFplayer.move_angle - diffangle - adderFplayer_angle_diff);
  adderFplayer_y_after = adderFplayer.y + adderFplayer.distance * Math.sin(adderFplayer.move_angle - diffangle - adderFplayer_angle_diff);
  player_x_after = player.x + player.distance * Math.cos(adderFplayer.move_angle+diffangle+player_angle_diff);
  player_y_after = player.y + player.distance * Math.sin(adderFplayer.move_angle+diffangle+player_angle_diff);
  R = 2 * radius;
  //2点間の差
  diff_x = adderFplayer_x_after - player_x_after;
  diff_y = adderFplayer_y_after - player_y_after;
  diff_point = Math.pow(diff_x,2)+Math.pow(diff_y,2);
  if((R*R) >= diff_point){
    Flag = true;
  }
  return Flag;
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
