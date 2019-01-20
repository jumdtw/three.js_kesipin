
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

var room_list = {};
var room_baf = {};
let Player_list = {};

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
    //打ち出す角度
    this.angle = Math.PI/2;
    this.movement = {};
    //打ち出す力
    this.power = 4;
    //消しゴムを押し出す小物体用
    this.sphere = null;
    this.sphere_time = 0;
    //turn制御用
    this.moveFlag = false;
    //負けか否か
    this.loserFlag = false;
    //疎通確認用
    this.disconnectionFlag = true;
  }

  addF(world,player) {
    if(this.moveFlag === false){
      let ball_material,Sphere,shape,Vx,Vz;
      let Time = 0;
      let v0 = 10;
      Vx = v0 * Math.cos(this.angle);
      Vz = v0 * Math.sin(this.angle);
      //table マテリアル
      ball_material = new CANNON.Material('ball_material');
      ball_material.friction = 0.01;　//摩擦係数
      ball_material.restitution = 0.01; //反発係数

      shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
      Sphere = new CANNON.Body({mass: 10});
      Sphere.material = ball_material;
      Sphere.addShape(shape);
      Sphere.position.x = this.rigidBody.position.x + 3*Math.cos(this.angle - Math.PI);
      Sphere.position.y = this.rigidBody.position.y - 0.3;
      Sphere.position.z = this.rigidBody.position.z + 3*Math.sin(this.angle + Math.PI);
      Sphere.velocity.set(player.power*Vx,0,player.power*Vz)
      this.sphere_time = Time;
      this.sphere = Sphere;
      world.add(Sphere);
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
  constructor(Numroom,Player_list){
    this.player_list = Player_list;
    this.rigid_list = {};
    this.numroom = Numroom;
    //ゲーム状態の保持用 0:menber参加待ち　1:ゲーム中　2:全ユーザーが出るのを待つ。10秒経つと自動的に3に移行する　3:新たにこのルームに人がくるのを待機する
    this.GameStartFlag = 0;
    //疎通確認用
    this.echoTime = 0;
    this.echoFlag = false;
    //卓上　残留人数
    this.num_player = 0;
    //ゲーム終了
    this.endTimer = 0;
    this.table = createTable();
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase(); //ぶつかっている可能性のあるオブジェクト同士を見つける
    this.world.solver.iterations = 10; //反復計算回数
    this.world.solver.tolerance = 0.1; //許容範囲
    this.world.add(initGround());
    this.world.add(this.table);
   
    
    setInterval(()=>{
      if(this.GameStartFlag!==3){
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
            if(movement.up){
              console.log(player.power);
              player.power = player.power + 0.1;
              if(player.power > 6){
                player.power = 3;
              }
            }
            if(movement.bottom){
              console.log(player.power);
              player.power = player.power - 0.1;
              if(player.power <= 2){
                player.power = 5;
              }
            }
            this.rigid_list[player.id].angle = player.angle;
            this.rigid_list[player.id].power = player.power;

            if(player.sphere!=null&&player.loserFlag===false){
              player.sphere_time = player.sphere_time + TIME_STEP;
              if(player.sphere_time>=TIME_STEP*5){
                  player.sphere_time = 0;
                  this.world.remove(player.sphere);
                  player.sphere = null;
              }
            }

            this.out_judge(player);
            if(player.loserFlag){
              this.num_player = this.num_player + 1;
            }
          }else if(this.GameStartFlag === 0){
            io.sockets.emit('now_menber',Object.keys(this.player_list).length,this.numroom)
          }
        });
        if(this.GameStartFlag!=0){
          io.sockets.emit('state', this.rigid_list,this.numroom);
          //疎通確認
          this.echoTime = this.echoTime + TIME_STEP;
          if(this.echoTime > TIME_STEP * 30 * 3&&this.echoFlag===false){
            this.echoFlag = true;
            io.sockets.emit('Syc',this.numroom);
          }
          //すぐ返答がこない可能性があるので２秒インターバルをおく
          if(this.echoTime > TIME_STEP * 30 * 5&&this.echoFlag===true){
            this.echoFlag = false;
            this.echoTime = 0;
            this.connection_judge();
          }
        }
        if(this.GameStartFlag===1){
          if(((Object.keys(this.player_list).length)-(this.num_player))<=1){
            Object.values(this.player_list).forEach((player) => {
              if(!player.loserFlag){
                io.to(player.socketId).emit('winer',player,this.numroom);
              }
            });
            this.GameStartFlag = 2;
          }else{
            this.num_player = 0;
          } 
        }

        if(this.GameStartFlag===2){
          this.endTimer = this.endTimer + TIME_STEP;
          if(this.endTimer >= TIME_STEP * 30 * 10){
            this.GameStartFlag = 3;
            end_MainGame(this.numroom);
          }
        }
      }
      
    }, 1000 / 30);//setInterval

  }

  

  out_judge(player){
    if(player.rigidBody.position.y <= TABLE_HIEGHT/2&&this.player_list[player.id].loserFlag===false){
        this.player_list[player.id].loserFlag = true;
        io.to(player.socketId).emit('dead',this.numroom)
    }
  }

  connection_judge(){
    Object.values(this.player_list).forEach((player) =>{
      if(player.disconnectionFlag){
        this.world.remove(this.player_list[player.id].rigidBody);
        delete this.player_list[player.id];
        this.rigid_list[player.id].exit = true;
      }else{
        player.disconnectionFlag = true;
      }
    });
  }


  set_world(){
    Object.values(this.player_list).forEach((player) => {
      this.world.add(player.rigidBody);
    });
  }

  set_rigid_list(){
    Object.values(this.player_list).forEach((player) => {
      this.rigid_list[player.id] = {};
      this.rigid_list[player.id].id = player.id;
      this.rigid_list[player.id].position = this.player_list[player.id].rigidBody.position;
      this.rigid_list[player.id].quaternion = this.player_list[player.id].rigidBody.quaternion;
      this.rigid_list[player.id].angle = this.player_list[player.id].angle;
      this.rigid_list[player.id].power = 4;
      this.rigid_list[player.id].exit = false;
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
  table_material.friction = 0.06;　//摩擦係数
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
    console.log('createGame');
    if(room_list[Numroom]===undefined){room_list[Numroom] = {};}
    if(room_list[Numroom].flag===false||room_list[Numroom].flag===undefined){
      room_list[Numroom].flag = true;
      room_list[Numroom].number = Numroom;
      console.log('connect succesfull room');
    }
  });

  socket.on('game-start', function(config,Numroom) {
    //if(room_list[Numroom].number === Numroom && (roomN.GameStartFlag===0||roomN.GameStartFlag===3)){
    if(room_list[Numroom].number === Numroom){
      if(Player_list[Numroom] === undefined){Player_list[Numroom]={};}
      if(Object.keys(Player_list[Numroom]).length < 3 || Object.keys(Player_list[Numroom]).length===undefined){
        if(Object.keys(Player_list[Numroom]).length===0 || Object.keys(Player_list[Numroom]).length===undefined){Player_list[Numroom] = {};}
        player = new Player({
          socketId: socket.id,
          nickname: config.nickname,
        });
        Player_list[Numroom][player.id] = player;
        //roomN.player_list[player.id] = player;
        //roomN.world.add(player.rigidBody);
        Object.values(Player_list).forEach((player)=>{
          console.log('nowmenber');
          io.to(player.socketId).emit('now_menber',Object.keys(Player_list).length,Numroom)
        })
        io.to(socket.id).emit('yourID',player.id,Numroom);
        if(Object.keys(Player_list[Numroom]).length === 3){
          roomN = new Main_Game(Numroom,Player_list[Numroom]);
          room_baf[Numroom] = roomN; 
          io.sockets.emit('addPlayer',roomN.player_list,Numroom);
          roomN.GameStartFlag = 1;
          roomN.set_world();
          roomN.set_rigid_list();
          Object.values(roomN.player_list).forEach((player)=>{
            io.to(player.socketId).emit('starting-game',Numroom);
          })
          //main game start
          //roomN.Main_Game_Start(Numroom);
        }
      }else if(Object.keys(Player_list[Numroom]).length >= 3){
        io.to(socket.id).emit('over_menber',Numroom);
      }
    }
  });

  socket.on('shoot', function(playerId){
    Object.values(roomN.player_list).forEach((player) => {
      if(player.id === playerId){
        if(player.sphere===null){
          player.addF(roomN.world,player);
        }
      }
    });
  });

  socket.on('movement', function (movement,playerId) {
    if(roomN!==undefined){
      Object.values(roomN.player_list).forEach((player) => {
        if(roomN.GameStartFlag === 1){
          if(player.id === playerId){
            player.movement = movement;
          }
        }
      });
    }
  });

  socket.on('Ack',function(playerId){
    if(roomN!==undefined || roomN!==null){
      roomN.player_list[playerId].disconnectionFlag = false;
    }
  });

  socket.on('remove_body',function(playerId){
    delete roomN.rigid_list[playerId]
  });

  socket.on('end-game', function () {
    delete roomN;
  });

  socket.on('disconnect',function(){
    
  });
}

function end_MainGame(Numroom){
  roomN = undefined;
  room_baf[Numroom] = null;
  room_list[Numroom].flag = false;
  Player_list[Numroom] = {};
  console.log('end-game');
}

function createShape(x,y,z,w,h,d,mass) {
  var shape, body, kesigomu_material;
  //table マテリアル このマテリアルがないと反発係数がつかない
  kesigomu_material = new CANNON.Material('kesigomu_material');
  kesigomu_material.friction = 0.25; //摩擦係数
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
