function spec(b) {
  var mongoose = require('mongoose');
  var ObjectID = require('mongodb').ObjectID;
  var Schema = mongoose.Schema;
  var Hashids = require("hashids");
  var config = require('../config');
  var hashids = new Hashids(config.credentials.encKey);
  var Encrypter = require('../encrypter').class();
  var encrypter = new Encrypter();
  var _ = b.underscore || require('underscore');

  var Matchup = new Schema({
    privateToken: {type: String, unique: true}, // to register players
    publicToken: {type: String, unique: true}, // For public data
    name: {type: String, default: "SC2 Matchup"},
    region: {type: String, default: "us"},
    players: Array,
    //wallet: {type: ObjectID, unique: true},
    //owner: {type: ObjectId, index: true},
    start: Date,
    ended: {type: Boolean, default: false},
    winCondition: {type: Number, default: 3},
    results: Object,
    winners: Array,
  });

  Matchup.methods.generatePrivateToken = function() {
    this.privateToken = encrypter.externId(this._id);
  };

  Matchup.methods.generatePublicToken = function() {
    this.publicToken = hashids.encryptHex(this._id);
  };

  Matchup.methods.updateMatches = function(matches, callback) {
    var self = this;
    var keys = _.keys(matches);
    keys.forEach(function(matchTime) {
      if(!matches[matchTime] || new Date(matchTime) < self.start) {
        delete matches[matchTime];
      } else {
        if(!self.results) {
          self.results = {};
        }
        if(!self.ended) {
          self.results[matchTime] = matches[matchTime];
          matches[matchTime].results.forEach(function(result) {
            self.players.forEach(function(player) {
              if (player.webId == result.player && result.result === "WIN") {
                player.wins ++;
              }
            });
            self.players.forEach(function(player) {
              if (player.wins >= self.winCondition) {
                self.ended = true;
              }
            });
          });
        }
      }
    });  

    if(self.ended) {
      self.players.forEach(function(player) {
        if (player.wins >= self.winCondition) {
          self.winners.push(player);
        }
      });
    }     

    return callback(null);
  };

  return Matchup = mongoose.model('Matchup', Matchup);
};

module.defineClass(spec);