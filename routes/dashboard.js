const express = require('express');
const request = require('request');
let router = express.Router();

let adminCities = require('./adminCities');
let adminTours = require('./adminTours');
let adminPlaces = require('./adminPlaces');

router.get('/', function (req, res, next) {
	res.render('index', {
		title: 'Dashboard',
	});
});

router.use('/cities', adminCities);
router.use('/tours', adminTours);
router.use('/places', adminPlaces);

module.exports = router;