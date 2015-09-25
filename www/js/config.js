"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'production',endpoint:'https://m.revu.me',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Thu Sep 24 2015 13:56:58 GMT-0500 (CDT)')

.constant('clientTokenPath', 'https://m.revu.me/api/braintree/client_token')

;