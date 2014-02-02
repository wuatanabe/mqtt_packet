
var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });


var new_msg= function(msg, default_msg){
		for(key in default_msg) {
			if(msg!= undefined && msg[key]){
				default_msg[key] = msg[key];
			}
		}
		return default_msg;
	};

var mqtt_encode = function(){
		_this = this;
	
		_this._validate = function(){
			logme.debug("_validate");  
		};

		_this._connectpayload = function(){
			var msg=_this._data;
			logme.debug(' msg[client_identifier]='+ msg['client_identifier']);
			var keys=['username','password','will_retain','will_QoS1','will_QoS2','will_flag','clean_session','unused'];
			var flags={};
			for (var i = 7; i >= 0; i--) {
			   flags[keys[i]]= msg['connect_flags'] & (1 << i) ? 1 : 0;
			}
			var buff=[];
			buff[0]= _this._payloadelem( msg['client_identifier'], 1);
			buff[1]= _this._payloadelem( msg['willtopic'], flags['will_flag']);	
			buff[2]= _this._payloadelem( msg['willmessage'], flags['will_flag']);				
			buff[3]= _this._payloadelem( msg['username'], flags['username']);	
			buff[4]= _this._payloadelem( msg['password'], flags['password']);	
			logme.inspect(flags);
			return Buffer.concat(buff);
		};
		
		_this._payloadelem=function(e, flag){
			if(flag==1){
					var b= new Buffer(2+e.length);
					b[0]=0x00;
					b[1]=e.length & 0xFF;
					for(i=0; i<e.length; i++){ b[2+i]= e.charCodeAt(i); }
					return b;
				}
			return new Buffer(0);
			}
	
			
		_this._retain = function(v){
			if(v<127){ return  new Buffer([v]);};
	           	m1=v%128+0x80;
			d1=v/128;	
			if(value>127 && value<16383){ return new Buffer([m1, d1]);}
			
			m2= m1%128+0x80
			d2= m1/128;
			if(value>16384 && value<2097151){ return new Buffer([m1, m2, d2]);}
			
			m3=m2%128+0x80;
			d3=m2/128;
			if(value>2097151){ return new Buffer([m1, m2, m3, d3]);}			
		};
		
		_this._encode = function(){
			logme.debug("_encode" );  
			var b2= _this._variableheader();
			return Buffer.concat([_this._fixedheader(_this._retain(b2.length)),  b2]);
		};	
		
		_this._subscribepayload = function(){
			logme.debug("_encode" );  
			msg=_this._data;
			var p = msg['payload'];
			var topics=[];
			var buffers=[];
			
			for (var i = 0; i < p.length ; i++) {
					topics[i]= p[i]['topicname'];
					buffers[i]= new Buffer(3+topics[i].length);
					buffers[i][0]= p[i]['lmsb'];
					buffers[i][1]= p[i]['llsb'];
					for(var j=0; j< topics[i].length; j++){
						buffers[i][j+2]= topics[i].charCodeAt(j);
					}
					buffers[i][2+topics[i].length]= p[i]['QoS'];					
			}
			return Buffer.concat(buffers);
		};
			
		_this._fixedheader = function(vhl){
			        logme.debug("_fixedheader" );  
				msg=_this._data;
				return   Buffer.concat( [ new Buffer([msg['msg_type'] + msg['retain']  + msg['QoS'] + msg['DUP'] ] ), vhl] )   ;
			};
			
		_this._variableheader = function(){
				logme.debug("_variableheader" );
				msg=_this._data;
			        // PINGRESP, PINGRESQ,  DISCONNECT
			        if( msg['msg_type'] >= 0xC0  &&  msg['msg_type'] <= 0xE0 ){
					return new Buffer(0);	
				} 
			        //PUBACK, PUBREC, PUBREL, PUBCOMP, UNSUBACK  // MSG_ID MSB  and MSG_ID LSB
				if( ( msg['msg_type'] <=0x70 && msg['msg_type'] >0x30) || (msg['msg_type'] == 0xB0) ){
					return (  new Buffer(   [msg['msgid_msb'], msg['msgid_lsb']]  ));
				} 
				// SUBACK, UNSUBSCRIBE [LIKE UNSUBACK BUT WITH PAYLOAD]
				if( ( msg['msg_type'] <=0xA0 && msg['msg_type'] >=0x90)  ){
					var payload = new Buffer(0);
					return (  Buffer.concat( [new Buffer([msg['msgid_msb'], msg['msgid_lsb']  ]),   payload])  );
				} 				
				// SUBSCRIBE [LIKE PUBACK BUT WITH PROTOCOL SPECIFIED PAYLOAD]
				if( ( msg['msg_type'] ==0x80)  ){
					return (  Buffer.concat( [new Buffer(   [msg['msgid_msb'], msg['msgid_lsb']]  ),   _this._subscribepayload()] )  );
				} 					
			        // PUBLISH  [LIKE PUBACK BUT : 1)  MSB/LSB+TOPIC_DATA 2) MSB/LDB FOR MSG_ID WHOSE presence depends on QoS, 3) PROTOCOL SPECIFIED PAYLOAD CONTAINS PUBLISHED DATA]
				if( ( msg['msg_type'] ==0x30)  ){
					topic = new Buffer(2+msg['topic'].length);
					topic[0]=0;
					topic[1]= msg['topic'].length;
					for (var i = 0; i < msg['topic'].length ; i++) {
						topic[i+2] = msg['topic'].charCodeAt(i);
					}
					
					var msgid= new Buffer(0) ;
					if( msg['QoS'] ==1 || msg['QoS'] ==2){
						var msgid= new Buffer(   [msg['msgid_msb'], msg['msgid_lsb']]  ) ;
					}
					
					var payload = new Buffer(msg['topicdata'].length); 
					for (var i = 0; i < msg['topicdata'].length ; i++) {
						payload[i] = msg['topicdata'].charCodeAt(i);
					}
					return (  Buffer.concat([topic, msgid, payload])  );
				} 	

			// CONNACK
			if( ( msg['msg_type'] ==0x20)  ){
				return new Buffer([  msg['reserved'], msg['return_code']  ]);
				}
							

			// CONNECT
			if( ( msg['msg_type'] ==0x10)  ){
				var pl= msg['protocolname'].length;
				// must build header depending on msg type
				variable_header = new Buffer(6 + pl);
				variable_header[0]= msg['protocolname_msb'];
				variable_header[1]= msg['protocolname_lsb'];	
				for (var i = 0; i < msg['protocolname'].length ; i++) {
				  variable_header[i+2] = msg['protocolname'].charCodeAt(i);
				}
				variable_header[2+pl]=msg['protocol_version'];
				variable_header[3+pl]=msg['connect_flags'];
				variable_header[4+pl]=msg['ka_msb'];
				variable_header[5+pl]=msg['ka_lsb'];
				var connectpayload = _this._connectpayload();
				console.log('connectpayload='+connectpayload);
				return Buffer.concat([variable_header, connectpayload]);
				}
			};
		
	
	return function(packet_data){
				_this._data=packet_data;
				logme.info("MQTT_Encoder :: [encoding]");
				_this._validate(); 
				var encoded = _this._encode(); 
				logme.info("MQTT_Encoder :: [done]");
				logme.info("Encoded message:"+ encoded);
				return encoded;
				};
	};
	
var mqtt_handler={
	
	pingresp: function(){
		default_msg={ 'msg_type' : 0xD0, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0}
		return mqtt_encode()(default_msg);
	},
	pingreq: function(){
		default_msg={ 'msg_type' : 0xC0, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0}
		return mqtt_encode()(default_msg);
	},
	disconnect: function(){
		default_msg={ 'msg_type' : 0xE0, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0}
		return mqtt_encode()(default_msg);
	},
	suback: function(){
		var default_msg={ 'msg_type' : 0x90, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0,
					    'msgid_msb' : 0x00, 'msgid_lsb' : 0x01}
		return mqtt_encode()(default_msg);
	},
	unsuback: function(){
		var default_msg={ 'msg_type' : 0xB0, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01}
		return mqtt_encode()(default_msg);
	},
	unsubscribe: function(){
		var default_msg={ 'msg_type' : 0xA0, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01}
		return mqtt_encode()(default_msg);
	},
	pubcomp: function(){
		var  default_msg={ 'msg_type' : 0x70, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01}
		return mqtt_encode()(default_msg);
	},
	puback: function(){
		var  default_msg={ 'msg_type' : 0x40, 'retain' : 0x00, 'QoS' : 0x01, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01}
		return mqtt_encode()(default_msg);
	},
	pubrec: function(params){
		var  default_msg={ 'msg_type' : 0x50, 'retain' : 0x00, 'QoS' : 0x01, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01};
		return mqtt_encode()(default_msg);
	},
	pubrel: function(newmsg){
		var  default_msg={ 'msg_type' : 0x60, 'retain' : 0x00, 'QoS' : 0x01, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01};
		return mqtt_encode()(new_msg(newmsg, default_msg));
	},
	publish: function(newmsg){
		var default_msg={ 'msg_type' : 0x30, 'retain' : 0x00, 'QoS' : 0x01, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01, 'topic' : '/ciao/bella', 'topicdata' : 'bellaciao' };
		return mqtt_encode()(new_msg(newmsg, default_msg));
	},
	subscribe: function(newmsg){
		var default_msg={ 'msg_type' : 0x80, 'retain' : 0x00, 'QoS' : 0x01, 'DUP' : 0x00, 'remain_length' : 0,
			'msgid_msb' : 0x00, 'msgid_lsb' : 0x01, 'payload': [{'lmsb' : 0x00, 'llsb' : 0x0B, 'topicname' : '/ciao/bella' , 'QoS' : 0x00}, 
			{'lmsb' : 0x00, 'llsb' : 0x0C, 'topicname' : '/ciao/bella2', 'QoS' : 0x00},
			{'lmsb' : 0x00, 'llsb' : 0x0C, 'topicname' : '/viva/lavida', 'QoS' : 0x01}			]  };
		return mqtt_encode()(new_msg(newmsg, default_msg));
	},
	connect: function(newmsg){
		var default_msg={ 'msg_type' : 0x10, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00,
				'remain_length' : 12, 'protocolname_msb' : 0x00, 'protocolname_lsb'   : 0x06, 'protocolname': 'MQIsdp',
				'protocol_version' : 0x03, 'connect_flags': 0xCF, 'ka_msb': 0x00, 'ka_lsb' : 0x0A,
			        'client_identifier' : 'marameo', 'username' : 'username', 'password' : 'password',
				'willtopic' : 'cemetery', 'willmessage' : 'yesiamdefunct' 
			     };
		return mqtt_encode()(new_msg(newmsg, default_msg));
	},

	connack: function(newmsg){
		var default_msg={ 'msg_type' : 0x20, 'retain' : 0x00, 'QoS' : 0x00, 'DUP' : 0x00,
				'remain_length' : 0x02, 'reserved': 0xFF, 'return_code': 0x01     //0x00 -> 0x05
			};
		return mqtt_encode()(new_msg(newmsg, default_msg));
	}
	
}


	

	
exports.encode = mqtt_encode();	
exports.encode_msg = mqtt_handler;	
 
