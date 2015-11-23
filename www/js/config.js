"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://192.168.1.166:9000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Sun Nov 22 2015 11:18:52 GMT-0600 (CST)')

.constant('clientTokenPath', 'http://192.168.1.166:9000/api/braintree/client_token')

.constant('redirectUrl', 'http://localhost:9000')

;