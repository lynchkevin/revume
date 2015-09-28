"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://192.168.1.166:5000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Mon Sep 28 2015 11:37:30 GMT-0500 (CDT)')

.constant('clientTokenPath', 'http://192.168.1.166:5000/api/braintree/client_token')

;