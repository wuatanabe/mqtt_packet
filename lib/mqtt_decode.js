var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });

var mqtt_decode = function(){

		_this = this;
		_this.decoded={};
	
		_this._validate = function(){
		logme.debug("from this.validate="+_this._data['Qos']);  
		};
		
		_this._decode = function(){
			logme.debug("_decode" );  
			_this.decoded['msg_type']= _this._extract_ptype();
			 logme.debug("message type is="+_this._ptype);
			_this._extract_fixedheader();
			if(_this.decoded['remain_length'] >0){
				_this._extract_variableheader();
			}
		};	
		
		_this._extract_ptype = function(){
				logme.debug("_extract_ptype" );  
				return _this._data[0]>>4;
			};
			
		_this._extract_fixedheader = function(){
				logme.debug("_extract_fixedheader" );  
				_this.decoded['DUP']= 	_this._data[0] & 0x08;
				_this.decoded['retain']=	_this._data[0] & 0x01;
				_this.decoded['QoS']=	_this._data[0] & 0x06;
				_this.decoded['remain_length']= _this._data[1];
				
			};

		_this._extract_variableheader = function(){
				logme.debug("_extract_variableheader" );
				//PINGRESP, PINGREQ,  DISCONNECT
				if(_this.decoded['msg_type']>=12 && _this.decoded['msg_type']<=14){
					return;

				};	

				//CONNECT
				if(_this.decoded['msg_type']==1){
					var b0 = _this.decoded['lmsb']= _this._data[2];
					var b1 = _this.decoded['llsb']=   _this._data[3];
					var protocoldata = _this._data.slice(4, 4+b1);
					var offset= 4+ b1+b0*128;
					_this.decoded['protocol_version_number']= _this._data[offset]; 
					_this.decoded['connect_flags']= _this._data[offset+1];
					_this.decoded['ka_msb']= _this._data[offset+2];
					_this.decoded['ka_lsb']= _this._data[offset+3];
					_this.decoded['connect_payload']= _this._extract_connect_payload( _this._data.slice(offset+4 ));	
				};				
			
				//CONNACK
				if(_this.decoded['msg_type']==2){
					_this.decoded['reserved']= 	_this._data[2];
					_this.decoded['return_code']=  _this._data[3];

				};
								
				
				if(_this.decoded['msg_type']>3 && _this.decoded['msg_type']<=7){
					var b0 = _this.decoded['msgid_msb']= 	_this._data[2];
					var b1=  _this.decoded['msgid_lsb']=  	_this._data[3];

				};


				//PUBLISH
				if(_this.decoded['msg_type']==3){
					_this.decoded['msgid_msb']= _this._data[2];
					_this.decoded['msgid_lsb']=  _this._data[3];
					_this._publish_payload();
				};				
				
				//SUBSCRIBE
				if(_this.decoded['msg_type']==8){
					_this.decoded['msgid_msb']= 	_this._data[2];
					_this.decoded['msgid_lsb']=  _this._data[3];
					_this._subscribe_payload();
				};						
			};
		
		_this._subscribe_payload= function(){
				_this.decoded['payload']=[];
				var size= _this.decoded['remain_length'];
				var payload= _this._data.slice(4,_this._data.length);
				var i= 0, p= 0;
				while( p<( size-6) ){
					var b0= payload[p+0];
					var b1= payload[p+1];
					_this.decoded['payload'][i]={'topicname': payload.slice(p+2,  p+2+b1+b0*128).toString(), 'QoS' : payload[p+2+b1+b0*128]};
					p= p+3+b1+b0*128;
					i++;
				}
				
		}

		_this._publish_payload= function(){
				_this.decoded['payload']=[];
				var size= _this.decoded['remain_length'];
				var payload= _this._data.slice(2,_this._data.length);
				var b0= payload[0];
				var b1= payload[1];
				_this.decoded['topicname']= payload.slice(2,  2+b1+b0*128).toString();
				_this.decoded['payload']= payload.slice(2+b1+b0*128).toString() ;
				}		

		_this._extract_connect_payload= function(p){
			        _this._innerpayload=p;
				_this.decoded['connect_payload']=[];
				_this.decoded['username_flag']=_this.decoded['connect_flags'] & 0x80;
				_this.decoded['password_flag']=_this.decoded['connect_flags'] & 0x40;
				_this.decoded['will_retain_flag']=_this.decoded['connect_flags'] & 0x20;
				_this.decoded['QoS_flag']=_this.decoded['connect_flags'] & 0x18;
				_this.decoded['will_flag']=_this.decoded['connect_flags'] & 0x04;
				_this.decoded['cleansession_flag']=	_this.decoded['connect_flags']  & 0x02;
				_this.decoded['unused']=_this.decoded['connect_flags'] & 0x00;
				 logme.inspect(_this.decoded['will_flag']);
				var psize = _innerpayload.length;
				var offset=0;
                                _this.decoded_payload ={};
				offset=_this.connect_slice(psize, offset , 'client_identifier', 1, 1);
				offset=_this.connect_slice(psize, offset , 'willtopic', _this.decoded['will_flag'], 1);	
				offset=_this.connect_slice(psize, offset , 'willmessage', _this.decoded['will_flag'], 1);	
				offset=_this.connect_slice(psize, offset , 'username',_this.decoded['username_flag'],128); 
				offset=_this.connect_slice(psize, offset , 'password',_this.decoded['password_flag'], 64);
				logme	
				logme.inspect(_this.decoded_payload);
				
				return _this.decoded_payload;
				}
	
	_this.connect_slice = function(total_size, start, key, flag, flagvalue){
				if(flag == flagvalue){
					 logme.debug('key='+key);
					if(total_size> start){
						var fill="";
						var p1= _this._innerpayload[start];
						var p0= _this._innerpayload[start+1];
						var internal_offeset= start;
						for(i=0; i<p0+p1*128; i++){
							fill=	fill +String.fromCharCode(_this._innerpayload[i+internal_offeset+2]);
							start++;
							}					
						}
					  logme.debug('value='+fill);
					_this.decoded_payload[key]=fill;
					return (start+2);	
					}
				return start;	
					
		}
				
	return function(packet_data){
				_this._data= new Buffer(packet_data);
				logme.debug("MQTT_Decoder :: [decoding]");
				_this._validate(); 
				_this._decode(); 
				logme.debug(_this._data['Qos']);  
				logme.debug("MQTT_Decoder :: [done]");
				var decoded = _this.decoded;
		                _this.decoded={};
				return decoded;
				};
	};
	


exports.decode=mqtt_decode();
