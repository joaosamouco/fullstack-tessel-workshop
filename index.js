var tessel = require('tessel');
var servolib = require('servo-pca9685');
var twitter = require('twitter');

// These OAuth credentials are for the dummy @TesselTweet account
// Paste in your own OAuth details if you want to tweet from your own account
var client = new twitter({
  consumer_key: 'O7oc0pvsZn4xjgcuHuYdX4FaC',
  consumer_secret: 'iJYuHFz2sD46Nvk3mcwzX8uih14aEAMgVWdWoR59nx8v6Zl7ZX',
  access_token_key: '2529232909-luARGU89K4CKFMvfzBjCgG6ubefzDkdDWkSB85i',
  access_token_secret: 'GXQfuzvGdjLEs3t1HEYfhQ9x9bdBcSBVXjBkbRgwYlOE0'
});

var servo = servolib.use(tessel.port['A']);

var servo1 = 1; // We have a servo plugged in at position 1

var teamA = 0;
var teamB = 0;

var point = 0.1;
var position = 0.5;  //  Target position of the servo between 0 (min) and 1 (max).

var gameOver = false;

servo.on('ready', function () {
  console.log('Servo is ready.');
  //  Set the minimum and maximum duty cycle for servo 1.
  //  If the servo doesn't move to its full extent or stalls out
  //  and gets hot, try tuning these values (0.05 and 0.12).
  //  Moving them towards each other = less movement range
  //  Moving them apart = more range, more likely to stall and burn out
  servo.configure(servo1, 0.04, 0.12, function () {
    servo.move(servo1, position);

    setInterval(function () {
      if (teamA > teamB) {
        position += point;
      } else if (teamA < teamB) {
        position -= point;
      }
      console.log(position);
      if (position >= 1) {
        // Team A Won
        position = 1;
        setWinner('teamA');
      } else if (position <= 0) {
        // Team B Won
        position = 0;
        setWinner('teamB');
      }
      teamA = 0;
      teamB = 0;
      servo.move(servo1, position);
    }, 500); // Every 500 milliseconds
  });
});

function sendTeamWon (team) {
  var message = 'Iberian Tessel Game Winner ' + team + ' at ' + new Date().toString() + '\n#fullstackcon\n\nNext game starts in 30 seconds.';
  client.post('statuses/update', {status: message}, function (error, tweet, response) {
    if (error) {
      console.error('Error:', error.message);
    }
  });
}

function setWinner (team) {
  console.log('winner', team);
  if (gameOver) {
    return;
  }
  gameOver = true;
  setTimeout(function () {
    console.log('Reset');
    position = 0.5;
    gameOver = false;
  }, 30000);
  sendTeamWon(team);
}

// You can also get the stream in a callback if you prefer.
client.stream('statuses/filter', {track: 'iberiantesselgame'}, function (stream) {
  stream.on('data', function (tweet) {
    if (gameOver) {
      return;
    }
    if (tweet.text.indexOf('teamB') !== -1) {
      console.log('Vote for team B');
      teamB++;
    }
    if (tweet.text.indexOf('teamA') !== -1) {
      console.log('Vote for team A');
      teamA++;
    }
  });

  stream.on('error', function (error) {
    throw error;
  });
});
