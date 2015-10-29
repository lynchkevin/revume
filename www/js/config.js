"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://10.1.10.216:9000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Thu Oct 29 2015 11:43:23 GMT-0500 (CDT)')

.constant('clientTokenPath', 'http://10.1.10.216:9000/api/braintree/client_token')

.constant('redirectUrl', 'http://localhost:9000')

;