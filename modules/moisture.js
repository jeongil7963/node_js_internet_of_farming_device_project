var SerialPort = require('serialport'); //아두이노와 시리얼 통신할 수 있는 모듈
var mqtt = require('mqtt'); //mqtt 모듈
var client = mqtt.connect('mqtt://13.124.28.87');  //mqtt 서버 접속
var config = require('../config.json');
var parsers = SerialPort.parsers;
var parser = new parsers.Readline({
    delimiter: '\r\n'
});
var http = require('http');
var deivce_num = config.channel;
//라즈베리파이와 연결된 디바이스 주소
var port = new SerialPort('/dev/ttyACM0', {
    baudrate: 9600
});

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
    var insert_url = 'http://13.124.28.87:8080/test/insert?field=' + deivce_num + '&value=' + sensorObj.soil
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

module.exports = port;
