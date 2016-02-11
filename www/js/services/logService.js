'use strict';

/**
* a service to manage users  
*/
angular.module('RevuMe')

.factory('UserLog', ['$resource','baseUrl',function ($resource,baseUrl) {
    var target = baseUrl.endpoint+'/api/userLog/';  
    return $resource(target);
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

    //determine an active bridge is running
    $.log = function(event,fromState,toState){
        if($.ready){
            var now = new Date().getTime();
            var elapsed = (now - $.startTime)/1000;
            console.log('Log got: event: ',event,' state :',toState);
            console.log('User is: ',$.user,'Device is: ',$.device);
            console.log('Elapsed Time is: ',elapsed,' seconds');
            var m = {
                user:$.user,
                device:$.device,
                fromState:fromState,
                toState:toState,
                elapsedTime:elapsed,
                date:now,
            }
            $.logChannel.publish(m);
        } 
    };
    
}]);