var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

// this defines the fields associated with the model,
// and moreover, their type.
var MatchSchema = new Schema({
    id: { type: String , required: true }
  , players: [ { type: ObjectId, ref: 'Person' } ]
  , date: { type: Date }
  , type: { type: String , enum:['CO_OP', 'TWOS'] }
  , speed: { type: String , enum:['FASTER'] }
});

var Match = mongoose.model('Match', MatchSchema);

// export the model to anything requiring it.
module.exports = {
  Match: Match
};
