var rest = require('restler');

var base = "http://chaz.bp:3000/api/matchups/";

var minute = 60000;
var d = new Date();
d.setDate(d.getDate() - 1);
var matchup = { region: "us", start: d };

var chaz = {
  name: "Muse",
  realm: "1",
  webId: "2549153",
  bitcoinAddress: "12345"
}

var eric = {
  name: "remaeus",
  realm: "1",
  webId: "3866178",
  bitcoinAddress: "12345"
}

var rob = {
  name: "unusualbob",
  realm: "1",
  webId: "5356317",
  bitcoinAddress: "12345"
}


rest.post(base + "new", {data: matchup }).on('complete', function(match, response) {
  console.log(match);
  rest.post(base + match.privateToken + "/join", {data: chaz}).on('complete', function(data, response) {
    console.log(data);
    rest.post(base + match.privateToken + "/join", {data: eric}).on('complete', function(data, response) {
      console.log(data);
      rest.post(base + match.privateToken + "/join", {data: rob}).on('complete', function(data, response) {
        console.log(data);
        rest.get(base + match.privateToken + "/").on('complete', function(data, response) {
          console.log(data);
        });
      });
    });
  });
});