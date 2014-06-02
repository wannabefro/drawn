var express = require('express');
var Canvas = require('../models/canvas');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Home' });
});

router.get('/canvas/new', function(req, res) {
  var canvas = new Canvas();
  canvas.save();
  res.redirect(canvas._id);
});

router.get('/canvas/:id?', function(req, res) {
  var canvas = Canvas.findById(req.params.id, function (err, cavnas) {return canvas});
  res.render('show');
});

module.exports = router;
