'use strict';

/**
* a service to manage users  
*/
angular.module('RevuMe')

.factory('UserLog', ['$resource','baseUrl',function ($resource,baseUrl) {
    var target = baseUrl.endpoint+'/api/userLog/:id';  
    return $resource(target,{id:'@id'});
}])
.service('logService', ['$rootScope','UserLog','pnFactory','$q',
function ($rootScope,UserLog,pnFactory,$q) {
    var $ = this;
    
    $.remoteLog = UserLog;
    $.ready = false;

    //wait for app to be ready then initialize
    $rootScope.$on('Revu.Me:Ready',function(){
        $.logChannel = $rootScope.mainChannel;
        $.device = $rootScope.device;
        $.user = $rootScope.user;
        $.startTime = new Date().getTime();
        $.ready = true;
    })

    //log the users activity - it is published and stored in the database.
    $.log = function(event,fromState,toState){
        if($.ready){
            var now = new Date().getTime();
            var elapsed = (now - $.startTime)/1000;
            console.log('Log got: event: ',event,' state :',toState);
            console.log('User is: ',$.user,'Device is: ',$.device);
            console.log('Elapsed Time is: ',elapsed,' seconds');
            var m = {
                user:$rootScope.user, //changed this to support impersonation
                device:$.device,
                fromState:fromState,
                toState:toState,
                elapsed:elapsed,
                date:now,
            }
            $.logChannel.publish(m);
        } 
    };
    $.getRecentHistory = function(numDaysPast){
        var deferred = $q.defer();
        UserLog.query({days:numDaysPast}).$promise.then(function(activities){
            //activities will be sorted from most recent to oldest
            deferred.resolve(activities);
        }).catch(function(err){
            deferred.reject(err);
        });
        return deferred.promise;
    }
    
    $.getUserHistory = function(userId){
        var deferred = $q.defer();
        UserLog.query({id:userId}).$promise.then(function(activities){
            //activities will be sorted from most recent to oldest
            deferred.resolve(activities);
        }).catch(function(err){
            deferred.reject(err);
        });
        return deferred.promise;
    }
    
    $.getRecentUserHistory = function(userId,numDaysPast){
        var deferred = $q.defer();
        UserLog.query({id:userId,days:numDaysPast}).$promise.then(function(activities){
            //activities will be sorted from most recent to oldest
            deferred.resolve(activities);
        }).catch(function(err){
            deferred.reject(err);
        });
        return deferred.promise;
    }
    
}]);