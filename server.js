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
     connection.end();
     module_start();
  });

//모듈 시작
function module_start() {
    camera.start();
}

//카메라 모듈//
var RaspiCam = require("raspicam"); //카메라 모듈
var socket = require('socket.io-client')('http://13.124.28.87:5001'); //소켓서버에 연결
var dl = require('delivery'); //파일 전송 모듈
var moment = require('moment');
var mqtt = require('mqtt'); //mqtt 모듈
var client = mqtt.connect('mqtt://13.124.28.87'); //mqtt 서버 접속
var http = require('http'); //http socket
//관수 모듈//
var GPIO = require('onoff').Gpio;
var onoffcontroller = new GPIO(21, 'out');
//수분 측정 모듈//
var SerialPort = require('serialport'); //아두이노와 시리얼 통신할 수 있는 모듈
var parsers = SerialPort.parsers;
var parser = new parsers.Readline({
    delimiter: '\r\n'
});
//라즈베리파이와 연결된 디바이스 주소
var port = new SerialPort('/dev/ttyACM0', {
    baudrate: 9600
});


//--------------카메라-----------------//
var option = {
    width: 600,
    height: 420,
    mode: 'timelapse',
    awb: 'off',
    encoding: 'jpg',
    output: "./images/image_%03d.jpg", // image_000001.jpg, image_000002.jpg,... moment().format('YYYYMMDDHHmmss') + ".jpg"
    q: 50,
    timeout: 0, // take a total of 4 pictures over 12 seconds , 0 일경우 무제한 촬영
    timelapse: 1000*60*shooting_time, //1시간 단위로 촬영
    nopreview: true,
    th: '0:0:0'
};

var camera = new RaspiCam(option);

//소켓통신으로 이미지 파일을 서버로 전송

var temp = {};

socket.on('connect', function() {
    console.log("Sockets connected");
    //delivery 패키지 이용
    var delivery = dl.listen(socket);
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
        params: { channel: field_id, img_name: moment().format('YYYYMMDDHH') + ".jpg" }
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

//--------------관수-----------------//
//MQTT pub/sub
client.on('connect', function() {
    client.subscribe('/' + field_id + '/onoff');
});

//callback
client.on('message', function(topic, message) {
    // message is Buffer
    console.log(message.toString());
    if (message.toString() === '1') {
	    console.log('watering on');
        onoffcontroller.writeSync(1);
    } else if (message.toString() === '0') {
	    console.log('watering off');
        onoffcontroller.writeSync(0);
    } else {
        console.log('watering error ');
        var error_time = new Date.toString();
        var get_message = message.toString();
        var error_temp = { error_time: get_message };
        temp.add(error_temp);
    }
    //port.write(message.toString(), function(err) {});
});

//--------------수분측정-----------------//
port.pipe(parser);

//포트 열기
port.on('open', function () {
    console.log('port open');
});

// open errors will be emitted as an error event
port.on('error', function (err) {
    console.log('Error: ', err.message);
});

parser.on('data', function (data) {
    console.log('Read and Send Data : ' + data);
    var sensorObj = JSON.parse(data.toString()); // json 형식 data를 객체형식으로 저장
    var insert_url = 'http://13.124.28.87:8080/test/insert?field=' + field_id + '&value=' + sensorObj.soil
    http.get(insert_url, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            //console.log(JSON.parse(data).explanation);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
});
