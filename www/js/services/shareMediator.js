'use strict';

/**
* shareMediator.js - service to provide roles for the library based on teams
 */
angular.module('starter')
    .factory('Share', ['$resource','baseUrl',function ($resource,baseUrl) {
        var target = baseUrl.endpoint+'/api/share/:id';  
        return $resource(target,
            {id:'@id'},
            {   delete: {method:'DELETE', params:{id:'@id'}},
                update: {method:'PUT', params:{id:'@id'}}
            });
    }])
    .service('shareMediator', ['Share',
                               'libraryRights',
                               'TeamService',
                               '$rootScope',
                               '$ionicModal',
                               '$q',
    function ( Share,libRights,teamService,$rootScope, $ionicModal,$q ) {
              
    var $ = this;
    
    $.init = function($scope){
        $.scope = $scope;
        $.childScope = $scope.$new();
        $.childScope.share = undefined;
        // attach functions to childscope for template
        $.childScope.cancelShare = $.cancelShare;
        $.childScope.updateSharing = $.updateSharing;
        teamService.getAll($rootScope.user._id).then(function(teams){
            $.childScope.teams = teams;
        })
        $ionicModal.fromTemplateUrl('templates/shareTemplate.html',{
            scope: $.childScope,
            animation:'slide-in-up'
        }).then(function(modal){
            $.childScope.shareModal = modal;
        });
    }
    // destroy the mediator
    $.destroy = function(){
        if($.childScope != undefined){
            $.childScope.shareModal.remove();
            $.childScope.$destroy();
        }
    }
    //set status of inclusion on available teams for this item
    function setTeamIncluded(inc,teams){
        teams.forEach(function(team){
            inc.forEach(function(t){
                if (team._id == t._id)
                    team.included = true;
            });
        });
    }         
    //share an item
    $.shareItem = function($index){
        var item = $.scope.navItems[$.scope.selectedNavId];
        teamService.getAll($rootScope.user._id).then(function(teams){
            $.childScope.teams = teams;
            return Share.query({item:item._id}).$promise;
        }).then(function(share){
            if(share.length == 1){
                $.childScope.share = share[0];
                setTeamIncluded(share[0].teams,$.childScope.teams);
            }
            $.childScope.shareModal.show();
        }).catch(function(err){
            console.log('shareMediator shareItem - error: ',err);
        });
    }
    $.cancelShare = function(){
        $.childScope.shareModal.hide();
        $.childScope.share = undefined;
    }
    //update sharing information
    $.updateSharing = function(){
        var teamsToShare = [];
        var model = $.scope.model;
        var item = $.scope.navItems[$.scope.selectedNavId];
        $.childScope.teams.forEach(function(team){
            if(team.included)
                teamsToShare.push(team._id);
        });
        $.saveShare(model,item,teamsToShare).then(function(){
            $.childScope.shareModal.hide();
        });
    }
    function getRole(team,userId){
        var role = undefined;
        team.members.forEach(function(member){
            if(member.user._id == userId)
                role = member.role;
        });
        return role;
    }
                                 
    $.saveShare = function(model,item,teams){
        var deferred = $q.defer();
        var share = new Share;
        var modelName = libRights.modelName(model);
        var existing = $.childScope.share;
        share.model = modelName;
        share.user = $rootScope.user._id;
        share.item = item._id;
        share.teams = [];
        teams.forEach(function(_id){
            share.teams.push(_id);
        });
        if(share.teams.length == 0){
            if(existing != undefined) 
                Share.delete({id:existing._id}).$promise.then(function(){
                    $.childScope.share = undefined;
                    deferred.resolve();
                });
            else
                deferred.resolve();
        } else if(existing != undefined){
            Share.update({id:existing._id},share).$promise.then(function(){
                $.childScope.share = undefined;
                deferred.resolve();
            });
        } else {
            share.$save().then(function(_id){
                share._id = _id;
                $.childScope.share = undefined;
                deferred.resolve();
            }).catch(function(err){
                deferred.reject(err);
            });
        }
        return deferred.promise;
    }     
    $.getItems = function($scope){
        var deferred = $q.defer();
         var model = $scope.model;       
        //get all of the owned navItems - need to get the model name somehow
        model.query({user:$rootScope.user._id}).$promise.then(function(owned){
            owned.forEach(function(item){
                item.role = 'Admin';
            });
            deferred.resolve(owned);
        })
        return deferred.promise;
    }
    
    $.getItems2 = function(model){
        var deferred = $q.defer();
        var modelName = libRights.modelName(model);
        
        //get all of the owned navItems - need to get the model name somehow
        model.query({user:$rootScope.user._id}).$promise.then(function(owned){
            var ownedItems = owned;
            ownedItems.forEach(function(item){
                item.accessRights = libRights.getAccessRights(model,libRights.roles[0]);
            });
            return Share.query({model:modelName,user:$rootScope.user._id}).$promise;
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
