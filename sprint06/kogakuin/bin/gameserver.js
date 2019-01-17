
const express = require('express');
const http = require('http');
const path = require('path');
const CANNON = require('cannon');
const socketIO = require('socket.io');
const app = express()
const server = http.Server(app);
const io = socketIO(server);

const FWIDTH = 1000;
const FHEIGHT = 1000;
const PORT = 3000

var TIME_STEP = 1 / 30;

const TABLE_HIEGHT = 70;

//時間差分
const dt = 0.1;

//反発係数
const e = 0.2;

var room_list = [];
var playing_room = [false,false,false,false,false,false];


class GameObject {
  constructor(obj = {}) {
    this.id = Math.floor(Math.random() * 1000000000);
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
    this.rigidBody = createShape(0,30+TABLE_HIEGHT,0,1,0.7,2,10);
    this.angle = Math.PI/2;
    this.movement = {};
    /*
    this.health = this.maxHealth = 10
    this.width = 40;
    this.height = 40;
    this.bullets = {};
    this.point = 0;
    
    //速度ベクトル
    this.vx = 0;
    this.vy = 0;
    this.px = 0;
    this.py = 0;
    // 加速度
    this.a = 12.0;
    //消しゴムとしての尊厳を守るためのFlag
    this.moveFlag = false;
    //質量
    this.m = 1;
    //進む向き
    this.move_angle;
    //与える速度
    this.v0 = 0;
    //自分のturn以外は動かないようにする
    this.turnFlag = false;
    this.moveFlag = false;
    //部屋番号
    this.roomNUM;


    this.x = Math.random() * (FWIDTH - this.width);
    this.y = Math.random() * (FHEIGHT - this.height);
    this.angle = Math.random() * 2 * Math.PI;
    */
  }

  addF() {
    if(this.moveFlag === false){
      
    }
  }

  remove(player_list) {
    delete player_list[this.id];
    return player_list;
  }

  toJSON() {
    return Object.assign(super.toJSON(), { health: this.health, maxHealth: this.maxHealth, socketId: this.socketId, point: this.point, nickname: this.nickname });
  }

};


//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------MAIN()---------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

class Main_Game {
  constructor(Numroom){
    this.player_list = {};
    this.rigid_list = {};
    this.numroom = Numroom;
    this.GameStartFlag = 0;
    this.table = createTable();
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase(); //ぶつかっている可能性のあるオブジェクト同士を見つける
    this.world.solver.iterations = 10; //反復計算回数
    this.world.solver.tolerance = 0.1; //許容範囲
    this.world.add(initGround());
    this.world.add(this.table);
   
    
    setInterval(()=>{
      this.world.step(TIME_STEP);
      Object.values(this.player_list).forEach((player) => {
        if(this.GameStartFlag === 1){
          const movement = player.movement;
          if (movement.left) {
            player.angle -= 0.05;
          }
          if (movement.right) {
            player.angle += 0.05;
          }

          if(Object.keys(this.player_list).length===1){
            Object.values(this.player_list).forEach((player) => {io.sockets.emit('winer',player,this.numroom)});
            this.GameStartFlag = 2;
          } 
          io.sockets.emit('state', this.rigid_list,this.numroom);
        }else if(this.GameStartFlag === 0){
          io.sockets.emit('now_menber',Object.keys(this.player_list).length,this.numroom)
        }
      });
    }, 1000 / 30);//setInterval

  }

  

  out_judge(player,Numroom,player_list){
    if(player.x <0 || player.x >1000 || player.y < 0 || player.y >1000){
      io.to(player.socketId).emit('dead',Numroom);
      player.remove(player_list);
    }
    return player_list;
  }

  set_rigid_list(){
    Object.values(this.player_list).forEach((player) => {
      this.rigid_list[player.id] = {};
      this.rigid_list[player.id].id = player.id;
      this.rigid_list[player.id].position = this.player_list[player.id].rigidBody.position;
      this.rigid_list[player.id].quaternion = this.player_list[player.id].rigidBody.quaternion;
    });
  }

  Main_Game_Start(Numroom){
    /*
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
    */
    //return GameStartFlag;

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

// ground
function initGround() {
  //地面の生成 質量0
  //var groundShape = new CANNON.Plane(new CANNON.Vec3(50, 5, 50));
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({mass: 0});
  groundBody.addShape(groundShape);

  //地面をx軸に対して90度回転
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  groundBody.castShadow = true;
  return groundBody;
}

function createTable(){
  var shape, table_material,table;
  let w = 25;
  let h = 1;
  let d = 25;

  //table マテリアル
  table_material = new CANNON.Material('table_material');
  table_material.friction = 0.07;　//摩擦係数
  //table_material.restitution = 0.2; //反発係数
  // initialize rigid body
  //公式ドキュメントにもhalfelementsって書いてあるので幅　高さ　奥行きの半分を与える。多分物理演算のために半分になってる
  shape = new CANNON.Box(new CANNON.Vec3(w, h, d));
  table = new CANNON.Body({mass: 0});
  table.material = table_material;
  table.addShape(shape);
  table.position.x = 0;
  table.position.y = TABLE_HIEGHT;
  table.position.z = 0;
  return table;
}

//------------------------------------------------------------------------------------------------------
//ここからsocket処理
//------------------------------------------------------------------------------------------------------

io.on('connection', onConnection);
function onConnection(socket) {
  //roomがなかった場合roomを作成し、socketを開放する。
  socket.on('createGame', function (Numroom) {
    let flag = true;
    for(let i=0;i<room_list.length;i++){
      if(room_list[i] === Numroom){
        flag = false;
      }
    }
    if(flag){
      room_list.push(Numroom);
      roomN = new Main_Game(Numroom); 
      console.log('connect succesfull room');
    }
  });

  socket.on('game-start', function(config,Numroom) {
    if(roomN.numroom === Numroom && roomN.GameStartFlag===0){
      if(Object.keys(roomN.player_list).length < 3){
        player = new Player({
          socketId: socket.id,
          nickname: config.nickname,
        });
        roomN.player_list[player.id] = player;
        roomN.world.add(player.rigidBody);
        io.sockets.emit('yourID',player.id,Numroom);
        if(Object.keys(roomN.player_list).length === 3){
          playing_room[Numroom] = true;
          io.sockets.emit('addPlayer',roomN.player_list,Numroom);
          roomN.GameStartFlag = 1;
          roomN.set_rigid_list();
          io.sockets.emit('starting-game',Numroom);
          //main game start
          //roomN.Main_Game_Start(Numroom);
        }
      }else{
        io.to(socket.id).emit('over_menber',Numroom);
      }
    }
  });

  socket.on('shoot', function(playerId){
    Object.values(roomN.player_list).forEach((player) => {
      if(player.id === playerId){
        player.addF();
      }
    });
  });

  socket.on('movement', function (movement,playerId) {
    Object.values(roomN.player_list).forEach((player) => {
      if(roomN.GameStartFlag === 1){
        if(player.id === playerId){
          player.movement = movement;
        }
      }
    });
  });

}



function createShape(x,y,z,w,h,d,mass) {
  var shape, body, kesigomu_material;
  //table マテリアル このマテリアルがないと反発係数がつかない
  kesigomu_material = new CANNON.Material('kesigomu_material');
  kesigomu_material.friction = 0.3; //摩擦係数
  kesigomu_material.restitution = 0.7; //反発係数
  // initialize rigid body
  //公式ドキュメントにもhalfelementsって書いてあるので幅　高さ　奥行きの半分を与える。多分物理演算のために半分になってる
  shape = new CANNON.Box(new CANNON.Vec3(w, h, d));
  //shape = new CANNON.Sphere(w);
  body = new CANNON.Body({mass: mass});
  body.material = kesigomu_material;
  body.addShape(shape);
  x = Math.random()*40 - 20;
  z = Math.random()*40 - 20;
  body.position.x = x;
  body.position.y = y;
  body.position.z = z;
  //body.angularVelocity.set(0, 5, 10);   //角速度
  body.angularDamping = 0.1;　　　//減衰率
  //body.quaternion.set(Math.random()/50, Math.random()/50, Math.random()/50, 0.2);
  return body;
}


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

server.listen(PORT, function () {
  console.log('port 3000')
});
