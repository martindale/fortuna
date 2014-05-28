function spec(b) {
  var server = b.server || require('./server');
  var config = require('./config');
  var MatchupController = b.MatchupController || require('./controllers/matchupController').class();

  var Router = function() {
    var MC = new MatchupController();

    server.post('/api/matchups/new', MC.create.bind(MC));
    server.post('/api/matchups/:token/join', MC.join.bind(MC));
    server.get('/api/matchups/:token', MC.get.bind(MC));

  };

  return Router;
}

module.defineClass(spec);