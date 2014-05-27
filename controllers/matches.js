module.exports = {
  list: function(req, res, next) {
    Match.find().exec(function(err, matches) {
      res.provide( err, matches , {
        template: 'matches'
      });
    });
  },
  byProfile: function(req, res, next) {
    Person.findOne({ _id: req.param('userID') }).exec(function(err, person) {
      
    });
  }
}
