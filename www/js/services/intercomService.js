'use strict';

/**
* a service to manage intercom.io user assistance/engagement tools
*/
angular.module('RevuMe')

.service('intercomService', ['$window','$rootScope','IntercomToken',
function ($window, $rootScope, IntercomToken) {
    var $ = this;
    $.userInfo = undefined;
    
    $.boot = function(){
            //boot Intercom
            if($rootScope.user && $rootScope.user.name){
                $window.Intercom('boot', {
                       app_id: IntercomToken,
                       email: $rootScope.user.email,
                       user_id: $rootScope.user._id,
                       name : $rootScope.user.name,
                       new_team_at:null,
                       file_upload_at:null,
                });
                $.userInfo = {
                    app_id:IntercomToken,
                    user_id: $rootScope.user._id,
                    email: $rootScope.user.email,
                };
            }
    }
    
    $.update = function(extensions){
        if($.userInfo){
            var userData = {};
            if(angular.isObject(extensions)){
                angular.extend(userData,$.userInfo,extensions);
                $window.Intercom('update',userData);
            }else{
                $window.Intercom('update',$.userInfo)
            }
        }
    }
    
    $.trackEvent = function(name,metaData){
        if(name){
            if(angular.isObject(metaData))
               $window.Intercom('trackEvent',name,metaData);
            else
               $window.Intercom('trackEvent',name);
        }
    }
    $.hide = function(){
        $window.Intercom('hide');
    }
    $.show = function(){
        $window.Intercom('show');
    }
    $.shutdown = function(){
        $window.Intercom('shutdown');
    }
    
}]);