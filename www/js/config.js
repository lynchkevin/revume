"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://10.1.10.216:5000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Thu Oct 01 2015 15:11:55 GMT-0500 (CDT)')

.constant('clientTokenPath', 'http://10.1.10.216:5000/api/braintree/client_token')

;