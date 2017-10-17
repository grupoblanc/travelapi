const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');

let Country = require('../models/country');

router.get('/', function (req, res, next) {
	Country.find({}).sort('-createdAt').then(function (results) {
		res.render('countries_dash', {
			title: 'Paises',
			countries: results
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
	res.render('countries_create', {
		title: 'Crear Pais'
	});
});

module.exports = router;
