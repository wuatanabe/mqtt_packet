var encode= require('mqtt_packet').mqtt_encode_msg.encode_msg;
var decode= require('mqtt_packet').mqtt_decode_msg;


var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });

function prettyJSON(obj) {
    logme.debug(JSON.stringify(obj, null, 2));
}

// Load the TCP Library
net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


// Track the clients
var clients = [];
var clients_connected = [];
 
 var topics =[];
 var subsciptions = [];
 
//# Message types
//~ CONNECT = 0x10
//~ CONNACK = 0x20
//~ PUBLISH = 0x30
//~ PUBACK = 0x40
//~ PUBREC = 0x50
//~ PUBREL = 0x60
//~ PUBCOMP = 0x70
//~ SUBSCRIBE = 0x80
//~ SUBACK = 0x90
//~ UNSUBSCRIBE = 0xA0
//~ UNSUBACK = 0xB0
//~ PINGREQ = 0xC0
//~ PINGRESP = 0xD0
//~ DISCONNECT = 0xE0
 
 
 
// MQTT Server
var MQTTServer = function(){
	 
  var self = this;	
  self.bubble_events= true;	
  self.server = net.createServer(function (socket) {
  
 
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
  logme.info("MQTTServer :: socket.name= "+socket.name);

  
 
  // Handle incoming messages from clients
  socket.on('data', function (data) {
	logme.info("MQTTServer<- received "+data);
	var buff = new Buffer(data, 'utf8');

	var ptype =decode.decode(data)['msg_type'];  
	logme.info("msg_type="+ptype);
	  switch (ptype){
	  case 1:  send_connack(socket, ptype, 'CONNECT', 'CONNACK');
			clients_connected.push(socket.name); 
		        logme.info("MQTTServer :: connected clients= "+clients_connected.length);
			break;
		
	  case 3:  send_puback(socket, ptype, data, 'PUBLISH', 'PUBACK');
			break;
		
	  case 5:  send_pubrel(socket, ptype, 'PUBREC', 'PUBREL');
			break;
		
	  case 6:  send_pubcomp(socket, ptype, 'PUBREL', 'PUBCOMP');
			break;
	  
	  case 7: received_pubcomp(socket, ptype, 'PUBCOMP');
		         break;
		
	  case 8: send_suback(socket, ptype, data, 'SUBSCRIBE', 'SUBACK');	
			break;
		
	  case 10: send_unsuback(socket, ptype, data, 'UNSUBSCRIBE', 'UNSUBACK');	
			break;
			
	  case 14: send_pingresp(socket, ptype, 'PINGREQ', 'PINGRESP');  
			break;
			
	  case 15: send_disconnect(socket, ptype, 'DISCONNECT');  
			clients_connected.splice(clients_connected.indexOf(socket.name), 1);	
			logme.info("MQTTServer :: connected clients= "+clients_connected.size);
			break;
			
	  default: received_unknown(socket, ptype, 'UNKNOWN');
	}
		
	});
 
  // Remove the client from the list when it leaves
  socket.on('end', function () {
    logme.info("MQTTServer :: <end> received from socket="+socket.name);	  
    clients.splice(clients.indexOf(socket), 1);
    clients_connected.splice(clients_connected.indexOf(socket.name), 1);	
    logme.info("MQTTServer :: connected clients= "+clients_connected.length);	  
    broadcast(socket.name + " left.\n");
	});
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't send to the sender
      if (client === sender) return;
      client.write(message);
    });
     // Log it to the server output too
	logme.info(message)
  }
  
  function send_connack(socket, ptype, MSG, REPLY_MSG){
	  conditional_emit('connect_received_event', socket);
	  socket.write( encode.connack());
	  conditional_emit('connack_sent_event', socket);
	  logme.info("MQTTServer-> sent "+REPLY_MSG);
	  }
 
  function send_pingresp(socket, ptype, MSG, REPLY_MSG){
	  conditional_emit('pingreq_received_event', socket);
	  socket.write( encode.pingresp());
	  conditional_emit('pingresp_sent_event', socket);
	  logme.info("MQTTServer-> sent "+REPLY_MSG);
	  }

  function send_puback(socket, ptype, data, MSG, REPLY_MSG){
	  conditional_emit('publish_received_event', socket);
	  var dcdd = decode.decode(data);
	  prettyJSON(dcdd);
	  socket.write(encode.puback());
	  conditional_emit('puback_sent_event', socket);
	  logme.info("MQTTServer-> sent "+REPLY_MSG);
	}
		
	  
	  
  function send_suback(socket, ptype, data, MSG, REPLY_MSG){
          conditional_emit('subscribe_received_event', socket);
	  var dcdd = decode.decode(data);
	  prettyJSON(dcdd);
	  socket.write(encode.suback());
	  conditional_emit('suback_sent_event', socket);
	  logme.info("MQTTServer-> sent "+REPLY_MSG);
	  }	  

  function send_unsuback(socket, ptype, MSG, REPLY_MSG){
	  socket.write(encode.unsuback());
	  conditional_emit('disconnect_sent_event', socket);
	  logme.info("MQTTServer-> sent "+REPLY_MSG);
	  }
	  
  function send_disconnect(socket, ptype, MSG, REPLY_MSG){
	  socket.write(encode.disconnect());
	  conditional_emit('disconnect_sent_event', socket);
	  logme.info("MQTTServer-> sent "+REPLY_MSG);
	  }
	  
 function conditional_emit(emitted_event, emit_params){
	 if(self.bubble_events == true){
						self.emit(emitted_event,  emit_params);
						}
	 }	  


});
 
	// Put a friendly message on the terminal of the server.
	logme.info("MQTTServer> started at port 1883\n");
};

util.inherits(MQTTServer, EventEmitter);
module.exports = MQTTServer;