const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');

let Place = require('../models/place');
let City = require('../models/city');
let Information = require('../models/information');

router.get('/', function (req, res, next) {
	Place.find({})
	.populate('city')
	.sort('-createdAt').then(function (results) {
		res.render('places_dash', {
			title: 'Places Admin',
			places: results
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
	City.find({}).then(function(results) {
		res.render('places_create', {
			title: 'Add Place',
			cities: results
		});
	}).catch(function(err) {
		res.json({
			results: [],
			status: err.message
		});
	})
});

router.get('/edit/:id', function (req, res, next) {
	Place.findOne({_id: req.params.id }).then(function (results) {
		City.find({}).then(function(cities) {
			res.render('places_create', {
				title: 'Places Edit',
				place: results,
				cities: cities
			});
		}).catch(function(err) {
			res.json({
				results: [],
				status: err.message
			});
		})
	}).catch(function(err) {
		console.log(err);
		res.json({
			results: [],
			status: err.message
		});
	});
});

router.post('/edit', function (req, res, next) {
	let description = new Information({
		place: req.body._id,
		lang: req.body.description_lang,
		text:  req.body.description,
	});
	let placeData = {
		"types": req.body.place_type.split(","),
	};
	Place.update({_id: req.body._id}, placeData).then(function(place) {
		if (description.text !== undefined && description.text.length > 0) {
			Information.findOne({
				place: description.place, lang: description.lang})
			.then(function (info) {
				if (info) {
					info.text = description.text;
					info.save().then(function () {
						res.redirect('/api/site/admin/places');
					});
				} else {
					description.save().then(function () {
						res.redirect('/api/site/admin/places');
					});
				}
			}).catch(function (error) {
				console.log(error);
				res.redirect('/api/site/admin/places');
			});
		} else {
			res.redirect('/api/site/admin/places');
		}
		console.log(place);
	}).catch(function (err) {
		res.json(error);
	});
});

router.get('/remove/:id', function (req, res, next) {
	let placeId = req.params.id
	Place.remove({ _id: placeId }).then(function () {
		res.redirect('/api/site/admin/places');
	}).catch(function (err) {
		res.json(error);
	});
});

router.post('/fromgoogle', function(req,res, next) {
	let googleId = req.body.google_id;
	request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
		googleId +
		'&key=' + config.api_key, function (error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
				googlePlace = googleResponse.result;
				let place =  new Place();
				place.name = googlePlace.name;
				place.city = req.body.city;
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
				if (req.body.place_type !== undefined && req.body.place_type !== "") {
					place.types = req.body.place_type.split(",");;
				} else {
					place.types = googlePlace.types;
				}
				delete place._id;
				delete place._doc._id;
				place.save().then(function(place) {
					res.redirect('/api/site/admin/places');
				}).catch(function (err) {
					Place.update(place, {upsert: true}).then(function(place) {
						res.redirect('/api/site/admin/places');
					}).catch(function(err) {
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

router.get('/search', function(req, res, next) {
	City.find({}).then(function (result) {
		res.render('places_search', {
			title: 'Search from google',
			cities: result
		});
	}).catch(function(err) {
		res.json({
			status: err.message
		});
	});
});

router.get('/textsearch', function(req, res, next) {
	request("https://maps.googleapis.com/maps/api/place/textsearch/json?query=" +
		req.query.query +
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
									place.city = req.query.city;
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
									if (req.query.place_type !== undefined && req.query.place_type !== "") {
										place.types = req.query.place_type.split(",");
									} else {
										place.types = googlePlace.types;
									}
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
					res.redirect("/api/site/admin/places");
			} else {
				res.send(error);
			}
	});
});

module.exports = router;
