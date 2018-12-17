
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

let numroom = 1;//===============================================================================
    //--------------------------------------------------========================================
    //====================================わすれるな==============================================
    //===============================================================================
    //--------------------------------------------------========================================
    
let GameStartFlag = 0;
    

class GameObject {
  constructor(obj = {}) {
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
    this.px = 0;
    this.py = 0;
    // 加速度
    this.a = 12.0;
    //消しゴムとしての尊厳を守るためのFlag
    this.moveFlag = true;
    //質量
    this.m = 1;
    //進む向き
    this.move_angle;
    //与える速度
    this.F = 0;
    //自分のturn以外は動かないようにする
    this.turnFlag = false;
    //部屋番号
    this.roomNUM = numroom;

    this.x = Math.random() * (FWIDTH - this.width);
    this.y = Math.random() * (FHEIGHT - this.height);
    this.angle = Math.random() * 2 * Math.PI;
  }

  addF() {
    if(GameStartFlag === 1 && this.turnFlag === true){
      this.move_angle = this.angle;
      this.F = 200;
      this.v0 = 200.0;
      this.vx = this.v0 * Math.cos(this.move_angle);
      this.vy = this.v0 * Math.sin(this.move_angle);
    }
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



//速度計算と移動位置計算
function v_diff(player){
  player.v0 = player.v0 - player.a * dt;
  player.F -= 1;
  distance = player.v0 * dt - (player.a * dt * dt)/2;
  player.vx = distance * Math.cos(player.move_angle);
  player.vy = distance * Math.sin(player.move_angle);
}

function hit_judge(adderplayer){
  flag = false;
  Object.values(player_list).forEach((subplayer) => {
    if(flag === false){
      if(adderplayer === subplayer){
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
  player.v0 = adderFplayer.F * 0.7;
  adderFplayer.v0 = adderFplayer.F * 0.3;
  len = Math.sqrt(vx*vx + vy*vy);
  distance = 2 * radius - len;
  if(len>0){len =  1/len;}
  vx = vx * len;
  vy = vy * len;
  distance = distance/2;
  player.vx = vx * distance;
  player.vy = vy * distance;
  player.move_angle = Math.atan2(player.vy,player.vx);
  adderFplayer.vx =  vx * distance;
  adderFplayer.vy = vy * distance;
  adderFplayer.move_angle = Math.atan2(adderFplayer.vy,adderFplayer.vx) - Math.PI;
}


function out_judge(player){
  if(player.x <0 || player.x >1000 || player.y < 0 || player.y >1000){
    io.to(player.socketId).emit('dead',numroom);
    player.remove();
  }
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------MAIN()---------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

class Main_Game {
  constructor(){
    setInterval(() => {
      //console.log('a');
      Object.values(player_list).forEach((player) => {
        if(GameStartFlag === 1){
          const movement = player.movement;
          if (movement.left && player.moveFlag===false && player.turnFlag === true) {
            player.angle -= 0.1;
          }
          if (movement.right && player.moveFlag===false && player.turnFlag === true) {
            player.angle += 0.1;
          }
    
          if(player.v0 < 0 ){
            player.vx = 0;
            player.vy = 0;
          }
          
          //移動処理
          if(player.vx >0 || player.vy > 0 || player.vx < 0 || player.vy < 0){
            v_diff(player);
          }else{
            player.F = 100;
            player.v0 = 0;
            player.vx = 0;
            player.vy = 0;
            moveFlag = false;
          }
    
          player.move();
          //場外判定
          out_judge(player);
          //あたり判定
          hit_judge(player);
        
          if(Object.keys(player_list).length===1){
            Object.values(player_list).forEach((player) => {io.sockets.emit('winer',player,numroom)});
            GameStartFlag = 2;
          }
          
        }else if(GameStartFlag === 0){
          io.sockets.emit('now_menber',Object.keys(player_list).length,numroom)
        }
      });
      io.sockets.emit('state', player_list, color_list,numroom);
    }, 1000 / 30);//setInterval
  }

  Main_Game_Start(numroom,player_list){
    
    while(GameStartFlag != 2){
      Object.values(player_list).forEach((Nplayer) => {
        io.sockets.emit('Alert_turn',Nplayer,numroom);//現在誰のturnなのかをalert
        Nplayer.turnFlag = true;
        while(finish_turn(Nplayer)===true){
         //ここに書くのはNplayerの変化
        }//finish_turn
        Nplayer.turnFlag = false;
      });//alert turn
    }//endgame

    return GameStartFlag;

    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    function finish_turn(Nplayer){
      let flag = false;
      let Return_ans = true;
      if(Nplayer.v0 != 0){
        flag = true;
      }
      if(flag){
        if(Nplayer.v0 === 0){
          Return_ans = false;
        }
      }
      return Return_ans;
    }
  }
}



//------------------------------------------------------------------------------------------------------
//ここからsocket処理
//------------------------------------------------------------------------------------------------------

let room_list = [];
let player_list = {};
let color_list = {};

io.on('connection', onConnection);
function onConnection(socket) {
  //roomがなかった場合roomを作成し、socketを開放する。
  STARTOPENSOCKET(socket);
}


function STARTOPENSOCKET(socket){
  socket.on('createGame', function (numroom) {
    flag = true;
    for(let i=0;i<room_list.length;i++){
      if(room_list[i] === numroom){
        flag = false;
      }
    }
    if(flag){
      room_list.push(numroom);
      roomN = new Main_Game()
      console.log('connect succesfull room');
    }
  });
  socket.on('game-start', (config,numroom) => {
    console.log('get - start');
    let player = null;
    if(Object.keys(player_list).length < 3 && GameStartFlag === 0){
      player = new Player({
        socketId: socket.id,
        nickname: config.nickname,
      });
      player_list[player.id] = player;
      color_list[player.id] = CreateColor();
      console.log(Object.keys(player_list).length)
      if(Object.keys(player_list).length === 3){
        GameStartFlag = 1;
        io.sockets.emit('starting-game',numroom)
        if(roomN.Main_Game_Start(numroom,player_list,color_list)){
          delete roomN;
        }
      }
    }else{
      io.to(socket.id).emit('over_menber',numroom);
    }
  });

  socket.on('movement', function (movement,numroom) {
    if (!player || player.health === 0) { return; }
    player.movement = movement;
  });
}

function CreateColor() {
  let r = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  let g = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  let b = ('0' + Math.floor(Math.random() * 255).toString(16)).slice(-2);
  return '#' + r + g + b;
}




app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

server.listen(PORT, function () {
  console.log('host port 8888 => port 3000')
});
