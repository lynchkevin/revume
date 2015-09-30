"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'production',endpoint:'https://m.revu.me',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Wed Sep 30 2015 16:21:43 GMT-0500 (CDT)')

.constant('clientTokenPath', 'https://m.revu.me/api/braintree/client_token')

;