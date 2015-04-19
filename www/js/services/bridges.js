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
    
    $.findBridge = function(id){
        var confId = id.replace(/-/g,'');
        Bridges.get({id:confId}).$promise.then(function(bridge){
            if(bridge.conferenceID != undefined){
                     $.currentBridge = bridge;
            }
        });
    };
    
    //start up a conference bridge
    $.startBridge = function(id){
        var defer = $q.defer();
        var confId = id.replace(/-/g,'');
        Bridges.save({confId:confId}).$promise.then(function(bridge){
            $.currentBridge = bridge;
            return $.showBridgeInfo(bridge);
        }).then(function(){
            defer.resolve();
        }).catch(function(err){
            console.log('startBridge: ',err);
            defer.reject(err);
        });
        return defer.promise;
    };

     // Show the Bridge Dial-in Information
     $.showBridgeInfo = function() {
            var defer = $q.defer();
            var bridge = $.currentBridge;
            var confId = bridge.conferenceID.slice(0,3)+'-'+bridge.conferenceID.slice(3,6)+'-'+bridge.conferenceID.slice(6,9);
            var ph = bridge.tollNumber;
            var num = '('+ph.slice(2,5)+')'+' '+ph.slice(5,8)+'-'+' '+ph.slice(5,8)+'-'+ph.slice(8,12);
            var alertPopup = $ionicPopup.alert({
                title: 'Please Dial In',
                template: '<p><strong>Number:</strong></p><p>'+num+'</p><br><p><strong>ConfID:</strong></p><p>'+confId+'</p><br><p><strong>Viop:</strong></p><p>'+bridge.sipURI+'</p><br>'
            });
            alertPopup.then(function(res) {
                defer.resolve();
            });
            return defer.promise;
     };

    // end the conference bridge and delete it from turbobridge
    $.endBridge = function(id){
        var confId = id.replace(/-/g,'');
        Bridges.delete({id:confId}).$promise.then(function(){
            $.currentBridge = {};
        });
    };
}]);