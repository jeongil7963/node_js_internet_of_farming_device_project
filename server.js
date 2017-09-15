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

//카메라 모듈 선언
 var controller = require('./modules/camera');

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
  controller.start();
  //var watering = require("./modules/watering"); //아두이노
  //var arduino = require("./modules/moisture"); //아두이노

}

//filed_id 반환
setting.get_field_id = function(){
  return filed_id;
}

//shooting_time 반환
setting.get_shooting_time = function(){
  return shooting_time;
}

//water_stop_time 반환
setting.get_water_stop_time = function(){
  return water_stop_time;
}

module.exports = setting;
