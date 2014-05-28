function spec(b) {
  var http = require('http');
  var path = require('path');
  var config = require('./js/config');

  var API = function() {
    var server = require('./js/server');
    var router = require('./js/router').new();
    console.log('Started API Server listening on port ' + config.port + '.');
  }

  return API;  
}

module.defineClass(spec);