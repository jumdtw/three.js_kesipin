const socket = io();
const canvas = $('#canvas-2d')[0];
const context = canvas.getContext('2d');
const playerImage = $('#player-image')[0];
const radius = 40



function gameStart(){
    socket.emit('game-start', {nickname: $("#nickname").val() });
    $("#start-screen").hide();
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
        socket.emit('movement', movement);
    }
    if(event.key === ' ' && event.type === 'keydown'){
        socket.emit('shoot');
    }
});

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

socket.on('dead', () => {
    $("#start-screen").show();
});