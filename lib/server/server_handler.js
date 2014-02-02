var MQTTServer = require('./server.js');

var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });

// create an instance of MQTTServer 
var server_handler = new MQTTServer();

// flag to disable builtin listeners on emitter
// useful when adding custom listeners
server_handler.builtin_handlers={
	'subscribe_received_event' : true,
	'suback_sent_event' : true
	};
	
// EventEmitters inherit a single event listener, see it in action
server_handler.on('newListener', function(listener) {
        logme.debug('New Event Listener added: ' + listener);
    });
    
server_handler.on('subscribe_received_event', function(socket) {
	if(server_handler.builtin_handlers['subscribe_received_event'] == true){
		logme.debug(socket);
		}
	});

server_handler.on('suback_sent_event', function(socket) {
	if(server_handler.builtin_handlers['suback_sent_event'] == true){
		logme.debug(socket);
	}	
	});

	


module.exports = server_handler;
