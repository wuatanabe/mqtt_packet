var e= require('./lib/mqtt_encode.js');
var d= require('./lib/mqtt_decode.js');

x= e.encode({ 'msg_type' : 0x20, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00,
				'remain_length' : 0x02, 'reserved': 0xFF, 'return_code': 0x01     //0x00 -> 0x05
			});

//~ //console.log(x);	
//~ console.log("SUBSCRIBE");			
//~ x1= e.encode_msg.subscribe({'payload': [{'topicname' : '/hello/beauty' , 'QoS' : 0x01}, {'topicname' : '/merry/melodies', 'QoS' : 0x01}] });
//~ console.log(x1);
//~ y1=d.decode(x1);
//~ console.log(y1);	
			
//~ console.log("DISCONNECT");	
//~ x= e.encode_msg.disconnect();
//~ console.log(x);
//~ y=d.decode(x);
//~ console.log(y);	
			
//~ console.log("PUBREC");	
//~ x= e.encode_msg.pubrec();
//~ console.log(x);
//~ y=d.decode(x);
//~ console.log(y);	
	
//~ console.log("PUBREL");				
//~ x2= e.encode_msg.pubrel();
//~ console.log(x2);
//~ y2=d.decode(x2);
//~ console.log(y2);

//~ console.log("CONNACK");				
//~ x2= e.encode_msg.connack();
//~ console.log(x2);
//~ y2=d.decode(x2);
//~ console.log(y2);

//~ console.log("SUBACK");				
//~ x2= e.encode_msg.suback();
//~ console.log(x2);
//~ y2=d.decode(x2);
//~ console.log(y2);

//~ console.log("UNSUBACK");				
//~ x2= e.encode_msg.unsuback();
//~ console.log(x2);
//~ y2=d.decode(x2);
//~ console.log(y2);

//~ console.log("CONNECT");				
//~ x2= e.encode_msg.connect();
//~ console.log(x2);
//~ y2=d.decode(x2);
//~ console.log(y2);

//~ console.log("PUBLISH");				
//~ x2= e.encode_msg.publish();
//~ console.log(x2);
//~ y2=d.decode(x2);
//~ console.log(y2);
			
exports.mqtt_encode_msg = e;
exports.mqtt_decode_msg = d;	

//module.exports.encode = require('./lib/mqtt_encode.js');