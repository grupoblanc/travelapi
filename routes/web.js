let express = require('express');
let router = express.Router();
let ObjectId = require('mongoose').Types.ObjectId;
let Place = require('../models/place');
let Tour  = require('../models/tour');
let City = require('../models/city');
let Information = require('../models/information');
let Profile = require('../models/profile');
let Review  = require('../models/review');


router.get('/', function (req, res) {
  return res.render('web/index', {
    title: 'Home',
    site_title: 'Tripguide',
  });
});


router.get('/places/:id', function (req, res) {
  Place.findById(req.params.id)
  .populate('city')
  .then(function (place) {
    if (place) {
      Review.find({place: place._id})
      .sort('-createdAt')
      .populate('profile')
      .limit(10)
      .then(function (reviews) {
        return res.render('web/place', {
          title: place.name,
          site_title: 'Tripguide.com',
          place: place,
          reviews: reviews
        });
      })
    } else {
      res.status(404);
      res.render('web/error', {
        title: "Place not found",
        site_title: 'Tripguide.com',
        error: {
          message: "Place not found"
        }
      })
    }
  });
});

module.exports = router;
