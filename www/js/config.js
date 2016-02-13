"use strict";

 angular.module('config', [])

.constant('baseUrl', {name:'development',endpoint:'http://192.168.1.166:9000',volerro:'https://rb.volerro.com'})

.constant('buildDate', 'Sat Feb 13 2016 10:17:05 GMT-0600 (CST)')

.constant('clientTokenPath', 'http://192.168.1.166:9000/api/braintree/client_token')

.constant('redirectUrl', 'http://localhost:9000')

.constant('helloInitParams', {dropbox:'c4uikzug99og3rh',box:'fn4p272m1a8qh2e9izqkpryhvedhlz2z',google:'945597499290-u6mqigu75s49u8dihb4npueh5hcbft9q.apps.googleusercontent.com',windows:'000000004817AFBB',sfdc:'3MVG9sG9Z3Q1RlbdEH3x71mLE7rVL3IC9m79cM1uHudxEU6AoBtcQieypG.x7fj20dawZZ29LEudyxayDkMCj'})

;