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
    keepAlive: 1,
  // sets how many times to try reconnecting
    reconnectTries: Number.MAX_VALUE,
  // sets the delay between every retry (milliseconds)
		reconnectInterval: 1000,
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

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(pretty({query: 'json'}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    // // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Pass to next layer of middleware
    next();
});

app.use(session({
  key: 'session.sid',
  secret: 'lgk993509jt546j8y8509iu569iuy',
  resave: true,
  cookie: {
    path: '/api/v1/',
    secure: false,
    maxAge: 604800000,
    httpOnly: false,
  },
  saveUninitialized: true,
  store: new mongoStore({
    url: mongoUrl,
    autoReconnect: true
  })
}));

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
