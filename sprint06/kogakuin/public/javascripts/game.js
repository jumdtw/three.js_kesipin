//var socket = io();
//var socket = io.connect("localhost:3000",{'force new connection': true});
//var socket = io.connect("http://localhost", {'force new connection': true});
var socket = io('localhost:3000',{forceNew: true});
var radius = 40

var numroom = -1;
var myplayerId = -1;

var TIME_STEP = 1 / 30;
var SCREEN_WIDTH = 465;
var SCREEN_HEIGHT = 465;
var VIEW_ANGLE = 60;
const TABLE_HIEGHT = 70;
var camera, scene, renderer,Table;
var controls;
var l = [[1,1],[1,-1],[-1,1],[-1,-1]];
var player_list = {};

var my_materials = [
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/own_left.png')}), // left
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/own_right.png')}), // right
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/own_top.png')}), // top
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/own_bottom.png')}), // bottom
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/kesigomu_front_back.png')}), // front
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/kesigomu_front_back.png')})  // back
];
var enemy_materials = [
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/enemy_left.png')}), // left
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/enemy_right.png')}), // right
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/enemy_top.png')}), // top
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/enemy_bottom.png')}), // bottom
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/kesigomu_front_back.png')}), // front
    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/kesigomu_front_back.png')})  // back
];

window.onload = function(){
    //socket.id = localStorage.getItem('socket').id;
    init();
    // 初期化のために実行
    onResize();
    numroom = parseFloat(localStorage.getItem('roomNum'));
}

// リサイズイベント発生時に実行
window.addEventListener('resize', onResize);

function onResize() {
  // サイズを取得
  const width = window.innerWidth*0.80;
  const height = window.innerHeight;

  // レンダラーのサイズを調整する
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // カメラのアスペクト比を正す
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}


function init(){
    // initialize three.js's scene, camera and renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#mycanvas")
    })
    renderer.setSize(window.innerWidth*0.80, window.innerHeight);
    renderer.shadowMap.enabled = true;

    scene = new THREE.Scene();
    //XYZ軸の表示（引数は表示範囲）
    //axis = new THREE.AxisHelper(100000);
    //軸の開始位置
    //axis.position.set(0,0,0);
    //画面への軸の追加
    //scene.add(axis);
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, SCREEN_WIDTH / SCREEN_HEIGHT, 0.1, 1000);
    camera.position.x = 50;
    camera.position.y = 80 + TABLE_HIEGHT;
    camera.position.z = 55;
    controls = new THREE.OrbitControls(camera,renderer.domElement);

    initLights();
    initGround();
}

// initialize lights
function initLights() {
    var directionalLight, ambientLight, spotlight;
    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
    directionalLight.position.set(0, 50, 0);
    //directionalLight.castShadow = true;
    scene.add(directionalLight);
    ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);
    spotlight = new THREE.SpotLight(0xFFFFFF, 2, 100, Math.PI / 4, 1);
    // ライトに影を有効にする
    spotlight.castShadow = true;
    scene.add(spotlight);
}

// ground
function initGround() {
    createPlane();
    createTable();
}

function createPlane() {
    let w,h,material,geometry,mesh,Rotation,rrotation;

    w = 300;
    h = 500;
    rrotation = Math.PI
    Rotation = Math.PI/2;
    var loader = new THREE.TextureLoader();
    var texture = loader.load("../images/wood_texture.png");
    var yuka_texture = loader.load('../images/yuka.jpeg')
    
    material = new THREE.MeshLambertMaterial( { color: 0x777777, map: texture } );
    geometry = new THREE.PlaneGeometry( w, h );
    
    //壁
    for(let i=0;i<4;i++){
        mesh = new THREE.Mesh(geometry, material);
        let quaternion = mesh.quaternion;
        mesh.position.x = (w/2) * Math.cos(Rotation);
        mesh.position.y = TABLE_HIEGHT + (250-TABLE_HIEGHT);
        mesh.position.z = (w/2) * Math.sin(Rotation);
        let target = new THREE.Quaternion();
        let axis = new THREE.Vector3(0,1,0);
        target.setFromAxisAngle(axis,rrotation);
        quaternion.multiply(target);
        rrotation -= Math.PI/2;
        Rotation += Math.PI/2;
        scene.add(mesh);
    }

    //床
    material = new THREE.MeshLambertMaterial( { color: 0x777777, map: yuka_texture } );
    geometry = new THREE.PlaneGeometry(w,w);
    mesh = new THREE.Mesh(geometry,material);
    mesh.rotation.x = -Math.PI/2;
    scene.add(mesh);

    //天井
    geometry = new THREE.PlaneGeometry(w,w);
    mesh = new THREE.Mesh(geometry, material);
    let quaternion = mesh.quaternion;
    mesh.position.y = h;
    let target = new THREE.Quaternion();
    let axis = new THREE.Vector3(1,0,0);
    rrotation = Math.PI/2;
    target.setFromAxisAngle(axis,rrotation);
    quaternion.multiply(target);
    scene.add(mesh);

}

function createTable(){
    var geometry, materials,Table_leg;
    let w = 25;
    let h = 1;
    let d = 25;
    let color = 0xdcdcdc;
    let yoko_color = 0x792d00;

    // initialize Object3D
    //geometry = new THREE.SphereGeometry(w, 10, 10);
    //幅　高さ　奥行き
    //geometry = new THREE.CubeGeometry(w*2, h*2, d*2);
    geometry = new THREE.BoxGeometry(w*2, h*2, d*2);
    //geometry = new THREE.BoxGeometry(1,1,1);
    materials = [
        new THREE.MeshStandardMaterial({color: Math.round(yoko_color)}), 
        new THREE.MeshStandardMaterial({color: Math.round(yoko_color)}), 
        new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/wood_texture.png')}), // top
        new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('../images/wood_texture.png')}), // bottom
        new THREE.MeshStandardMaterial({color: Math.round(yoko_color)}), 
        new THREE.MeshStandardMaterial({color: Math.round(yoko_color)})  
    ];

    
    Table = new THREE.Mesh(geometry, materials);
    Table.position.set(0,TABLE_HIEGHT,0);
    //Table.receiveShadow = true;
    scene.add(Table);

    materials = [
        new THREE.MeshStandardMaterial({color: Math.round(color)}), 
        new THREE.MeshStandardMaterial({color: Math.round(color)}), 
        new THREE.MeshStandardMaterial({color: Math.round(color)}), 
        new THREE.MeshStandardMaterial({color: Math.round(color)}),
        new THREE.MeshStandardMaterial({color: Math.round(color)}), 
        new THREE.MeshStandardMaterial({color: Math.round(color)})  
    ];


    geometry = new THREE.BoxGeometry(2,TABLE_HIEGHT,2);
    
    for(let i=0;i<4;i++){
        Table_leg = new THREE.Mesh(geometry,materials);
        Table_leg.position.x = 23*l[i][0];
        Table_leg.position.y = TABLE_HIEGHT/2;
        Table_leg.position.z = 23*l[i][1];
        scene.add(Table_leg);
    }
}

//名前入力
function gameStart(){
    socket.emit('game-start', {nickname: $("#nickname").val() },numroom);
    $("#start-screen").hide();
    $("#waitting-screen").show();
}

function clearLocalstorage(){
    location.href='/index.html';
    localStorage.clear();
    //socket.emit('end-game');
}

$("#start-button").on('click', gameStart);
$("#winer-button").on('click', clearLocalstorage);
$("#loser-button").on('click', clearLocalstorage);
$("#not_entry-button").on('click', clearLocalstorage);

//キーイベント
let movement = {};
$(document).on('keydown', (event) => {
    
    //L
    if(event.keyCode===76){
        socket.emit('shoot',myplayerId);
    }
    
    //D
    if(event.keyCode===68){
        movement.right = true;
    }

    //A
    if(event.keyCode===65){
        movement.left = true;
    }

    //W
    if(event.keyCode===87){
        movement.up = true;
    }

    //S
    if(event.keyCode===83){
        movement.bottom = true;
    }

    socket.emit('movement', movement,myplayerId);
});

$(document).on('keyup', (event) => {
    //D
    if(event.keyCode===68){
        movement.right = false;
    }

    //A
    if(event.keyCode===65){
        movement.left = false;
    }

    //W
    if(event.keyCode===87){
        movement.up = false;

    }

    //S
    if(event.keyCode===83){
        movement.bottom = false;
    }
    socket.emit('movement', movement,myplayerId);
});


//socket 設定
socket.on('state', function(players,Numroom) {
    if(numroom === Numroom){
        // position graphical object on physical object recursively
        Object.values(players).forEach((cannon_player)=>{
            let kesigomu = player_list[cannon_player.id];
            if(cannon_player.exit===true){
                scene.remove(kesigomu.line);
                scene.remove(kesigomu.cone);
                scene.remove(kesigomu.body);
                socket.emit('remove_body',cannon_player.id);
            }
            kesigomu.angle = cannon_player.angle
            kesigomu.body.position.copy(cannon_player.position);
            kesigomu.body.quaternion.copy(cannon_player.quaternion);
            drawangle(cannon_player);
        });
        // render graphical object
        //Table.position.copy(Table.position);
        camera.lookAt(new THREE.Vector3(0,Table.position.y,0));
        renderer.render(scene, camera);
        controls.update();
    }
});


function drawangle(player){
    if(player.exit!==true){
        kesigomu = player_list[player.id];
        scene.remove(kesigomu.line);
        scene.remove(kesigomu.cone);
        player.line = createline(player);
        player.cone = createcone(player);
        scene.add(kesigomu.line);
        scene.add(kesigomu.cone);
    }
}

function createline(player){
    let material,geometry,Vx,Vz,kesigomu,line;
    material = new THREE.LineBasicMaterial({color:0x800080,linewidth: 6});
    geometry = new THREE.Geometry();
    kesigomu = player_list[player.id];
    Vx = Math.cos(kesigomu.angle) * 4 + kesigomu.body.position.x;
    Vz = Math.sin(kesigomu.angle) * 4 + kesigomu.body.position.z;
    geometry.vertices.push(
        new THREE.Vector3(kesigomu.body.position.x,kesigomu.body.position.y,kesigomu.body.position.z),
        new THREE.Vector3(Vx,kesigomu.body.position.y,Vz),
    );
    line = new THREE.Line(geometry,material);
    player_list[player.id].line = line;
    return line;
}

function createcone(player){
    let material,geometry,Vx,Vz,kesigomu,cone;
    geometry = new THREE.ConeGeometry(0.4,1,20);
    material = new THREE.MeshBasicMaterial({color:0x800080});
    kesigomu = player_list[player.id];
    Vx = Math.cos(kesigomu.angle) * 4 + kesigomu.body.position.x;
    Vz = Math.sin(kesigomu.angle) * 4 + kesigomu.body.position.z;
    cone = new THREE.Mesh(geometry,material);
    cone.position.x = Vx;
    cone.position.y = kesigomu.body.position.y;
    cone.position.z = Vz;
    cone.rotation.x = Math.PI/2;
    cone.rotation.z = player_list[player.id].angle - Math.PI/2;
    player_list[player.id].cone = cone;
    return cone;
}


//socket 

socket.on('dead', function(Numroom) {
    if(numroom===Numroom){
        $("#loser-screen").show();
    }
});

socket.on('starting-game',function(Numroom){
    if(numroom===Numroom){
        $("#waitting-screen").hide();
    }
});

socket.on('over_menber',function(Numroom){
    if(numroom===Numroom){
        $("#waitting-screen").hide();
        $("#not_entry").show();
    }
});

socket.on('winer',function(player){
    if(socket.id === player.socketId){
        $("#winer-screen").show();
    }
});

socket.on('yourID',function(ID,Numroom){
    if(Numroom===numroom){
        if(myplayerId === -1){
            myplayerId = ID;
        }
    }
});

socket.on('Syc',function(Numroom){
    if(Numroom===numroom){
        socket.emit('Ack', myplayerId);
    }
});


socket.on('addPlayer',function(players,Numroom){
    if(Numroom===numroom){
        Object.values(players).forEach((player)=>{
            player_list[player.id] = {}
            if(player.id===myplayerId){
                player_list[player.id].body = createShape(1,0.7,2,1);
            }else{
                player_list[player.id].body = createShape(1,0.7,2,0);
            }
            player_list[player.id].angle = Math.PI/2;
            player_list[player.id].line = createline(player);
            player_list[player.id].cone = createcone(player);
            player_list[player.id].sphere = null;
            player_list[player.id].sphere = 0;
            scene.add(player_list[player.id].body);
            scene.add(player_list[player.id].line);
            scene.add(player_list[player.id].cone);
        });
    }
});

function createShape(w,h,d,flag) {
    var geometry, materials, mesh;
    let color = 0xFFFFFF;
    // initialize Object3D
    //geometry = new THREE.SphereGeometry(w, 10, 10);
    //幅　高さ　奥行き
    //geometry = new THREE.CubeGeometry(w*2, h*2, d*2);
    geometry = new THREE.BoxGeometry(w*2, h*2, d*2);
    
    var materials = null;
    if(flag){
        var materials = my_materials;
    }else{
        var materials = enemy_materials;
    }
    
  
    mesh = new THREE.Mesh(geometry, materials);
    return mesh;
}

//現状の人数
let pastmenber = 0;
socket.on('now_menber',function(menber,Numroom){
    console.log('now_menber');
    if(numroom===Numroom){
        if(menber!=pastmenber){
            lists = document.getElementById('before_num');
            broccoli = lists.lastElementChild;
            lists.removeChild(broccoli);
            pastmenber = menber; 
            let element = document.createElement('p');
            element.className = 'waitting';
            element.textContent = String(menber) + '/3';
            document.getElementById('before_num').appendChild(element);
        }
    }
});

//誰のturnか知らせる。
socket.on('Alert_turn',function(player,Numroom){
    if(numroom===Numroom){
        if(player.socketId!=socket.id){
            lists = document.getElementById('alert_turn');
            broccoli = lists.lastElementChild;
            lists.removeChild(broccoli);
            let element = document.createElement('p');
            element.className = 'alert';
            element.textContent = String(player.nickname) + ' のturn';
            document.getElementById('alert_turn').appendChild(element);
            $('alert_turn').show();
            sleep(4000);
            $('alert_turn').hide();
        }else{
            lists = document.getElementById('alert_turn');
            broccoli = lists.lastElementChild;
            lists.removeChild(broccoli);
            let element = document.createElement('p');
            element.className = 'alert';
            element.textContent = 'あなた' + ' のturn';
            document.getElementById('alert_turn').appendChild(element);
            $('alert_turn').show();
            sleep(4000);
            $('alert_turn').hide();
        }
    }
});
