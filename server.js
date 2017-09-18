'use strict';

 //confi.json 에서 기본 설정값을 가져옴
 var config = require('./config.json');
 var field_id = config.channel;
 var water_stop_time = config.water_stop_time;
 var shooting_time = config.shooting_time;

//mysql db 연동
 var mysql_dbc = require('./db_con/db_con')();
 var connection = mysql_dbc.init();
 mysql_dbc.test_open(connection);

//db에서 설정 값 가져오기
 var stmt = 'SELECT * from device_setting where field_id = ' + field_id;
 connection.query(stmt, function (err, result) {
     console.log(result);

     if( result == "") {
       console.log("undefined setting");
       console.log("using default setting");
     } else {
       console.log("defining new setting");
       water_stop_time = result[0].water_stop_time;
       shooting_time = result[0].shooting_time;
     }

     module_start();
  });

//모듈 시작
function module_start() {
  //controller.set_config(field_id, shooting_time);
  //controller.start();
  //var watering = require("./modules/watering"); //아두이노
  //var arduino = require("./modules/moisture"); //아두이노
}

var RaspiCam = require("raspicam"); //카메라 모듈
var socket = require('socket.io-client')('http://13.124.28.87:5001'); //소켓서버에 연결
var dl = require('delivery'); //파일 전송 모듈
var moment = require('moment');
var mqtt = require('mqtt'); //mqtt 모듈
var client = mqtt.connect('mqtt://13.124.28.87'); //mqtt 서버 접속
var http = require('http'); //http socket

//setting 변수
var field_id;
var shooting_time;

var option = {
    width: 600,
    height: 420,
    mode: 'timelapse',
    awb: 'off',
    encoding: 'jpg',
    output: "./images/image_%03d.jpg", // image_000001.jpg, image_000002.jpg,... moment().format('YYYYMMDDHHmmss') + ".jpg"
    q: 50,
    timeout: 0, // take a total of 4 pictures over 12 seconds , 0 일경우 무제한 촬영
    timelapse: 1000*60*shoo, //1시간 단위로 촬영
    nopreview: true,
    th: '0:0:0'
};

var camera = new RaspiCam(option);;

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

//setting 변수 설정
camera.set_config = function (id, shoot) {
  field_id = id;
  shooting_time = shoot;
  console.log("set_config execution");
  console.log("field_id " + field_id);
  console.log("shooting_time " + shooting_time);
};
