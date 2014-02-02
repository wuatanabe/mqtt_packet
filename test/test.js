var mocha = require('mocha');
var assert = require('assert');
var a = 'ABC'; 

describe('some feature', function() {    
		before(function runBefore() {    
					console.log('running before function...');  
				});
				
		  it('should do A', function() {    
			  console.log('test A');  
			  assert.equal(a, 'ABD');
			  });
		  it('should do B', function() {    console.log('test B');  
			  assert.equal(a, 'ABC');
			  }); 
	  }); 