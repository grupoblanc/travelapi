const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');

let City = require('../models/city');
let Place = require('../models/place');

router.get('/', function (req, res, next) {
	City.find({}).sort('-createdAt').then(function (results) {
		res.render('cities_dash', {
			title: 'Ciudades',
			cities: results
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			results: [],
			status: err.message
		});
	});
});


router.get('/create', function (req, res, next) {
	res.render('cities_create', {
		title: 'Agregar ciudad'
	});
});

router.post('/create', function (req, res, next) {
	let city = new City();
	city.name = req.body.name;
	city.googleId = req.body.google_id;
	city.parent = req.body.parent;
	city.description = req.body.description;
	city.location.lat = req.body.latitude;
	city.location.lng = req.body.longitude;
	city.photo.reference = req.body.photo_reference;
	city.photo.width = req.body.photo_width;
	city.save().then(function(city) {
		res.redirect('/api/site/admin/cities');
	}).catch(function (err) {
		res.json(error);
	});
});

router.get('/edit/:id', function (req, res, next) {
	City.findOne({_id: req.params.id }).then(function (results) {
		res.render('cities_create', {
			title: 'Editar ciudad',
			city: results
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			results: [],
			status: err.message
		});
	});
});

router.post('/edit', function (req, res, next) {
	let cityData = {
		"name": req.body.name,
		"googleId": req.body.google_id,
		"parent": req.body.parent,
		"description": req.body.description,
		"location": {
			"lat": req.body.latitude,
			"lng": req.body.longitude,
		},
		"photo": {
			"reference": req.body.photo_reference,
			"width": req.body.photo_width,
		},
	};
	City.update({_id: req.body._id }, cityData).then(function(city) {
		console.log(city);
		res.redirect('/api/site/admin/cities');
	}).catch(function (err) {
		res.json(error);
	});
});

router.get('/remove/:id', function (req, res, next) {
	let cityId = req.params.id
	City.remove({ _id: cityId }).then(function () {
		res.redirect('/api/site/admin/cities');
	}).catch(function (err) {
		res.json(error);
	});
});

router.post('/fromgoogle', function(req,res, next) {
	let googleId = req.body.google_id;
	let parent = req.body.parent;
	request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
		googleId +
		'&key=' + config.api_key, function (error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
				googlePlace = googleResponse.result;
				let city =  new City();
				city.name = googlePlace.name;
				city.googleId = googlePlace.place_id;
				city.parent = parent;
				city.location.lat = googlePlace.geometry.location.lat;
				city.location.lng = googlePlace.geometry.location.lng;
				let photo = googlePlace.photos[0];
				city.photo.reference = photo.photo_reference;
				city.photo.width = photo.width;
				city.save().then(function(city) {
					let categories = ["restaurant", "beach",
					"hotel", "cafe", "park"];
					categories.forEach(function (cat) {
						queryn = cat + " in " + city.name;
						request("https://maps.googleapis.com/maps/api/place/textsearch/json?query=" +
		queryn +
		'&key=' + config.api_key, function(error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
					googleResult = googleResponse.results;
					googleResult.forEach(function (result) {
						let googleId = result.place_id;
						request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
							googleId +
							'&key=' + config.api_key, function (error, response, body) {
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
								} else {
									res.json({
										status: "PLACE_NOT_FOUND"
									});
								}
						});
					});
			} else {
				res.send(error);
			}
	});
					});
					res.redirect('/api/site/admin/cities');
				}).catch(function (err) {
					res.json(err.message);
				});
			}
	});
});

module.exports = router;
