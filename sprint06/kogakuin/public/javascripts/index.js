//var socket = io();
//var socket = io.connect("localhost:3000", {'force new connection': true});
//var socket = io.connect("http://localhost", {'force new connection': true});
var socket = io('localhost:3000',{forceNew: true});

window.onload = function(){
    socket.on('reconnect');
    localStorage.setItem("roomNum",-1);
}

let room1 = document.getElementById('1_room_button');
let room2 = document.getElementById('2_room_button');
let room3 = document.getElementById('3_room_button');
let room4 = document.getElementById('4_room_button');
let room5 = document.getElementById('5_room_button');
let room6 = document.getElementById('6_room_button');

function room_1(){
    num = 1;
    localStorage.setItem('socket',socket);
    location.href='/game.html';
    save_Storage(num);    
    if(socket.emit('createGame',1)){
        console.log('emit');
    };
}
function room_2(){
    num = 2;
    localStorage.setItem('socket',socket);
    window.location.href='/game.html';
    save_Storage(num);
    socket.emit('createGame',2);
}
function room_3(){
    num = 3;
    localStorage.setItem('socket',socket);
    window.location.href='/game.html';
    save_Storage(num);
    socket.emit('createGame',3);
}
function room_4(){
    num = 4;
    localStorage.setItem('socket',socket);
    window.location.href='/game.html';
    save_Storage(num);
    socket.emit('createGame',4);
}
function room_5(){
    num = 5;
    localStorage.setItem('socket',socket);
    window.location.href='/game.html';
    save_Storage(num);
    socket.emit('createGame',5);
}
function room_6(){
    num = 6;
    localStorage.setItem('socket',socket);
    window.location.href='/game.html';
    save_Storage(num);
    socket.emit('createGame',6);
}

function save_Storage(num){
    if(('localStorage' in window) && (window.localStorage !== null)) {
        // ローカルストレージが使える
        localStorage.setItem("roomNum",num);
    } else {
        console.log('err storage');
        return -1;
    }
}

room1.onclick = room_1;
room2.onclick = room_2;
room3.onclick = room_3;
room4.onclick = room_4;
room5.onclick = room_5;
room6.onclick = room_6;



socket.on('state', function(players, color_list) {
    //大事
    context.clearRect(0, 0, canvas.width, canvas.height);


    //木目
    context.beginPath();
    let img = new Image();
    img.src = "../images/wood_texture.png"
    context.drawImage(img,0,0,1000,1000);

    
    //茶枠
    context.lineWidth = 30;
    context.strokeStyle="#914600";  
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    
    context.stroke();


    //プレイヤー描画
    Object.values(players).forEach((player) => {

        let radius = 40
        context.save();
        context.font = '20px Bold Arial';
        context.fillText(player.nickname, player.x, player.y + player.height + 25);

        //色を指定
        context.strokeStyle= color_list[player.id]; 
        context.fillStyle= color_list[player.id];

        //player描画    
        context.beginPath();
        context.arc(player.x, player.y, 40, 0, 2 * Math.PI, false);
        context.fill();
        
       
        //向いている方向にlineを描画
        context.beginPath();
        context.lineWidth = 3;
        context.strokeStyle = '#ff0000';
        context.moveTo(player.x, player.y);
        context.lineTo(player.x + Math.cos(player.angle)*(radius+20), player.y + Math.sin(player.angle) * (radius+20));
        context.stroke();
        
        if(player.socketId === socket.id){
            context.save();
            context.font = '30px Bold Arial';
            context.strokeStyle= "black"; 
            context.fillStyle= "black";

            context.fillText('You', player.x-20, player.y - radius-10);
            context.restore();
        }

    });
    
});

socket.on('dead', function() {
    $("#loser-screen").show();
});

socket.on('starting-game',function(){
    $("#waitting-screen").hide();
});

socket.on('over_menber',function(){
    $("#waitting-screen").hide();
    $("#not_entry").show();
});

socket.on('winer',function(socketId){
    if(socket.id === socketId){
        $("#winer-screen").show();
    }
});

//現状の人数
let pastmenber = 0;
socket.on('now_menber',function(menber){

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
});

//誰のturnか知らせる。
socket.on('Alert_turn',function(player){
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
});