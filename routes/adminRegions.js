const express = require('express');
const request = require('request');
let router = express.Router();
const config = require('../config');

let Region = require('../models/region');

router.get('/', function (req, res, next) {
	Region.find({}).sort('-createdAt').then(function (results) {
		res.render('regions_dash', {
			title: 'Regiones',
			regions: results
		});
	}).catch(function(err) {
		console.log(err);
		res.json({
			results: [],
			status: err.message
		});
	});
});

module.exports = router;
