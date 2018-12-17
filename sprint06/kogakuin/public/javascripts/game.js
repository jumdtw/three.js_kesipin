
const socket = io();
const canvas = $('#canvas-2d')[0];
const context = canvas.getContext('2d');
const playerImage = $('#player-image')[0];
const radius = 40

numroom = 1;


function gameStart(){
    socket.emit('game-start', {nickname: $("#nickname").val() },numroom);
    console.log('emit.start');
    $("#start-screen").hide();
    $("#waitting-screen").show();
}

$("#start-button").on('click', gameStart);

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
        socket.emit('movement', movement,numroom);
    }
    if(event.key === ' ' && event.type === 'keydown'){
        socket.emit('shoot' + String(roomnum));
    }
});

socket.on('state', function(players, color_list,Numroom) {

    if(numroom === Numroom){
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
    }


    //プレイヤー描画
    Object.values(players).forEach((player) => {
        if(player.roomNUM === Numroom){
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
        }

    });
    
});

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