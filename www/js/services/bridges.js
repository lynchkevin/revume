'use strict';

/**
* a service to manage users  
*/
angular.module('starter.services')

.factory('Bridges', ['$resource','baseUrl',function ($resource,baseUrl) {
    var target = baseUrl.endpoint+'/api/bridges/:id';  
    return $resource(target,{id:'@id'});
}])
.service('BridgeService', ['Bridges','$q','$ionicPopup', 
function (Bridges,$q,$ionicPopup) {
    var $ = this;
    
    $.currentBridge = {};

    //determine an active bridge is running
    $.activeBridge = function(){
        if( $.currentBridge.conferenceID != undefined)
            return true; 
        else
            return false;
    };
    
    //start up a conference bridge
    $.startBridge = function(id){
        var confId = id.replace(/-/g,'');
        Bridges.save({confId:confId}).$promise.then(function(bridge){
            $.currentBridge = bridge;
            $.showBridgeInfo(bridge);
        }).catch(function(err){console.log('startBridge: ',err)});
    };

     // Show the Bridge Dial-in Information
     $.showBridgeInfo = function() {
       var bridge = $.currentBridge;
       var confId = bridge.conferenceID.slice(0,3)+'-'+bridge.conferenceID.slice(3,6)+'-'+bridge.conferenceID.slice(6,9);
       var ph = bridge.tollNumber;
       var num = '(';
         num = num + ph.slice(2,5)+')';
         num = num + ' '+ph.slice(5,8)+'-';
         num = num + ph.slice(8,12);
       var alertPopup = $ionicPopup.alert({
         title: 'Please Dial In',
         template: '<p><strong>Number:</strong></p><p>'+num+'</p><br><p><strong>ConfID:</strong></p><p>'+confId+'</p><br><p><strong>Viop:</strong></p><p>'+bridge.sipURI+'</p><br>'
       });
       alertPopup.then(function(res) {
         console.log("bridge alert done");
       });
     };

    // end the conference bridge and delete it from turbobridge
    $.endBridge = function(id){
        var confId = id.replace(/-/g,'');
        Bridges.delete({id:confId}).$promise.then(function(){
            $.currentBridge = {};
        });
    };
}]);