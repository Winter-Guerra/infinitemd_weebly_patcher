"use strict";
var express = require('express');
var router = express.Router();
var axios_1 = require('axios');
// Config vars
var origin_hostname = 'infinitemd.com';
var CDN_whitelist = ["ajax.googleapis.com", "fonts.googleapis.com", "fonts.gstatic.com", "cdn2.editmysite.com", "cdn1.editmysite.com"];
/*
Redirect all hits to http[s]://infinitemd.com/XXX to the SSL site.
Leave all other requests to the following middleware.
*/
router.get('*', function (req, res, next) {
    console.log("origin: " + req.get('Origin'));
    if (req.get('Origin') === 'https://infinitemd.com' || req.get('Origin') === 'http://infinitemd.com' || req.headers.get('host') === 'infinitemd.com') {
        var new_url = "https://www.infinitemd.com" + req.originalUrl;
        res.redirect(301, new_url);
    }
    else {
        next();
    }
});
/*
This endpoint is called whenever CloudFront needs a file from the {subdomain}.infinitemd origin.
We will find out which subdomain to use, get the HTML, then edit the page to redirect all external requests through infinitemd.
*/
router.get('/origin/:origin_subdomain/path/*', function (req, res, next) {
    // Get the proxy url by removing the beginning framework from the URL.
    var requested_url = req.originalUrl.substring('/origin/XX/path'.length);
    // Create the proxied URL
    var new_url = "http://" + req.params.origin_subdomain + "." + origin_hostname + requested_url;
    // Setup how we will patch our code.
    var html_patcher = function (data) {
        for (var _i = 0, CDN_whitelist_1 = CDN_whitelist; _i < CDN_whitelist_1.length; _i++) {
            var domain = CDN_whitelist_1[_i];
            var regex = new RegExp(domain, 'g');
            var new_domain = req.params.origin_subdomain + "." + origin_hostname + "/proxy/host/" + domain + "/url";
            data = data.replace(regex, new_domain);
        }
        return data;
    };
    // Get the html from the origin and patch the response of the request.
    console.log("Pulling data from " + new_url);
    axios_1["default"].get(new_url, { transformResponse: [html_patcher] })
        .catch(function (error) {
        console.log(error.response.headers);
        res.sendStatus(error.response.status);
    })
        .then(function (origin_response) {
        console.log(origin_response.data);
        console.log(origin_response.status);
        console.log(origin_response.statusText);
        console.log(origin_response.headers);
        console.log(origin_response.config);
        return origin_response;
    })
        .then(
    // Send back the edited HTML.
    function (origin_response) {
        res.status(origin_response.status)
            .set(origin_response.headers)
            .send(origin_response.data);
    })
        .catch(function (error) {
        console.log(error);
    });
    // res.status('origin_debug', { path: requested_url, subdomain: req.params.origin_subdomain });
});
/* This endpoint is called whenever external assets are needed for the webpage.
This endpoint will decode the URL and reverse proxy the response without changing it.
@TODO*/
router.get('/proxy/host/:proxy_host/url/:proxy_url', function (req, res, next) {
    res.render('proxy_debug', { path: req.params.proxy_url, hostname: req.params.proxy_host });
});
module.exports = router;
