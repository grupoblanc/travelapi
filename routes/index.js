const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const secretCode = 'theGoddamnBatman0123456789';
let express = require('express');
let router = express.Router();
let request = require("request");
let shuffle = require('shuffle-array');
let ObjectId = require('mongoose').Types.ObjectId;
let Place = require('../models/place');
let Tour  = require('../models/tour');
let City = require('../models/city');
let Information = require('../models/information');
let Profile = require('../models/profile');
let Review  = require('../models/review');

let storage = multer.diskStorage({
	destination: './public/uploads',
	filename: function(req, file, cb) {
		crypto.pseudoRandomBytes(16, function(err, raw) {
			if (err) {
				return cb(err);
			}
			cb(null, raw.toString('hex') + file.originalname)
		});
	}
});


function authenticationMiddleware(req, res, next) {
	var token = req.headers['x-access-token'] || req.body.token || req.query.token;
	if (token) {
		jwt.verify(token, secretCode, function (err, user) {
			if (err) {
				return res.json({
					status: 'Failed to aunthenticate token.',
				});
			} else {
				req.user = user;
				if (req.user._id !== undefined) {
					next();
				} else {
					return res.json({
						status: 'Failed to login user from token.',
					});
				}
			}
		});
	} else {
		res.status(404);
		return res.json({
			status: 'You must be logged in to perform this action.',
		});
	}
}



/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
  	results: [
  		{ message: "Api entry point."}
  	],
  	status: "OK"
  })
});

router.get('/profiles', function (req, res) {
	Profile.find({})
		.sort('-createdAt')
		.then(function (profiles) {
		return res.json({
			profiles: profiles,
			status: "OK"
		});
	}).catch(function (err) {
		res.status(404);
		return res.json({
			status: err.message,
		});
	});
});


router.get('/profiles/type/:token_type/tokenid/:token_id', function (req, res) {
	Profile.findOne({type: req.params.token_type, tokenId: req.params.token_id})
	.then(function (profile) {
		if (profile) {
			Review.find({profile: profile._id})
			.populate([{'path': 'profile'}, {'path': 'place', 'select': 'name address'}])
			.then(function (reviews) {
				return res.json({
					profile: {
						...profile._doc,
						reviews: reviews,
					},
					status: "OK"
				});
			}).catch(function(err) {
				res.status(404);
				return res.json({
					status: err.message,
				});
			});
		} else {
			res.status(404);
			return res.json({
				status: "Profile not found",
			});
		}
	}).catch(function (err) {
		res.status(404);
		return res.json({
			status: err.message,
		});
	});
});


router.post('/profiles/changephoto', authenticationMiddleware, function(req, res) {
	let profileId = req.user._id;
	let tokenId = req.body.tokenId;
	let photo = req.body.photoUrl;
	Profile.findOne({_id: getObjectId(profileId),
		tokenId: tokenId})
	.populate('reviews')
	.then(function(profile) {
			if (profile) {
				profile.photoUrl = photo;
				profile.save(function() {
					res.send("Profile updated!");
				})
			} else {
				res.status(404);
				res.send("Profile not found.");
			}
		}).catch(function (err) {
			res.status(404);
			res.send(err.message);
		})
});

router.post('/profiles/access', function (req, res) {
	let profile = new Profile();
	profile.name = req.body.name;
	profile.email = req.body.email;
	profile.type = req.body.type;
	if (req.body.tokenId !== undefined) {
		profile.tokenId = req.body.tokenId;
	} else {
		profile.tokenId = profile._id;
	}
	profile.photoUrl = req.body.photoUrl;
	Profile.findOne({ type: profile.type, tokenId: profile.tokenId })
	.then(function(user) {
		if (user) {
			Review.find({profile: user._id})
			.sort('-createdAt')
			.populate([{'path': 'profile'}, {'path': 'place', 'select': 'name address'}])
			.then(function (reviews) {
				let token = jwt.sign(user._doc, secretCode, {
					expiresIn: "30 days",
				});
				return res.json({
					profile: {
						...user._doc,
						reviews: reviews,
					},
					status: "OK",
					token: token,
				});
			}).catch(function(err) {
				res.status(404);
				return res.json({
					status: err.message,
				});
			});
		} else {
			//register
			let newUser = new Profile(profile);
			newUser.save().then(function () {
				let token = jwt.sign(newUser, secretCode, {
					expiresIn: "30 days",
				});
				return res.json({
					profile: newUser,
					status: "OK",
					token: token,
				});
			}).catch(function (err) {
				res.status(404);
				return res.json({
					status: err.message,
				})
			})
		}
	}).catch(function (err) {
		res.status(404);
		return res.json({
			status: err.message,
		});
	});
});

router.get('/logout', authenticationMiddleware, function(req, res) {
	req.user = undefined;
	res.send(res.json({
		status: "OK"
	}));
});

router.get('/profiles/:id', function (req, res) {
	Profile.findById(req.params.id).then(function (profile) {
		if (profile) {
			Review.find({profile: profile._id})
			.sort('-createdAt')
			.populate([{'path': 'profile'}, {'path': 'place', 'select': 'name address'}])
			.then(function (reviews) {
				return res.json({
					profile: {
						...profile._doc,
						reviews: reviews,
					},
					status: "OK"
				});
			}).catch(function(err) {
				res.status(404);
				return res.json({
					status: err.message,
				});
			});
		} else {
			res.status(404);
			return res.json({
				status: "NOT FOUND"
			});
		}
	}).catch(function (err) {
		res.status(404);
		return res.json({
			status: err.message,
		});
	});
});

router.get('/reviews/:place_id', function (req, res) {
	Review.find({place: req.params.place_id})
	.populate([{'path': 'profile'}, {'path': 'place', 'select': 'name address'}])
	.sort('-createdAt').then(function (reviews) {
		return res.json({
			reviews: reviews,
			status: "OK",
		})
	}).catch(function (err) {
		res.status(404);
		return res.json({
			status: err.message
		});
	});
});

router.post('/photo/upload', authenticationMiddleware, multer({storage: storage})
	.single('photo'), function (req, res) {
	let filename = req.file.filename;
    return res.json({
		photo: filename,
		status: "OK"
	});
});

router.post('/reviews/add', authenticationMiddleware, function (req, res) {
	let review = new Review();
	review.message = req.body.message;
	review.profile = req.user._id;
	review.rating = req.body.rating;
	review.place = req.body.place._id;
	review.photo = req.body.photo;
	review.save().then(function () {
		Place.findById(review.place)
		.then(function (place) {
			if (place) {
				// find mean and edit place
				Review.aggregate(
					{$match: {place: review.place}},
					{$group: {_id: place._id, average: {$avg: "$rating"}}}
					).then(function (result, err) {
						place.rating = result[0].average;
						place.save(function() {
							return res.json({
								review: review,
								status: "OK",
							});
						});
					}).catch(function (err) {
						res.status(404);
						return res.json({
							status: err.message,
						});
					});
			} else {
				res.status(404);
				return res.json({
					status: "Place not found",
				});
			}
		}).catch(function (err) {
			res.status(404);
			return res.json({
				status: err.message,
			});
		});
	}).catch(function (err) {
		res.status(404);
		return res.json({
			status: err.message,
		});
	});
});

router.get('/info/:place_id/lang/:lang', function (req, res) {
	let id = getObjectId(req.params.place_id);
	Information.findOne({
		place: id,
		lang: req.params.lang
	}).then(function (info) {
		if (info) {
			res.json({
				info,
				status: "OK"
			});
		} else {
			Information.find({
				place: id
			}).then(function (infos) {
				if (infos && infos.length > 0) {
					let baseInfo = infos[0];
					request("https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20170905T135536Z.e1250fdd1501543f.864dd90aa15b24483f7b53ab80f6b180fae6fb42&text=" +
				baseInfo.text + "&lang=" + req.params.lang,
				function(error, response, body) {
					if (error) {
						for (let i = 0; i < infos.length; i++) {
							if (infos[i].lang == "en" || infos[i].lang == "es") {
								return res.json({
									info: infos[i],
									status: "OK",
								});
							}
						}
						return res.json({
							info: infos[0],
							status: "OK",
						});
					} else {
						let result = JSON.parse(body);
						let text = result.text;
						let newInfo = new Information({
							place: getObjectId(req.params.place_id),
							text: text,
							lang: req.params.lang,
						});
						newInfo.save().then(function(saved) {
							res.json({
								info: saved,
								status: "OK"
							});
						}).catch(function (err) {
							res.status(404);
							res.json({
								status: err.message
							});
						});
					}
				});
				} else {
					res.json({
						status: "OK"
					});
				}
			}).catch(function (err) {
				res.status(404);
				res.json({
					status: err.message
				});
			})
		}
	}).catch(function (err) {
		res.status(404);
		res.json({
			status: err.message
		});
	})
});

router.get('/places', function(req, res, next) {
	Place.find({})
	.populate('city')
	.sort('-createdAt')
	.then(function (places) {
		res.json({
			places,
			status: "OK"
		});
	}).catch(function (err) {
		res.status(404);
		res.json({
			places: [],
			status: err.message
		});
	});
});

function sendGivenAPlace(res, place, hasReviewed) {
	Review.find({place: place})
	.populate([{'path': 'profile'}, {'path': 'place', 'select': 'name address'}])
	.then(function (reviews) {
		return res.json({
			place: {
				...place._doc,
				reviews: reviews,
				userHasReviewed: hasReviewed,
			},
			status: "OK"
		});
	}).catch(function(err) {
		res.status(404);
		return res.json({
			status: err.message
		})
	});
}


router.get('/places/:id', function(req, res, next) {
	let userId = undefined;
	var token = req.headers['x-access-token'] || req.body.token || req.query.token;
	if (token) {
		let user = jwt.verify(token, secretCode);
		if (user !== undefined && user._id !== undefined) {
			userId = user._id;
		}
	}
	Place.findOne({$or: [
		{_id: getObjectId(req.params.id) },
		{googleId: req.params.id} ]
	})
	.populate('city')
	.then(function(place) {
		if (place) {
			// check if theres a review of this place
			// given a user.
			if (userId !== undefined) {
					Review.findOne({
						profile: getObjectId(userId),
						place: place._id
					}).then(function(review) {
						if (review) {
							sendGivenAPlace(res, place, true);
						} else {
							sendGivenAPlace(res, place, false);
						}
					}).catch(function(err) {
						sendGivenAPlace(res, place, false);
					});
			} else {
				sendGivenAPlace(res, place, false);
			}
		} else {
			request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
		req.params.id +
		'&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q', function (error, response, body) {
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
				res.json({
					place,
					status: "OK"
				});
			} else {
				res.status(404);
				res.json({
					status: "PLACE_NOT_FOUND"
				});
			}
	});
		}
	}).catch(function (err) {
		res.status(404);
		res.json({
			error: err.message
		});
	});
});

router.get('/tours', function (req, res, next) {
	Place.find({types: { $in: ['tour']}})
	.populate('city')
	.sort('-createdAt').then(function (places) {
		res.json({
			places,
			status: "OK"
		});
	}).catch(function(err) {
		res.status(404);
		res.json({
			tours: [],
			status: err.message
		});
	})
});

router.get('/tours/all', function (req, res, next) {
	Tour.find({})
	.populate('city')
	.sort('-createdAt').then(function (tours) {
		res.json({
			tours,
			status: "OK"
		});
	}).catch(function(err) {
		res.status(404);
		res.json({
			tours: [],
			status: err.message
		});
	})
});


router.get('/tours/single/:place_id', function (req, res, next) {
	Place.findById(req.params.place_id)
	.populate('city')
	.then(function (place) {
		if (place) {
			Tour.find({parent: place._id})
			.sort([['totalTime', 'ascending'],['totalDistance', 'ascending']])
			.then(function (tours) {
				res.json({
					place: {
						name: place.name,
						city: place.city,
						googleId: place.googleId,
						address: place.address,
						_id: place._id,
						photo: place.photo,
						photos: place.photos,
						tours: tours
					},
					status: "OK"
				});
			}).catch(function(err) {
				res.status(404);
				res.json({
					status: err.message
				});
			});
		} else {
			res.status(404);
			res.json({
				status: 'No tour founds'
			});
		}
	}).catch(function(err) {
		res.status(404);
		res.json({
			status: err.message
		});
	})
});

router.get('/tours/all/:id', function (req, res, next) {
	Tour.findById(req.params.id)
	.populate('places')
	.then(function (tour) {
		res.json({
			tour: tour,
			status: "OK"
		});
	}).catch(function(err) {
		res.status(404);
		res.json({
			status: err.message
		});
	})
});

router.get('/cities', function (req, res, next) {
	City.find({})
	.sort('-views')
	.limit(15)
	.then(function (cities) {
		res.json({
			cities,
			status: "OK"
		});
	}).catch(function(err) {
		res.status(404);
		res.json({
			cities: [],
			status: err.message
		});
	})
});

function  getObjectId(param) {
	return new ObjectId((!ObjectId.isValid(param))
		? "123456789012" : param);
}

function forEachPlace(queryn, cat, result, i, city, req, res) {
	let googleId = result.place_id;
		request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
			googleId +
			'&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q', function (error, response, body) {
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
							res.status(404);
							res.json({
								status: err.message
							});
						});
					});
				}
		});
}

function forEachCategory(cat, city, req, res) {
	queryn = cat + " in " + city.name;
	request("https://maps.googleapis.com/maps/api/place/textsearch/json?query=" +
		queryn + "&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q", function(error, response, body) {
			googleResponse = JSON.parse(body);
			if (googleResponse.status === "OK") {
					googleResult = googleResponse.results;
					googleResult.forEach(function (result, i) {
						if (i < 10) {
							forEachPlace(queryn, cat, result, i, city, req, res);
						}
					});
				}
			});
		}

function ifCity(city, milis, req, res) {
	setTimeout(function() {
		Place.aggregate()
			.unwind("types")
			.match({ city: city._id})
			.group({
				_id: '$types',
				places: {
					$push: '$$CURRENT'
				},
			})
			.sort({
				"_id": -1
			})
			.then(function(topics) {
				topics.forEach(function (topic) {
					topic.places = shuffle.pick(topic.places, {
						'picks': 6
					});
				});
				res.json({
						city: {
							...city._doc,
							topics: topics,
						},
						result: "OK"
					});
			}).catch(fnerror);
	}, milis);
}

function buildFromGoogle(req, res) {
	if (req.params.id.length == 27) {
				// google city
				let googleId = req.params.id;
				request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
				googleId +
				'&key=AIzaSyAyHEPGUwTXFRbPKNHFVyrjVjnW8cgum3Q', function (error, response, body) {
					googleResponse = JSON.parse(body);
					if (googleResponse.status === "OK") {
						googlePlace = googleResponse.result;
						let city =  new City();
						city.name = googlePlace.name;
						city.parent =
						googlePlace.address_components[googlePlace.address_components.length - 1].long_name;
						city.googleId = googlePlace.place_id;
						city.location.lat = googlePlace.geometry.location.lat;
						city.location.lng = googlePlace.geometry.location.lng;
						let photo = googlePlace.photos[0];
						city.photo.reference = photo.photo_reference;
						city.photo.width = photo.width;
						city.topics = [];
						city.save().then(function(city) {
							let categories = ["restaurant", "beach",
							"hotel", "cafe", "park"];
							categories.forEach(function (cat, i) {
								forEachCategory(cat, city, res);
								if (i == categories.length - 1) {
									ifCity(city, 2500, req, res);
								}
							});
						});
					}  else {
						res.status(404);
						res.json({
							status: error.message
						});
					}
				});
			} else {
				res.json({
					status: "ERROR"
				});
			}
}

function updateCityViews(city) {
	City.update({_id: city._id},
		{ $inc: { views: 1 }}).exec();
}


function cityCallback(req, res) {
	City.findOne({$or: [
		{_id: getObjectId(req.params.id) },
		{googleId: req.params.id} ]
	}).then(function(city) {
		if (city) {
			ifCity(city, 0, req, res);
			updateCityViews(city);
		} else {
			buildFromGoogle(req, res);
		}
	}).catch(function (err) {
		res.json(err.message);
	});
}

router.get('/cities/:id', function(req, res, next) {
	fnerror = function(err) {
		res.status(404);
		return res.json({
			status: err.message
		});
	};
	cityCallback(req, res);

});

router.get('/where', function (req, res) {
	let lat = req.query.lat;
	let lng = req.query.lng;
	request("http://maps.googleapis.com/maps/api/geocode/json?latlng="+ lat + "," + lng + "&sensor=false",
		function (error, response, body) {
			googleResponse = JSON.parse(body);
			if (error) {
				res.status(404);
				return res.json({
					status: error.message
				})
			}
			if (googleResponse.status === "OK") {
				results = googleResponse.results;
				results = results.reverse();
				let types = [];
				let cityId = null;
				for (let i = 0; i < results.length; i++) {
					if (results[i].types[0] == "locality") {
						cityId = results[i].place_id;
					}
				}
				res.json(cityId);
			} else {
				res.status(404);
				res.json({
					status: "Not found"
				})
			}
	});
});

module.exports = router;
