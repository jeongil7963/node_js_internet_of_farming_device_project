/*
    ** 개발 항목 및 이슈 **
    1. 1시간 단위로 카메라 촬영하여 서버로 전송한다.
    2. 카메라 모듈과 파일 전송 모듈을 이용
    3. 서버에서 요청시 촬영하는 기능 ( 필요한가? )
    4. 파일명을 날짜 시간 단위
    5. 전송인증
    6. 파일 보관 기간
    7. 채널 관리
    8. mqtt on/off controll
*/

var RaspiCam = require("raspicam"); //카메라 모듈
var socket = require('socket.io-client')('http://13.124.28.87:5001'); //소켓서버에 연결
var dl = require('delivery'); //파일 전송 모듈
var moment = require('moment');
var mqtt = require('mqtt'); //mqtt 모듈
var client = mqtt.connect('mqtt://13.124.28.87'); //mqtt 서버 접속
var http = require('http'); //http socket
var config = require('../config.json');
var setting = require('../server');


var option = {
    width: 600,
    height: 420,
    mode: 'timelapse',
    awb: 'off',
    encoding: 'jpg',
    output: "./images/image_%03d.jpg", // image_000001.jpg, image_000002.jpg,... moment().format('YYYYMMDDHHmmss') + ".jpg"
    q: 50,
    timeout: 0, // take a total of 4 pictures over 12 seconds , 0 일경우 무제한 촬영
    timelapse: 1000*60*(setting.get_shooting_time()), //1시간 단위로 촬영
    nopreview: true,
    th: '0:0:0'
};

var camera = new RaspiCam(option);

//소켓통신으로 이미지 파일을 서버로 전송

var temp = {};

socket.on('connect', function() {
    console.log("Sockets connected");
    //delivery 패키지 이용
    delivery = dl.listen(socket);
    delivery.connect();

    delivery.on('delivery.connect', function(delivery) {

        delivery.on('send.success', function(file) {
            console.log('File sent successfully!');
        });
    });

});

//모듈 시작
camera.on("start", function(err, timestamp) {
    console.log("timelapse started at " + timestamp);
});

//카메라 촬영
camera.on("read", function(err, timestamp, filename) {
    console.log("timelapse image captured with filename: " + filename);

    delivery.send({
        name: filename,
        path: './images/' + filename,
        params: { channel: config.channel, img_name: moment().format('YYYYMMDDHH') + ".jpg" }
    });

});


//모듈 종료
camera.on("exit", function(timestamp) {
    console.log("timelapse child process has exited");
});

//모듈 정지
camera.on("stop", function(err, timestamp) {
    console.log("timelapse child process has been stopped at " + timestamp);
});



module.exports = camera;
