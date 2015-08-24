'use strict';

/**
* a service to manage teams  
*/
angular.module('RevuMe')

.factory('Scripts', ['$resource','baseUrl',function ($resource,baseUrl) {
    var target = baseUrl.endpoint+'/api/scripts/:id';  
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])

.service('ScriptService', ['Teams',
                         'Users',
                         'Scripts',
                         'rightsManager',
                         '$q',
                         '$rootScope',
function (Teams,Users,Scripts,rightsManager,$q,$rootScope) {
    var $ = this;
    
    $.daysLeft = function(userId){
        var defer = $q.defer();
        var left = 0;
        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        $.userScript(userId).then(function(script){
            if(script != undefined ){
                var today = new Date();
                var expDate = new Date(script.expirationDate);
                var left = Math.round(Math.abs((expDate.getTime() - today.getTime())/(oneDay)));
                if(left < 0)
                    left = 0;
                if(script.type == 'elite')
                    left = 36500;
                defer.resolve(left);
            } else {
                defer.reject('no scripts found!');
            }
        });
        return defer.promise;
    }
    //setup a new subscription
    // types are 'trial','monthly','annually' and 'elite'
    $.scriptTypes = ['trial','monthly','annually','elite'];
    $.newScript = function(type,members){
        var script = {};
        script.type = type;
        script.totalSeats = members.length;
        script.availableSeats = 0;
        script.members = [];
        script.startDate = new Date();
        script.expirationDate = new Date();
        var expMonth = script.expirationDate.getMonth();
        if(expMonth == 12){
            expMonth = 1;
            var year = script.expirationDate.getFullYear();
            year += 1;
            script.expirationDate.setFullYear(year);
            script.expirationDate.setMonth(expMonth);
        } else {
            expMonth += 1;
            script.expirationDate.setMonth(expMonth);    
        }
        members.forEach(function(member){
            script.members.push(member);
        });
        return script;
    }


    //get all scripts where I'm a member - should return 1
    $.userScript = function(userId){
        var defer = $q.defer();
        Scripts.query({user:userId}).$promise.then(function(scripts){
            defer.resolve(scripts[0]);
        });
        return defer.promise;
    }
    //create a new script
    $.save = function(script){
        var defer = $q.defer();
        Scripts.save(script).$promise.then(function(script){
            defer.resolve(script._id);
        });     
        return defer.promise;
    };
    //update a script
    $.update = function(_id,script){
        var defer = $q.defer();
        Scripts.update({id:_id},script).$promise.then(function(){
            defer.resolve();
        });
        return defer.promise;
    }
    //delete a script
    $.delete = function(_id){
        var defer = $q.defer();
        Scripts.delete({id:_id}).$promise.then(function(){
            defer.resolve();
        });
        return defer.promise;
    }
}]);