"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://192.168.1.166:9000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Thu Dec 10 2015 18:02:26 GMT-0600 (CST)')

.constant('clientTokenPath', 'http://192.168.1.166:9000/api/braintree/client_token')

.constant('redirectUrl', 'http://localhost:9000')

;