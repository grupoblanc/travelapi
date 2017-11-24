const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');

let Country = require('../models/country');

router.get('/', function (req, res, next) {
	Country.find({}).sort('name').then(function (results) {
		res.render('countries_dash', {
			title: 'Paises',
			countries: results
		});
	}).catch(function(err) {
		console.log(err);
		res.render('error', { err });
	});
});

router.get('/create', function (req, res, next) {
	res.render('countries_create', {
		title: 'Crear Pais'
	});
});

router.get('/edit/:country_id', function (req, res, next) {
	Country.findById(req.params.country_id)
	.then(function(country) {
		if (country) {
			res.render('countries_create', {
				title: 'Crear Pais',
				country: country
			});
		} else {
			return res.redirect('/api/site/admin/countries');
		}
	}).catch(function (err) {
		res.render('error', { err });
	});
});

router.post('/edit', function(req, res) {
	let countryId = req.body._id;
	let name = req.body.name;
  let description = req.body.description;
  let capital = req.body.capital;
  let currency = req.body.currency;
  let continent = req.body.continent;
  let flagPhotoUrl = req.body.flagPhotoUrl;

	Country.update(countryId, {
		name,
		description,
		capital,
		currency,
		continent,
		flagPhotoUrl
	}, function () {
		return res.redirect("/api/site/admin/countries");
	});
});

router.post('/create', function (req, res) {
	let googleId = req.body.google_id;
	request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
		googleId +
		'&key=' + config.api_key, function (error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
				googlePlace = googleResponse.result;
				if (googlePlace.types[0] !== "country") {
					return res.send("Este lugar no es un pais, intenta con otro.");
				}
				let country =  new Country();
				country.name = googlePlace.name;
				country.googleId = googlePlace.place_id;
				country.description = req.body.description;
			  country.capital = req.body.capital;
			  country.currency = req.body.currency;
			  country.continent = req.body.continent;
			  country.flagPhotoUrl = req.body.flagPhotoUrl;
				country.location.lat = googlePlace.geometry.location.lat;
				country.location.lng = googlePlace.geometry.location.lng;
				if (googlePlace.photos !== undefined) {
					let photo = googlePlace.photos[0];
					country.photo.reference = photo.photo_reference;
					country.photo.width = photo.width;
				}
				delete country._id;
				country.save().then(function() {
					return res.redirect('/api/site/admin/countries');
				}).catch(function (err) {
					console.log(err);
					Country.update(country, {upsert: true}).then(function(country) {
						return res.redirect('/api/site/admin/countries');
					}).catch(function(err) {
						res.render('error', { err });
					});
				});
			} else {
				res.render('error', { err: {
					message: "No se encontro la cuidad " + googleResponse.status
				} });
			}
	});
});

router.get('/remove/:country_id', function (req, res) {
	let countryId = req.params.country_id;
	Country.remove({_id: countryId})
	.then(function() {
		return res.redirect('/api/site/admin/countries');
	});
});

module.exports = router;
