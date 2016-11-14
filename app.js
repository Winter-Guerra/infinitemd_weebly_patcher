/// <reference path="./typings/tsd.d.ts"/>
"use strict";
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var winston = require('winston');
var expressWinston = require('express-winston');
require('winston-papertrail').Papertrail;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// Setup logger
var winstonPapertrail = new winston.transports.Papertrail({
    host: 'logs.papertrailapp.com',
    port: 24057
});
var logger = new winston.Logger({
    transports: [winstonPapertrail]
});
app.use(expressWinston.logger({
    transports: [winstonPapertrail],
    statusLevels: true
}));
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
// express-winston errorLogger for those errors that are too big to recover from
app.use(expressWinston.errorLogger({
    transports: [winstonPapertrail],
    statusLevels: true
}));
module.exports = app;
