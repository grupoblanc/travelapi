// login
const express = require('express');
const crypto = require('crypto');
let config = require('../config');
let Profile = require('../models/profile');
let router = express.Router();

router.get('/', function (req, res, next) {
  if (req.session.user !== undefined) {
    return res.redirect('/api/site/admin');
  }
    Profile.find({type: 'admin'})
    .then(function (profiles) {
      if (profiles !== undefined && profiles.length > 0) {
        return res.render('web/login', {
          title: 'Login',
          site_title: config.app_name
        });
      } else {
        return res.redirect('/api/site/login/register');
      }
    })
});

router.get('/register', function (req, res) {
  Profile.find({type: 'admin'})
  .then(function (profiles) {
    if (profiles !== undefined && profiles.length > 0) {
      return res.redirect('/api/site/admin');
    } else {
      return res.render('web/register', {
        title: 'Register',
        site_title: config.app_name
      });
    }
  })
});

router.post('/register', function (req, res) {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let repeatpassword = req.body.repeatpassword;
  let tokenId = req.body.tokenId;
  if (repeatpassword === password) {
    const profile = new Profile();
    profile.name = name;
    profile.email = email;
    profile.password = password;
    profile.tokenId = tokenId;
    profile.type = "admin";
    profile.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/api/site/login');
      }
    });

  } else {

  }
});

router.post('/', function (req, res) {
  let email = req.body.email;
  let password = req.body.password;
  Profile.findOne({
    email: email,
    type: 'admin'
  }).then(function (profile) {
    if (profile) {
      profile.comparePassword(password, function(err, isMatch) {
        console.log(err);
        console.log(isMatch);
        if (err) {
          res.redirect('/api/site/login');
        }

        if (isMatch) {
          req.session.user = profile;
          res.redirect('/api/site/admin');
        } else {
          res.redirect('/api/site/login');
        }
      })
    } else {
      console.log("nouser");
      res.redirect('/api/site/login');
    }
  }).catch(function(err) {
    console.log(err);
    res.redirect('/api/site/login');
  });

});

module.exports = router;
