"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://10.1.10.216:5000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Mon Oct 26 2015 09:53:53 GMT-0500 (CDT)')

.constant('clientTokenPath', 'http://10.1.10.216:5000/api/braintree/client_token')

.constant('redirectUrl', 'http://10.1.10.216:5000')

;