var prime = require('prime');
var midigrid = require('midigrid');
module.exports = prime({
  inherits: midigrid,
  _serialoscMapFunc: function(noteNum) {
    var x = noteNum % 8;
    var y = Math.floor(noteNum / 8);
    console.log('press event: converted note ' + noteNum + ' to ' + x + ', ' + y)
    return [x, y];
  },
  // this should map an x/y coordinate to a midi note number
  _midiMapFunc: function(data) {
    var noteNum = data.x + (data.y * 8);
    console.log('led event: converted ' + data.x + ', ' + data.y + ' to note ' + noteNum);
    return noteNum;
  },
  // the velocity to use when turning a led on
  _velocityOn: function(data) {
    return 127;
  },
  // the velocity to use when turning a led off
  _velocityOff: function(data) {
    return 0;
  }
});
