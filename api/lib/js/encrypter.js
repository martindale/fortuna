function spec(b) {
  var crypto = b.crypto || require('crypto');
  var defaultKey = b.defaultKey || require('./config').credentials.encKey;
  var base58 = b.base58 || require('base58-native');
  var ObjectId = b.ObjectId || require('mongoose').Types.ObjectId;

  function Encrypter(key) {
    this.key = key || defaultKey;
  };

  Encrypter.prototype.deprecatedInternId = function(str) {
    if(str.length == 24) return str; //assume it's already internalized
    var tmp = str.replace(/_/g,'/');
    var tmp = tmp.replace(/\-/g,'+');
    return this.decode(tmp, 'base64');
  };

  Encrypter.prototype.internId = function(str, callback) {
    if(typeof str != 'string') {
      callback && callback(false);
      return 'invalid_id';
    }
    try {
      var aes256 = crypto.createDecipher('aes-256-cbc', this.key);
      var a = aes256.update(base58.decode(str));
      var b = aes256.final();
      var buf = new Buffer(a.length + b.length);
      a.copy(buf, 0);
      b.copy(buf, a.length);
      if(callback) callback(false);
      return new ObjectId(buf.toString('binary'));
    } catch(e) {
      if(callback) callback(true);
      try {
        return this.deprecatedInternId(str);
      } catch(e) {
        callback && callback(false);
        return 'invalid_id';
      }
    }
  };
  Encrypter.prototype.internID = Encrypter.prototype.internId;

  Encrypter.prototype.externId = function(objectId) {
    if(typeof objectId == 'string') objectId = new ObjectId(objectId);
    var aes256 = crypto.createCipher('aes-256-cbc', this.key);
    var a = aes256.update(new Buffer(objectId.id, 'binary'));
    var b = aes256.final();
    var buf = new Buffer(a.length + b.length);
    a.copy(buf, 0);
    b.copy(buf, a.length);
    return base58.encode(buf);
  };
  Encrypter.prototype.externID = Encrypter.prototype.externId;

  // decode a aes256 base64 string
  Encrypter.prototype.decode = function(code, encoding) {
    encoding = encoding ? encoding : 'base64';
    var aes256 = crypto.createDecipher('aes-256-cbc', this.key);
    var answer = aes256.update(code, encoding, 'utf8');
    try {
      answer += aes256.final('utf8');
      return answer;
    } catch(e) {
      return null;
    }
  };

  // encode a string with aes256 to base64
  Encrypter.prototype.encode = function(aString, encoding) {
    encoding = encoding ? encoding : 'base64';
    var aes256 = crypto.createCipher('aes-256-cbc', this.key);
    var answer = aes256.update(aString, 'utf8', encoding);
    answer += aes256.final(encoding);
    return answer;
  };

  Encrypter.prototype.externString = function(str) {
    var aes256 = crypto.createCipher('aes-256-cbc', this.key);
    var a = aes256.update(str, 'utf8');
    var b = aes256.final();
    var buf = new Buffer(a.length + b.length);
    a.copy(buf, 0);
    b.copy(buf, a.length);
    return base58.encode(buf);
  };

  Encrypter.prototype.internString = function(str) {
    try {
      var aes256 = crypto.createDecipher('aes-256-cbc', this.key);
      var a = aes256.update(base58.decode(str));
      var b = aes256.final();
      var buf = new Buffer(a.length + b.length);
      a.copy(buf, 0);
      b.copy(buf, a.length);
      return buf.toString('utf8');
    } catch(e) {
      return this.deprecatedInternId(str);
    }
  };

  Encrypter.prototype.uid = function(len) {
    return base58.encode(crypto.randomBytes(Math.ceil(len * 3 / 4)));
  };

  return Encrypter;
};
module.defineClass(spec);
