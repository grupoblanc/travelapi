"use strict";

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let mongoStore = require('connect-mongo')(session);
let bodyParser = require('body-parser');
let pretty = require('express-prettify');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const mongoUrl = 'mongodb://localhost:27017/grupoblanc'

mongoose.connect(mongoUrl, {
  useMongoClient: true
} ,(err) => {
    if(err){
        console.log('Make sure you`re running MongoDB.')
    } else {
        console.log('Connected with MongoDB.')
    }
})


let index = require('./routes/index');
let dashboard = require('./routes/dashboard');
let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: 'lgk993509jt546j8y8509iu569iuy',
  resave: false,
  saveUninitialized: true,
  store: new mongoStore({
    url: mongoUrl,
    autoReconnect: true
  })
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(pretty({query: 'json'}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.redirect('/api/v1');
});

app.site_title = "TripGuide API";

app.use('/api/v1', index);
app.use('/api/site/admin', dashboard);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  if (err.status !== 500) {
    return res.json({
    	results: {},
    	status: err.message
    });
  }
  res.render('error', {
    error: err
  });
});

module.exports = app;
