let express = require('express');
let router = express.Router();
let shuffle = require('shuffle-array');

let Place = require('../models/place');
let Tour  = require('../models/tour');
let City = require('../models/city');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
  	results: [
  		{ message: "Api entry point."}
  	],
  	status: "OK"
  })
});


router.get('/places', function(req, res, next) {
	Place.find({}).sort('-createdAt').then(function (places) {
		res.json({
			places,
			status: "OK"
		});
	}).catch(function (err) {
		console.log(err);
		res.json({
			places: [],
			status: err.message
		});
	});
});

router.get('/places/:id', function(req, res, next) {
	Place.findById(req.params.id).then(function(place) {
		res.json({
			place,
			status: "OK"
		});
	}).catch(function (err) {
		res.json({
			error: err.message
		});
	});
});

router.get('/tours', function (req, res, next) {
	Tour.find({}).sort('-createdAt').then(function (tours) {
		res.json({
			tours,
			status: "OK"
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			tours: [],
			status: err.message
		});
	})
});


router.get('/tours/:id', function (req, res, next) {
	Tour.findById(req.params.id).then(function (tour) {
		res.json({
			tour,
			status: "OK"
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			status: err.message
		});
	})
});

router.get('/cities', function (req, res, next) {
	City.find({}).sort('-createdAt').then(function (cities) {
		res.json({
			cities,
			status: "OK"
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			cities: [],
			status: err.message
		});
	})
});

router.get('/cities/:id', function(req, res, next) {
	fnerror = function(err) {
		console.log(err);
		res.json({
			status: err.message
		});
	}
	City.findById(req.params.id).then(function(city) {
		Place.aggregate([
			{ $unwind: '$types'},
			{ $match: {
				city: city._id
				}
			},
			{ $group: {
				_id: '$types',
				places: {
					$push: '$$ROOT'
					}
				},

			}
		]).then(function(topics) {
			topics.forEach(function (topic) {
				topic.places = shuffle.pick(topic.places, {
					'picks': 6
				});
			});
			res.json({
				city: {
					...city._doc,
					topics: topics,
				},
				result: "OK"
			});
		}).catch(fnerror)
	}).catch(fnerror);
});

module.exports = router;
