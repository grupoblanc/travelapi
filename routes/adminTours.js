const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');
let ObjectId = require('mongoose').Types.ObjectId;

let Tour  = require('../models/tour');
let Place = require('../models/place');
let City = require('../models/city');
let Region = require('../models/region');

function  getObjectId(param) {
	return new ObjectId((!ObjectId.isValid(param))
		? "123456789012" : param);
}

router.get('/', function (req, res, next) {
	Tour.find({}).sort('-createdAt')
	.populate('parent').then(function (results) {
		res.render('tours_dash', {
			title: 'Tours',
			tours: results
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			results: [],
			status: err.message
		});
	});
});

router.get('/create/:parent/:parent_id', function(req, res, next) {
	let parentName = req.params.parent;
	let parentId = req.params.parent_id;
	let parentModel = {};
	let childrenModel = {};
	if (parentName === "cities") {
		parentModel = City.findById(parentId);
		childrenModel = Place.find({ city: parentId});
	} else if (parentName === "regions") {
		parentModel = Region.findById(parentId);
		childrenModel = City.find({ region: parentId }).select('_id');
	} else {
		return res.render('error', {
			err: {
				message: "Debes seleccionar al menos una ciudad o region de origen."
			}
		});
	}
	parentModel
	.then(function (parent) {
		childrenModel
		.sort('name')
		.then(function(places) {

			if (parentName === "regions") {
				// cities
				let cities = places.map(function(p) {
					return p._id;
				});
				Place.find({ city: {'$in': cities }})
				.sort('name')
				.then(function (result) {
					return res.render('tours_create', {
						title: 'Crear Tour',
						places: result,
						parent
					});
				}).catch(function (err) {
					return res.render('error', { err });
				});
			} else {
				return res.render('tours_create', {
					title: 'Crear Tour',
					places,
					parent,
				});
			}
		}).catch(function(err) {
			return res.render('error', { err });
		});
	}).catch(function(err) {
		return res.render('error', { err });
	});

	// model
	// .then(function(places) {
	// 	Place.find({ types: {"$in": ["tour"]}})
	// 	.then(function(tours) {
	// 		res.render('tours_create', {
	// 			title: 'Crear Tour',
	// 			tours: tours,
	// 			places: places,
	// 		});
	// 	}).catch(function(err) {
	// 		console.log(err);
	// 		res.json({
	// 			status: err.message
	// 		});
	// 	});
	// }).catch(function (err) {
	// 	console.log(err);
	// 	res.json({
	// 		status: err.message
	// 	});
	// });

});

router.post('/create/:city_id', function(req, res) {
	// let tour = new Tour(req.body);
	// tour.save().then(function() {
	// 	res.redirect("/api/site/admin/tours");
	// }).catch(function (err) {
	// 	console.log(err);
	// 	res.json({
	// 		status: err.message
	// 	});
	// });
});

// router.get('/create', function (req, res, next) {
// 	res.render('cities_create', {
// 		title: 'Add City'
// 	});
// });

// router.post('/create', function (req, res, next) {
// 	let city = new City();
// 	city.name = req.body.name;
// 	city.googleId = req.body.google_id;
// 	city.description = req.body.description;
// 	city.location.lat = req.body.latitude;
// 	city.location.lng = req.body.longitude;
// 	city.photo.reference = req.body.photo_reference;
// 	city.photo.width = req.body.photo_width;
// 	city.save().then(function(city) {
// 		res.redirect('/api/site/admin/cities');
// 	}).catch(function (err) {
// 		res.json(error);
// 	});
// });

// router.get('/edit/:id', function (req, res, next) {
// 	City.findOne({_id: req.params.id }).then(function (results) {
// 		res.render('cities_create', {
// 			title: 'Cities Edit',
// 			city: results
// 		});
// 	}).catch(function(err) {
// 		console.log(err);
// 		res.json({
// 			results: [],
// 			status: err.message
// 		});
// 	});
// });

// router.post('/edit', function (req, res, next) {
// 	let cityData = {
// 		"name": req.body.name,
// 		"googleId": req.body.google_id,
// 		"description": req.body.description,
// 		"location": {
// 			"lat": req.body.latitude,
// 			"lng": req.body.longitude,
// 		},
// 		"photo": {
// 			"reference": req.body.photo_reference,
// 			"width": req.body.photo_width,
// 		},
// 	};
// 	City.update({_id: req.body._id }, cityData).then(function(city) {
// 		console.log(city);
// 		res.redirect('/api/site/admin/cities');
// 	}).catch(function (err) {
// 		res.json(error);
// 	});
// });

// router.get('/remove/:id', function (req, res, next) {
// 	let cityId = req.params.id
// 	City.remove({ _id: cityId }).then(function () {
// 		res.redirect('/api/site/admin/cities');
// 	}).catch(function (err) {
// 		res.json(error);
// 	});
// });

// router.post('/fromgoogle', function(req,res, next) {
// 	let googleId = req.body.google_id;
// 	request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
// 		googleId +
// 		''&key=' + config.api_key, function (error, response, body) {
// 			googleResponse = JSON.parse(body);
// 			if (googleResponse.status === "OK") {
// 				googlePlace = googleResponse.result;
// 				let city =  new City();
// 				city.name = googlePlace.name;
// 				city.googleId = googlePlace.place_id;
// 				city.location.lat = googlePlace.geometry.location.lat;
// 				city.location.lng = googlePlace.geometry.location.lng;
// 				let photo = googlePlace.photos[0];
// 				city.photo.reference = photo.photo_reference;
// 				city.photo.width = photo.width;
// 				city.save().then(function(city) {
// 					res.redirect('/api/site/admin/cities');
// 				}).catch(function (err) {
// 					res.json(err.message);
// 				});
// 			}
// 	});
// });

module.exports = router;
