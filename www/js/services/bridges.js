'use strict';

/**
* a service to manage users  
*/
angular.module('RevuMe')

.factory('Bridges', ['$resource','baseUrl',function ($resource,baseUrl) {
    var target = baseUrl.endpoint+'/api/bridges/:id';  
    return $resource(target,{id:'@id'});
}])
.service('BridgeService', ['Bridges','$q','$ionicPopup','$rootScope', 
function (Bridges,$q,$ionicPopup,$rootScope) {
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
            if(!$rootScope.isMobile)
                return $.showBridgeInfo(bridge);
            else{
                var dialIt = bridge.tollNumber+',,,'+bridge.conferenceID;
                window.open('tel:' + dialIt, '_system'); 
                defer.resolve();
            }
        }).then(function(){
            defer.resolve();
        }).catch(function(err){
            console.log('startBridge: ',err);
            defer.reject(err);
        });
        return defer.promise;
    };

     function buildTemplate(phone,confId,voip){
         var num = '('+phone.slice(2,5)+')'+' '+phone.slice(5,8)+'-'+phone.slice(8,12);
         var dialIt = num+',,,'+confId+'#';
         var template = '<p><strong>Number:</strong></p>';
         //if($rootScope.isMobile)
             template += '<a href=\"tel:'+dialIt+'\">'+num+'</a>';
         //else 
          //   template += '<p>'+num+'</p>'
         template += '<br><p><strong>ConfID:</strong></p><p>'+confId+'</p><br><p><strong>Voip:</strong></p><p>'+voip+'</p><br>'
         return template;
     };
    
     // Show the Bridge Dial-in Information
     $.showBridgeInfo = function() {
            var defer = $q.defer();
            var bridge = $.currentBridge;
            if(bridge.conferenceID != undefined){
                var confId = bridge.conferenceID.slice(0,3)+'-'+bridge.conferenceID.slice(3,6)+'-'+bridge.conferenceID.slice(6,9);
                var ph = bridge.tollNumber;
                var num = '('+ph.slice(2,5)+')'+' '+ph.slice(5,8)+'-'+ph.slice(8,12);
                var dialIt = num+',,,'+bridge.conferenceID+'#';
                var alertPopup = $ionicPopup.alert({
                    title: 'Please Dial In',
                    template: buildTemplate(bridge.tollNumber, bridge.conferenceID, bridge.sipURI)
                });
                alertPopup.then(function(res) {
                    defer.resolve();
                });
                
            }
            return defer.promise;
     };

    // end the conference bridge and delete it from turbobridge
    $.endBridge = function(id){
        var confId = id.replace(/-/g,'');
        Bridges.delete({id:confId}).$promise.then(function(){
            $.currentBridge = {};
        });
    };
    $.endMeeting = function(){
        var m = {action:"end"};
        if($.currentChannel)
            $.currentChannel.publish(m);
    };
    $.setChannel = function(channel){
        $.currentChannel = channel;
    };
}]);