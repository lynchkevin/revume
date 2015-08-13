'use strict';

/**
* shareMediator.js - service to provide roles for the library based on teams
 */
angular.module('RevuMe')
    .factory('Share', ['$resource','baseUrl',function ($resource,baseUrl) {
        var target = baseUrl.endpoint+'/api/share/:id';  
        return $resource(target,
            {id:'@id'},
            {   delete: {method:'DELETE', params:{id:'@id'}},
                update: {method:'PUT', params:{id:'@id'}}
            });
    }])
    .service('shareMediator', ['Share', 'libraryRights','teamService','$rootScope','$q',
                             function (Share, libRights, teamService, $rootScope,$q ) {
                                 
          
    var $ = this;
                                 
    function getRole(team,userId){
        var role = undefined;
        team.members.forEach(function(member){
            if(member.user._id == userId)
                role = member.role;
        });
        return role;
    }
                                 
    $.shareItem = function(model,item,teams){
        var deferred = $q.defer();
        var share = new Share;
        share.model = model;
        share.item = item._id;
        share.teams = [];
        teams.forEach(function(team){
            share.teams.push(team._id);
        });
        share.$save().then(function(){
            deferred.resolve();
        }).catch(function(err){
            deferred.reject(err);
        });
        return deferred.promise;
    }
                                 
    $.getItems = function(model){
        var deferred = $q.defer();
        
        //get all of the owned navItems - need to get the model name somehow
        model.query({user:$rootScope.user._id}).$promise.then(function(owned){
            var ownedItems = owned;
            ownedItems.forEach(function(item){
                item.accessRights = libRights.getAccessRights(model,libRights.roles[0]);
            });
            return Share.query({model:model.name,user:$rootScope.user._id}).$promise;
        }).then(function(shares){
            //now get all the shared items
            var sharedItems = [];
            shares.forEach(function(share){
                var item = share.item;
                var role = getRole(share.team,$rootScope.user._id);
                item.accessRights = librRights.getAccessRights(model,role);
            });
            ownedItems.concat(sharedItems);
            deferred.resolve();
        }).catch(function(err){
            deferred.reject(err);
        }); 
        return deferred.promise;
    }
           
    
  }]);
