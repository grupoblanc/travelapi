const express = require('express');
const request = require('request');
let router = express.Router();

let adminCities = require('./adminCities');
let adminTours = require('./adminTours');
let adminPlaces = require('./adminPlaces');
let config = require('../config');

router.get('/', function (req, res, next) {
	res.render('index', {
		title: 'Panel de administracion',
	});
});

router.get('/logout', function (req, res, next) {
	req.session.user = undefined;
	return res.redirect('/api/site/login');
});

router.use('/cities', adminCities);
router.use('/tours', adminTours);
router.use('/places', adminPlaces);

module.exports = router;
