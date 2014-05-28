function spec(b) {
  var rest = b.restler || require('restler');
  var _ = b.underscore || require('underscore');
  var async = require('async');

  function MatchupMonitor() {

  };

  MatchupMonitor.prototype.updateMatchup = function(matchup, callback) {
    var self = this;
    self._getMatches(matchup.players, function(err, matches) {
      if (err) {
        console.log("Error getting matches" + err);
        if (callback) {
          return callback(err);
        }
      }
      if (matches) {
        var validMatches = self._pruneMatches(matches);
        matchup.updateMatches(validMatches, function(err){
          if(err) console.log(err);
          matchup.save(function(err) {
            if (err) {
              console.log(err);
              if (callback) {
                return callback(err);
              }
            }
            if(callback) {
              return callback(null, matchup);
            }
          });
        });
      } else {
        if(callback) {
          console.log("no matches");
          return callback(null, null);
        }
      }
      
    });
  };

  MatchupMonitor.prototype.getLatestMatches = function(player, callback) {
    var URL = 'http://' + player.region + '.battle.net/api/sc2/profile/' + player.webId + '/' + player.realm + '/' + player.name + '/matches';
    rest.get(URL).on('complete', function(data) {
      return callback(null, data);
    });
  };

  MatchupMonitor.prototype.getPlayerData = function(player, callback) {
    var URL = 'http://' + player.region + '.battle.net/api/sc2/profile/' + player.webId + '/' + player.realm + '/' + player.name + '/';
    rest.get(URL).on('complete', function(data) {
      if (data.code == 404) {
        return callback(null, null);
      }
      var response = {
        webId: data.id,
        realm: data.realm,
        region: player.region,
        name: data.displayName,
        portrait: data.portrait,
        career: data.career,
        swarmLevels: data.swarmLevels,
        clan: data.clanName,
        clanTag: data.clanTag,
        profile: data.profilePath,
      }
      return callback(null, response);
    });
  };

  MatchupMonitor.prototype._getMatches = function(players, callback) {
    var self = this;
    var matches = [];
    async.forEach(players, function(player, next) {
      self.getLatestMatches(player, function(err, data) {
        if (err) console.log(err);
        if (data) {
          data.player = player.webId;
          matches.push(data);
        }
        next();
      });
    }, function(err) {
      if (err) {
        console.log(err);
        return callback(err);
      } else {
        return callback(null, matches);
      }
    });
  };

  MatchupMonitor.prototype._pruneMatches = function(playerResults) {
    var prunedMatches = {};
    
    // Consolidate match data.
    playerResults.forEach(function(playerResult) {
      playerResult.matches.forEach(function(match) {
        if(prunedMatches[match.date]) {
          prunedMatches[match.date].results.push({
            player: playerResult.player,
            result: match.decision
          });
        } else {
          prunedMatches[match.date] = {
            map: match.map,
            type: match.type,
            results: [
              {
                player: playerResult.player,
                result: match.decision
              }
            ]
          }
        }
      });
    });

    var keys = _.keys(prunedMatches);

    // Delete matches that don't include all players.
    keys.forEach(function(date) {
      if(prunedMatches[date].results && prunedMatches[date].results.length < playerResults.length) {
        delete prunedMatches[date];
      }
    });
    
    return prunedMatches;
  };

  return MatchupMonitor;
};
module.defineClass(spec);
