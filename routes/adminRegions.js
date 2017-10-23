const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');

let Region = require('../models/region');
let Country = require('../models/country');

router.get('/', function (req, res, next) {
	Region.find({})
		.populate('country')
		.sort('-createdAt').then(function (results) {
		res.render('regions_dash', {
			title: 'Regiones',
			regions: results
		});
	}).catch(function(err) {
		console.log(err);
		res.render('error', { err });
	});
});

router.get('/create', function(req, res) {
	Country.find().then(function(countries) {
		return res.render('region_create', {
			title: 'Crear Region',
			countries
		});
	});
});

router.post('/create', function(req, res) {
	let name = req.body.name;
	let googleId = req.body.googleId;
	let country = req.body.country;

	let region = new Region();
	request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
		googleId +
		'&key=' + config.api_key, function (error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
				googlePlace = googleResponse.result;
				region.name = name;
				region.country = country;
				region.location.lat = googlePlace.geometry.location.lat;
				region.location.lng = googlePlace.geometry.location.lng;
				if (googlePlace.photos !== undefined) {
					let photo = googlePlace.photos[0];
					region.photo.reference = photo.photo_reference;
					region.photo.width = photo.width;
				}
				delete region._id;
				region.save().then(function() {
					res.redirect("/api/site/admin/regions");
				}).catch(function (err) {
					console.log(err);
					res.render('error', { err });
				});
			} else {
				res.render('error', { err: {
					message: "No se encontro la region " + googleResponse.status
				} });
			}
	});
});

router.get('/edit/:region_id', function(req, res) {
	let region_id = req.params.region_id;
	Region.findById(region_id).then(function(region) {
		if (region) {
			Country.find().then(function(countries) {
				return res.render('region_create', {
					title: 'Editar Region',
					region,
					countries
				});
			});

		} else {
				res.redirect('/api/site/admin/regions');
		}
	}).catch(function(err) {
		res.redirect('/api/site/admin/regions');
	});
});

router.post('/edit', function(req, res) {

});

router.get('/remove/:region_id', function (req, res) {
	let regionId = req.params.region_id;
	Region.remove({_id: regionId})
	.then(function() {
		return res.redirect('/api/site/admin/regions');
	});
});

module.exports = router;
