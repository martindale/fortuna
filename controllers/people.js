module.exports = {
  list: function(req, res, next) {
    People.find().exec(function(err, people) {
      res.provide( err, people , {
        template: 'people'
      });
    });
  },
  viewBySlug: function(req, res, next) {
    People.findOne({ slug: req.param('usernameSlug') }).exec(function(err, person) {
      if (err || !person) { return next(); }
      res.redirect('/people/' + person._id );
    });
  },
  view: function(req, res, next) {
    People.findOne({ _id: req.param('personID') }).populate('matches._match').exec(function(err, person) {
      
      var profile = person.profiles.battlenet[0];
      // TODO: not hardcode this
      rest.get('http://us.battle.net/api/sc2/profile/' + profile.id + '/' + profile.realm + '/' + profile.name + '/matches'  ).on('complete', function(data) {
        
        console.log(data);
        
        async.parallel( data.matches.map( function(match) {
          return function(done) {
            var key = require('crypto').createHash('sha1');
            for (var k in match) {
              console.log(k);
              key.update( match[ k ].toString() );
            }
            var id = key.digest('hex');
            
            var obj = new Match({
                id: id
              , date: match.date
              , type: match.type
              , speed: match.speed
            });
            
            obj.save(function(err) {
              if (err) { return done(err); }
              
              if ( person.matches.map(function(x) {
                console.log(x);
                return x._match.id;
              }).indexOf( id ) < 0 ) {
                person.matches.push({
                    _match: obj._id
                  , date: match.date
                  , outcome: match.decision
                });
              }
              
              person.save( done );
            });
            
          };
        } ) , function(err, results) {
          
          if (err) { console.log(err); }
          
          res.provide( err, person , {
            template: 'person'
          });
        } );
      });
      
      

    });
  },
  // TODO: real login
  battlenetLogin: function(req, res, next) {
    
    var url = require('url').parse( req.param('battlenetURL') );
    var parts = url.path.split('/');

    var profile = {
        region: url.host.split('.')[0]
      , id: parts[4]
      , realm: parts[5]
      , name: parts[6]
    }
    
    if (!profile.id || !profile.realm || !profile.name) {
      req.flash('error', 'That does not look like a valid profile URL.');
      return res.redirect('back');
    }
    
    // TODO: add asian support
    switch (profile.region) {
      case 'us':
        var host = 'us.battle.net'
      break;
      default:
        var host = 'us.battle.net'
      break;
    }
    
    rest.get('http://' + host + '/api/sc2/profile/' + profile.id + '/' + profile.realm + '/' + profile.name + '/'  ).on('complete', function(data) {
      console.log(data);
      
      Person.findOne({ 'profiles.battlenet.id': profile.id }).exec(function( err , person ) {
        if (err) { return next(err); }

        if (!person) {
          var person = new Person({
            username: profile.name,
            profiles: {
              battlenet: [ profile ]
            }
          });
        }
        
        person.save(function(err) {
          if (err) {
            req.flash('error', JSON.stringify(err) )
            return res.redirect('back');
          }
          return res.redirect('/people/' + person._id );
        });
        
      });
    });
  }
}
