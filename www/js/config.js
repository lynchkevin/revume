"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://192.168.1.100:5000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Fri Sep 11 2015 19:53:47 GMT-0500 (CDT)')

.constant('clientTokenPath', 'http://192.168.1.100:5000/api/sandbox/client_token')

.constant('bTree', '/api/sandbox/')

;