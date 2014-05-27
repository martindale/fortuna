var config = {
  port: 3000,
  prefix: '/api',
  dbURI: 'mongodb://localhost/api',
  credentials: {
    encKey: "winter is coming",
  },
  max_match_size: 8,
};

module.exports = config;