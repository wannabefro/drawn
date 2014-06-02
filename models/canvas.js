var mongoose = require('mongoose');

var canvasSchema = new mongoose.Schema({
  data: String
});

module.exports = mongoose.model('Canvas', canvasSchema);
