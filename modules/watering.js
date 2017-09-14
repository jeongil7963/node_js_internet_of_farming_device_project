var mqtt = require('mqtt'); //mqtt 모듈
var client = mqtt.connect('mqtt://13.124.28.87'); //mqtt 서버 접속
var config2 = require('../config.json');
var deivce_num = config2.channel;
var GPIO = require('onoff').Gpio;
var onoffcontroller = new GPIO(21, 'out');

//MQTT pub/sub
client.on('connect', function() {
    client.subscribe('/' + config2.channel + '/onoff');
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

module.exports = client;
