"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'production',endpoint:'https://m.revu.me',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Sun Jan 31 2016 12:27:40 GMT-0600 (CST)')

.constant('clientTokenPath', 'https://m.revu.me/api/braintree/client_token')

.constant('redirectUrl', 'https://m.revu.me/')

.constant('helloInitParams', {dropbox:'f9cdswrtfz1jsd9',box:'11rseev2g1yripmmx833cp5jhiqy82v2',google:'945597499290-106uaa9etsaft53ln0olrv8dbse6h9an.apps.googleusercontent.com',windows:'000000004C17505E',sfdc:'3MVG9sG9Z3Q1RlbdEH3x71mLE7o4tBdvBgDi8S7KMxAOEvtS4wwwdhHSi5N681cL3LHUcN8HrE4D8A74u31ax'})

;