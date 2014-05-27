var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId
  , passportLocalMongoose = require('passport-local-mongoose')
  , slug = require('mongoose-slug');

// this defines the fields associated with the model,
// and moreover, their type.
var UserSchema = new Schema({
    username: { type: String, required: true }
  //, email: { type: String, required: true }
  , created: { type: Date, required: true, default: Date.now }
  , matches: [ new Schema({
        _match:  { type: ObjectId , ref: 'Match' , required: true }
      , date:    { type: Number , required: true }
      , outcome: { type: String , enum: ['WIN', 'LOSS'] , required: true }
    }) ]
  , profiles: {
      battlenet: [ new Schema({
          id: { type: Number , required: true }
        , realm: { type: Number , required: true }
        , name: { type: String , required: true }
      }) ]
    }
});

// attach the passport fields to the model
UserSchema.plugin(passportLocalMongoose);

// attach a URI-friendly slug
UserSchema.plugin( slug( 'username' , {
  required: true
}) );

var User = mongoose.model('User', UserSchema);

// export the model to anything requiring it.
module.exports = {
  User: User
};
