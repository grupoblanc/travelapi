const express = require('express');
const request = require('request');
let router = express.Router();

let City = require('../models/city');

router.get('/', function (req, res, next) {
	City.find({}).sort('-createdAt').then(function (results) {
		res.render('cities_dash', {
			title: 'Cities Admin',
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
		title: 'Add City'
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
			title: 'Cities Edit',
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
		'&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q', function (error, response, body) {
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
					res.redirect('/api/site/admin/cities');
				}).catch(function (err) {
					res.json(err.message);
				});
			}
	});
});

module.exports = router;