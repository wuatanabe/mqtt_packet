var encode= require('mqtt_packet').mqtt_encode_msg.encode_msg;
var decode= require('mqtt_packet').mqtt_decode_msg;


var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });

// Load the TCP Library
net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var net = require('net');

var HOST = '127.0.0.1';
var PORT = 1883;

var client_status='DISCONNECTED';

var client = new net.Socket();
client.connect(PORT, HOST, function() {

	console.log('Connected to: ' + HOST + ':' + PORT);
	var connect_msg= encode.connect();
	client.write(connect_msg); 

});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
    
     logme.debug('DATA: ' + data);
    var msg_type= decode.decode(data)['msg_type']
    logme.debug("msg_type="+msg_type);
    if(msg_type == 2){
	    client_status = 'CONNECTED';
	     logme.debug("PUBLISHING");
	    client.write(encode.publish());
	    }
    if(msg_type == 4){
	     logme.debug("SUBSCRIBING");
	    client.write(encode.subscribe());
	    }    
    if(msg_type == 9){
	     logme.debug("UNSUBSCRIBING");
	    client.write(encode.unsubscribe());
	    }   
    if(msg_type == 11){
	     logme.debug("UNSUBACK RECEIVED");
	    }    
    //client.write(encode.disconnect());
    // Close the client socket completely
    //client.destroy();
    
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
     logme.info('Connection closed');
});