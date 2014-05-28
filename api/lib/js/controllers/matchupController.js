function spec(b) {
  var Matchup = b.Matchup || require('../schemas/matchup').class();
  var matchupMonitor = b.MatchupMonitor || require('../matchupMonitor').new();
  //var Wallet = b.Wallet || require('../schemas/wallet').class();
  var config = require('../config');

  var MatchupController = function(app) {
    this.app = app;
  }

  MatchupController.prototype.create = function(req, res) {
    var self = this;

    var matchup = new Matchup();
    //var wallet = new Wallet();

    //matchup.wallet = wallet._id;
    matchup.name = req.body['name'];
    matchup.region = req.body['region'];
    matchup.start = req.body['start'] || Date.now();
    matchup.winCondition = req.body['winCondition'];
    matchup.results = {};
    //matchup.owner = req.body['owner']

    if (!matchup.region) {
      return res.send(500, "must supply a region");
    }
    matchup.generatePrivateToken();
    matchup.generatePublicToken();
    
    matchup.save(function(err){
      return res.send(200, self._filter(matchup, 'privateToken'));
    });  
  };

  MatchupController.prototype.join = function(req, res) {
    var self = this;
    var token = req.params['token'];
    var filters = {};
    var type;

    if (token.length == 22){
      type = 'privateToken';
    } else {
      return res.send(404);
    }

    filters[type] = token;

    Matchup.findOne(filters, function(err, matchup){
      if (err) console.log(err);
      if(matchup){
        var bitcoinAddress = req.body.bitcoinAddress;

        if (!bitcoinAddress) {
          return res.send(500, "You must specify a bitcoin address");
        }

        var params = {
          name: req.body.name,
          realm: req.body.realm,
          webId: req.body.webId,
          region: matchup.region,
        };

        var playerRegistered;
        matchup.players.forEach(function(existingPlayer) {
          if (params.webId == existingPlayer.webId && params.name == existingPlayer.name) {
            playerRegistered = true;
          }
        });

        if (playerRegistered) {
          return res.send(500, "player already joined");
        } else {
          if (matchup.players.length > config.max_match_size) {
            return res.send(500, "matchup is full");
          }

          matchupMonitor.getPlayerData(params, function(err, player) {
            if (err || !player) {
              console.log("player not found " + player);
              return res.send(404, "player not found");
            }

            player.wins = 0;
            matchup.players.push(player);
            matchup.save(function(err){
            if(err) {
              console.log("error saving matchup: " + err);
              return res.send(500);
            }
            return res.send(200, "player joined");
            });
          });
        }
      } else {
        return res.send(404, "matchup not found.");
      }
    }); 
  };

  MatchupController.prototype.get = function(req, res) {
    var self = this;
    var token = req.params['token'];
    var filters = {};
    var type;

    if(token.length == 20){
      type = 'publicToken';
    } else if (token.length == 22){
      type = 'privateToken';
    } else {
      res.send(404);
    }

    filters[type] = token;

    Matchup.findOne(filters, function(err, matchup){
      if (err) console.log(err);
      if(matchup){
        // Update the matchup (until we build a cron job to do it).
        if(matchup.start < Date.now() && matchup.players.length > 1) {
          matchupMonitor.updateMatchup(matchup, function(err, matchup) {
            if (err) {
              console.log(err);
              return res.send(500, "error updating matchup");
            }
            return res.send(self._filter(matchup, type));
          });
        } else {
          console.log("match hasn't started");
          return res.send(self._filter(matchup, type));
        }     
      } else {
        return res.send(404, "matchup not found.");
      }
    });
  };

  MatchupController.prototype._filter = function(matchup, type){
    m = matchup.toObject();
    delete m["_id"];
    delete m["__v"];
    if (type === "publicToken"){
      delete m["privateToken"];
    }
    return m;
  }

  return MatchupController;
}

module.defineClass(spec);