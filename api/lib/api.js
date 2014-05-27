function spec(b) {
  var http = require('http');
  var path = require('path');
  var config = require('./api/config');

  var API = function() {
    var server = require('./api/server');
    var router = require('./api/router').new();
    console.log('Started API Server listening on port ' + config.port + '.');
  }

  return API;  
}

module.defineClass(spec);