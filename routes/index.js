let express = require('express');
let router = express.Router();
let request = require("request");
let shuffle = require('shuffle-array');
let ObjectId = require('mongoose').Types.ObjectId;

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
	Place.find({types: { $in: ['tour']}}).sort('-createdAt').then(function (places) {
		res.json({
			places,
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

router.get('/tours/all', function (req, res, next) {
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
	Place.findById(req.params.id).then(function (place) {
		Tour.find({parent: place._id}).sort('-createdAt').then(function (tours) {
			res.json({
				place: {
					...place._doc,
					tours: tours
				},
				status: "OK"
			})
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			status: err.message
		});
	})
});

router.get('/tours/all/:id', function (req, res, next) {
	Tour.findById(req.params.id).then(function (tour) {
		res.json({
			tour: tour,
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

function  getObjectId(param) {
	return new ObjectId((!ObjectId.isValid(param))
		? "123456789012" : param);
}

router.get('/cities/:id', function(req, res, next) {
	fnerror = function(err) {
		console.log(err);
		return res.json({
			status: err.message
		});
	};
	City.findOne({$or: [
		{_id: getObjectId(req.params.id) },
		{googleId: req.params.id} ]
	}).then(function(city) {
		if (city) {
			Place.aggregate()
			.unwind("types")
			.match({ city: city._id})
			.group({
				_id: '$types',
				places: {
					$push: '$$CURRENT'
				},
			})
			.then(function(topics) {
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
			}).catch(fnerror);
		} else {
			if (req.params.id.length == 27) {
				// google city
				let googleId = req.params.id;
				request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
				googleId +
				'&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q', function (error, response, body) {
					googleResponse = JSON.parse(body);
					if (googleResponse.status === "OK") {
						googlePlace = googleResponse.result;
						let city =  new City();
						city.name = googlePlace.name;
						city.googleId = googlePlace.place_id;
						city.location.lat = googlePlace.geometry.location.lat;
						city.location.lng = googlePlace.geometry.location.lng;
						let photo = googlePlace.photos[0];
						city.photo.reference = photo.photo_reference;
						city.photo.width = photo.width;
						city.topics = [];
						return res.json({
							city: {
								...city._doc,
								topics: []
							},
							result: "OK"
						});
					}
			});
			} else {
				return res.json({
					status: "Not found"
				});
			}
		}
	}).catch(fnerror);
});

module.exports = router;
