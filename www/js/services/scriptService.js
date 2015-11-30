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
                         '$state',
function (Teams,Users,Scripts,rightsManager,$q,$rootScope,$state) {
    var $ = this;
    
    $.getAdmin = function(script){
        var admin = undefined;
        script.members.forEach(function(member){
            if(member.role == 'Admin'){
                admin = member.user;
                admin.name = admin.firstName+' '+admin.lastName;
            }
        });
        return admin;
    }
    
    $.getDaysLeft = function(script){
        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        if(script != undefined ){
        var today = new Date();
        var expDate = new Date(script.expirationDate);
        var left = Math.round((expDate.getTime() - today.getTime())/(oneDay));
        if(left < 0)
            left = 0;
        if(script.type == 'Elite')
            left = 36500;       
         return left;
        } else
            return -1;
    }
    
    $.daysLeft = function(userId){
        var defer = $q.defer();
        $.userScript(userId).then(function(script){
            var dLeft = $.getDaysLeft(script);
            if(dLeft >=0)
                defer.resolve(dLeft);
            else 
                defer.reject('no scripts found!');
        });
        return defer.promise;
    }
    
    $.getMonthlyCost = function(totalSeats){
        if(totalSeats < 25)
            return 35.00;
        else
            return 30.00;
    }
    
    $.calculateCost = function(script){
        var cost;
        var monthlyCostPerSeat = $.getMonthlyCost(script.totalSeats);
        switch (script.type){
            case 'Elite'    :    
            case 'Trial'    :   cost = 0;
                                break;
            case 'Monthly'  :   cost = monthlyCostPerSeat * script.totalSeats;
                                break;
            case 'Annually' :   cost = monthlyCostPerSeat * script.totalSeats * 10;
                                break;
        }
        return cost;
    }

    $.annualSavings = function(script){
        var moCost = $.getMonthlyCost(script.totalSeats);
        return moCost * script.totalSeats * 2;
    }
    
    //setup a new subscription
    // types are 'trial','monthly','annually' and 'elite'
    $.scriptTypes = ['Trial','Monthly','Annually','Elite'];
    
    function setExpiration(script){
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
    }
    
    $.setPendingScript = function(script){
        $.pendingScript = angular.copy(script);
    }
    
    $.getPendingScript = function(){
        if($.pendingScript == undefined)
            return $rootScope.user.script;
        else
            return $.pendingScript;
    }
        
    $.newScript = function(type,members){
        var script = {};
        script.type = type;
        script.totalSeats = members.length;
        script.availableSeats = 0;
        script.members = [];
        script.startDate = new Date();
        script.expirationDate = new Date();
        script.autoRenew = false;
        setExpiration(script);

        members.forEach(function(member){
            script.members.push(member);
        });
        return script;
    }
    
    $.setToTrial = function(){
        var deferred = $q.defer();
        var script = {};
        var btId = undefined;
        $.userScript($rootScope.user._id)
        .then(function(s){
            script = s;
            script.type = 'Trial';
            script.totalSeats = 1;
            script.availableSeats = 0;
            script.startDate = new Date();
            script.expirationDate = new Date();   
            setExpiration(script);
            script.members = [{user:$rootScope.user._id,role:'Admin'}];
            script.customerId = undefined;
            script.autoRenew = true;
            btId = script.braintreeId;
            script.braintreeId = undefined;
            return $.update(script._id,script)
        }).then(function(){
            script.braintreeId = btId;
            deferred.resolve(script);
        }).catch(function(err){
            console.log('error : ',err);
        });
        return deferred.promise;
    }
                
    $.checkScript = function(script,event){
        var days = $.getDaysLeft(script);
        if(days <=0 && script.type!='Elite'){
            if(event != undefined)
                event.preventDefault();
            $state.go('app.myAccount');
        }
        else
            return;
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
        script.availableSeats = script.totalSeats - script.members.length;
        console.log('ScriptService update - script is: ',script);
        var scrCopy = angular.copy(script);
        scrCopy.members.forEach(function(member){
            if(angular.isObject(member.user))
                member.user = member.user._id
        });
        console.log('ScriptService update - scrCopy: ',scrCopy);
        Scripts.update({id:_id},scrCopy).$promise.then(function(){
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