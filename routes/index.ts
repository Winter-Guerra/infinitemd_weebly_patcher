/// <reference path="../typings/tsd.d.ts"/>
import {Request, Response} from "express";
let express = require('express');
let router = express.Router();
import axios from 'axios';

// Config vars
let origin_hostname: string = 'infinitemd.com';
let CDN_whitelist = ["ajax.googleapis.com", "fonts.googleapis.com", "fonts.gstatic.com", "cdn2.editmysite.com", "cdn1.editmysite.com"];

/*
This endpoint is called whenever CloudFront needs a file from the {subdomain}.infinitemd origin.
We will find out which subdomain to use, get the HTML, then edit the page to redirect all external requests through infinitemd.
*/
router.get('/origin/:origin_subdomain/path/*', (req: Request, res: Response, next: Function) => {
  // Get the proxy url by removing the beginning framework from the URL.
  let requested_url: string = req.originalUrl.substring('/origin/XX/path'.length);
  // Create the proxied URL
  let new_url: string = `http://${req.params.origin_subdomain}.${origin_hostname}${requested_url}`;

  // Setup how we will patch our code.
  var html_patcher = (data: string) => {
    for (var domain of CDN_whitelist){
      let regex = new RegExp(domain, 'g');
      let new_domain: string = `${req.params.origin_subdomain}.${origin_hostname}/proxy/host/${domain}/url`;
      data = data.replace(regex, new_domain);
    }
    return data;
  }

  // Get the html from the origin and patch the response of the request.
  console.log(`Pulling data from ${new_url}`);

  axios.get(new_url, {transformResponse: [html_patcher]})
  .catch(
    (error) => {
      console.log(error.response.headers);
      res.sendStatus(error.response.status);
    }
  )
  .then(
    (origin_response) => {
    console.log(origin_response.data);
    console.log(origin_response.status);
    console.log(origin_response.statusText);
    console.log(origin_response.headers);
    console.log(origin_response.config);
    return origin_response;
  })
  .then (
    // Send back the edited HTML.
    (origin_response) => {
      res.status(origin_response.status)
      .set(origin_response.headers)
      .send(origin_response.data);
    }
  )
  .catch (
    (error) => {
      console.log(error);
    }
  )

  // res.status('origin_debug', { path: requested_url, subdomain: req.params.origin_subdomain });
});


/* This endpoint is called whenever external assets are needed for the webpage.
This endpoint will decode the URL and reverse proxy the response without changing it.
@TODO*/
router.get('/proxy/host/:proxy_host/url/:proxy_url', function(req: Request, res: Response, next: Function) {
  res.render('proxy_debug', { path: req.params.proxy_url, hostname: req.params.proxy_host });
});

module.exports = router;
