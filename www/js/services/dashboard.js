'use strict';

/**
* a service to send email when attendees revu 
*/
angular.module('RevuMe')
.factory('DashStats', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/dashboard/:type/:category';
    return $resource(target,{type:'@type',category:'@category'});
}])
//authentication path on the user route
.service('Dashboard', ['DashStats','$rootScope','$q',function (DashStats,$rootScope,$q) {
    var $ = this;
    $.types = ['stats'];
    $.categories = ['files','meetings','views','engagement'];
    
    $.getFileStats = function(){
        var deferred = $q.defer();
        var type = $.types[0]; //stats;
        var category = $.categories[0];//files
        DashStats.get({type:type,category:category,userId:$rootScope.user._id})
        .$promise.then(function(stats){
            deferred.resolve(stats);
        }).catch(function(err){
            deferred.reject(err);
        });   
        return deferred.promise;
    }
    $.getMeetingStats = function(){
        var deferred = $q.defer();
        var type = $.types[0]; //stats;
        var category = $.categories[1];//meetings
        DashStats.get({type:type,category:category,userId:$rootScope.user._id})
        .$promise.then(function(stats){
            deferred.resolve(stats);
        }).catch(function(err){
            deferred.reject(err);
        });    
        return deferred.promise;
    }
    
    $.getRecentInteractions = function(){
        var deferred = $q.defer();
        var type = $.types[0]; //stats;
        var category = $.categories[2];//views
        DashStats.get({type:type,category:category,userId:$rootScope.user._id})
        .$promise.then(function(interactions){
            deferred.resolve(interactions);
        }).catch(function(err){
            deferred.reject(err);
        });    
        return deferred.promise;
    }
    $.getEngagment = function(){
        var deferred = $q.defer();
        var type = $.types[0]; //stats;
        var category = $.categories[3];//engagement
        DashStats.get({type:type,category:category,userId:$rootScope.user._id})
        .$promise.then(function(engagement){
            deferred.resolve(engagement);
        }).catch(function(err){
            deferred.reject(err);
        });    
        return deferred.promise;
    }
}]);
