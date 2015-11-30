"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://10.1.10.216:9000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Mon Nov 30 2015 07:25:57 GMT-0600 (CST)')

.constant('clientTokenPath', 'http://10.1.10.216:9000/api/braintree/client_token')

.constant('redirectUrl', 'http://localhost:9000')

;