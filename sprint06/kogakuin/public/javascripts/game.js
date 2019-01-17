
const socket = io();
const radius = 40

var numroom = -1;
let myplayerId = -1;

var TIME_STEP = 1 / 30;
var SCREEN_WIDTH = 465;
var SCREEN_HEIGHT = 465;
var VIEW_ANGLE = 60;
const TABLE_HIEGHT = 70;
var world, camera, scene, renderer, rendererElement, Mycanvas, axis, Table;
var controls;
var l = [[1,1],[1,-1],[-1,1],[-1,-1]];
var player_list = {};

window.onload = function(){
    init();
    numroom = parseFloat(localStorage.getItem('roomNum'));
}


function init(){
    // initialize three.js's scene, camera and renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#mycanvas")
    })
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
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
    //texture.wrapS   = texture.wrapT = THREE.RepeatWrapping;
    //texture.repeat.set( 5, 5 );  
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
    let color = 0xDCAA6B;

    // initialize Object3D
    //geometry = new THREE.SphereGeometry(w, 10, 10);
    //幅　高さ　奥行き
    //geometry = new THREE.CubeGeometry(w*2, h*2, d*2);
    geometry = new THREE.BoxGeometry(w*2, h*2, d*2);
    //geometry = new THREE.BoxGeometry(1,1,1);
    materials = [
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 1.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 2.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 3.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 4.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 5.png
        new THREE.MeshStandardMaterial({color: Math.round(color)})  // 6.png
    ];

    Table = new THREE.Mesh(geometry, materials);
    Table.position.set(0,TABLE_HIEGHT,0);
    //Table.receiveShadow = true;
    scene.add(Table);

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

$("#start-button").on('click', gameStart);

//キーイベント
let movement = {};
$(document).on('keydown keyup', (event) => {
    const KeyToCommand = {
        'ArrowUp': 'forward',
        'ArrowDown': 'back',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
    };
    const command = KeyToCommand[event.key];
    if(command){
        if(event.type === 'keydown'){
            movement[command] = true;
        }else{ /* keyup */
            movement[command] = false;
        }
        socket.emit('movement', movement,myplayerId);
    }
    if(event.key === ' ' && event.type === 'keydown'){
        socket.emit('shoot',myplayerId);
    }
});


//socket 設定
socket.on('state', function(players,Numroom) {
    if(numroom === Numroom){
        // position graphical object on physical object recursively
        Object.values(players).forEach((cannon_player)=>{
            player_list[cannon_player.id].position.copy(cannon_player.position);
            player_list[cannon_player.id].quaternion.copy(cannon_player.quaternion);
        });
        // render graphical object
        Table.position.copy(Table.position);

        renderer.render(scene, camera);
        camera.lookAt(new THREE.Vector3(0,80+TABLE_HIEGHT,0));
        controls.update();
    }

});

function createShape(x,y,z,w,h,d,mass,id) {
    var geometry, materials, mesh;
    let color = 0xFFFFFF;
    // initialize Object3D
    //geometry = new THREE.SphereGeometry(w, 10, 10);
    //幅　高さ　奥行き
    //geometry = new THREE.CubeGeometry(w*2, h*2, d*2);
    geometry = new THREE.BoxGeometry(w*2, h*2, d*2);
    materials = [
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 1.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 2.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 3.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 4.png
        new THREE.MeshStandardMaterial({color: Math.round(color)}), // 5.png
        new THREE.MeshStandardMaterial({color: Math.round(color)})  // 6.png
    ];
  
    mesh = new THREE.Mesh(geometry, materials);
    return mesh;
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

socket.on('addPlayer',function(players,Numroom){
    if(Numroom===numroom){
        Object.values(players).forEach((player)=>{
            player_list[player.id] = createShape(0,30+TABLE_HIEGHT,0,1,0.7,2);
            scene.add(player_list[player.id]);
        });
    }
});

//現状の人数
let pastmenber = 0;
socket.on('now_menber',function(menber,Numroom){
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
        console.log('aaa');
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