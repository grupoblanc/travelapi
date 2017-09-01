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
	Place.find({})
	.populate('city')
	.sort('-createdAt')
	.then(function (places) {
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
	Place.findById(req.params.id)
	.populate('city')
	.then(function(place) {
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
	Place.find({types: { $in: ['tour']}})
	.populate('city')
	.sort('-createdAt').then(function (places) {
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
	Tour.find({})
	.populate('city')
	.sort('-createdAt').then(function (tours) {
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
	Place.findById(req.params.id)
	.populate('city')
	.then(function (place) {
		Tour.find({parent: place._id})
		.sort(['totalTime','totalDistance','-createdAt'])
		.then(function (tours) {
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
	Tour.findById(req.params.id)
	.populate('city')
	.then(function (tour) {
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
	City.find({}).sort('views').then(function (cities) {
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

function forEachPlace(queryn, cat, result, i, city, req, res) {
	let googleId = result.place_id;
		request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
			googleId +
			'&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q', function (error, response, body) {
				googleResponse = JSON.parse(body);
				if (googleResponse.status === "OK") {
					googlePlace = googleResponse.result;
					let place =  new Place();
					place.name = googlePlace.name;
					place.city = city;
					place.googleId = googlePlace.place_id;
					place.location.lat = googlePlace.geometry.location.lat;
					place.location.lng = googlePlace.geometry.location.lng;
					place.rating = googlePlace.rating;
					if (googlePlace.photos !== undefined) {
						place.photos = googlePlace.photos;
						let photo = googlePlace.photos[0];
						place.photo.reference = photo.photo_reference;
						place.photo.width = photo.width;
					}
					place.website = googlePlace.website;
					place.phone_number = googlePlace.international_phone_number !== undefined ?
						googlePlace.international_phone_number : googlePlace.formatted_phone_number;
					place.address = googlePlace.formatted_address !== undefined ?
						googlePlace.formatted_address : googlePlace.vicinity;
					if (googlePlace.opening_hours !== undefined) {
						place.opening_hours.open_now = googlePlace.opening_hours.open_now;
						place.opening_hours.weekdays = googlePlace.opening_hours.weekday_text
					}
					place.types = cat;
					place.save().then(function(place) {}).catch(function (err) {
						Place.update(place, {upsert: true}).then(function(place) {}).catch(function(err) {
							res.json({
								status: err.message
							});
						});
					});
				}
		});
}

function forEachCategory(cat, city, req, res) {
	queryn = cat + " in " + city.name;
	request("https://maps.googleapis.com/maps/api/place/textsearch/json?query=" +
		queryn + "&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q", function(error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
					googleResult = googleResponse.results;
					googleResult.forEach(function (result, i) {
						if (i < 10) {
							forEachPlace(queryn, cat, result, i, city, req, res);
						}
					});
				}
			});
		}

function ifCity(city, milis, req, res) {
	setTimeout(function() {
		Place.aggregate()
			.unwind("types")
			.match({ city: city._id})
			.group({
				_id: '$types',
				places: {
					$push: '$$CURRENT'
				},
			})
			.sort({
				"_id": -1
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
	}, milis);
}

function buildFromGoogle(req, res) {
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
						city.parent =
						googlePlace.address_components[googlePlace.address_components.length - 1].long_name;
						city.googleId = googlePlace.place_id;
						city.location.lat = googlePlace.geometry.location.lat;
						city.location.lng = googlePlace.geometry.location.lng;
						let photo = googlePlace.photos[0];
						city.photo.reference = photo.photo_reference;
						city.photo.width = photo.width;
						city.topics = [];
						city.save().then(function(city) {
							let categories = ["restaurant", "beach",
							"hotel", "cafe", "park"];
							categories.forEach(function (cat, i) {
								forEachCategory(cat, city, res);
								if (i == categories.length - 1) {
									ifCity(city, 2500, req, res);
								}
							});
						});
					}  else {
						res.json({
							status: error.message
						});
					}
				});
			} else {
				res.json({
					status: "ERROR"
				});
			}
}

function updateCityViews(city) {
	City.update({_id: city._id},
		{ $inc: { views: 1 }}).exec();
}


function cityCallback(req, res) {
	City.findOne({$or: [
		{_id: getObjectId(req.params.id) },
		{googleId: req.params.id} ]
	}).then(function(city) {
		if (city) {
			ifCity(city, 0, req, res);
			updateCityViews(city);
		} else {
			buildFromGoogle(req, res);
		}
	}).catch(function (err) {
		res.json(err.message);
	});
}

router.get('/cities/:id', function(req, res, next) {
	fnerror = function(err) {
		console.log(err);
		return res.json({
			status: err.message
		});
	};
	cityCallback(req, res);

});

module.exports = router;
