"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'production',endpoint:'https://m.revu.me',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Mon Dec 14 2015 19:21:33 GMT-0600 (CST)')

.constant('clientTokenPath', 'https://m.revu.me/api/braintree/client_token')

.constant('redirectUrl', 'https://m.revu.me/')

.constant('helloInitParams', {dropbox:'f9cdswrtfz1jsd9',box:'11rseev2g1yripmmx833cp5jhiqy82v2',google:'945597499290-106uaa9etsaft53ln0olrv8dbse6h9an.apps.googleusercontent.com',windows:'000000004C17505E'})

;