'use strict';

/**
* a service to manage users  
*/
angular.module('starter')
.factory('Users', ['$resource','baseUrl',function ($resource, baseUrl) {
    var _idTarget = baseUrl.endpoint+'/api/users/:id';
    var emailTarget = baseUrl.endpoint+'/api/users/email/:email';
    return {
        byId: $resource(_idTarget,
        {id:'@id'},
        {  update: {method:'PUT', params:{id:'@id'}}
        }),
        byEmail: $resource(emailTarget)
    };
}])

.factory('TeamUsers', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/teams/justUsers/:id';
    return $resource(target,
        {id:'@id'},
        {  update: {method:'PUT', params:{id:'@id'}}
        });
}])

.service('userService', ['Users','TeamUsers','pnFactory','$q','$ionicPopup','$ionicPopover','$rootScope', 
function (Users,TeamUsers,pnFactory,$q,$ionicPopup,$ionicPopover,$rootScope) {
    var $ = this;
    
    $.user = Users;
    //create a shell scope to use for the popover
    $.scope = $rootScope.$new();
    
    //show and hide the popover for a given directive
    $.directiveScope = undefined;
    $.creatingPopover = false;
    $.createPopover = function(){
        if($.popover == undefined && !$.creatingPopover){
            $.creatingPopover = true;
            $ionicPopover.fromTemplateUrl('templates/autocomplete.html', {
                scope: $.scope,
            }).then(function(pop) {
                $.creatingPopover = false;
                $.popover = pop;
            });
        }
    }
    $.showPopover = function(scope,el){
        $.directiveScope = scope;
        $.popover.show(el);
    }
    $.hidePopover = function(scope){
        $.popover.hide();
        $.directiveScope = undefined;
    }
    $.removePopover = function(scope){
        if($.popover != undefined){
            $.popover.remove();
            $.popover = undefined;
            $.directiveScope = undefined;
        }
    }    
        
    // this is used by the directives and the templates to popup autocomplete candidates
    $.scope.auto = {entries:[]};
    $.setResults = function(results){
        $.scope.auto.entries = results;
    }
    $.getResults = function($index){
        if($.scope.auto.entries.length >0) 
            if($index < $.scope.auto.entries.length)
                return $.scope.auto.entries[$index];
    }
    //keep a list of callbacks from directives
    $.callBacks = [];
    //connect to autoComplete callback
    $.onAutoComplete = function(directiveScope){
        var cbPair = {
                key:directiveScope.instanceName,
                callBack:directiveScope.doFinish
            };
        
        $.callBacks.push(cbPair);            
    }
                
    $.doAutoComplete = function(directiveScope, $index){
        $.callBacks.forEach(function(cbPair){
            if(cbPair.key == directiveScope.instanceName)
                cbPair.callBack($index);
        });
    };
    
    $.scope.finishComplete = function($index){
        $.doAutoComplete($.directiveScope,$index);
    };
    
    $.offAutoComplete = function(directiveScope){
        var found = [];
        for(var i = $.callBacks.length-1; i>=0 ; i--){
            if($.callBacks[i].key == directiveScope.instanceName)
                found.push(i);
        }
        found.forEach(function(index){
            $.callBacks.splice(index,1);
        });
    };
            
    
    $.find = function(query){
        return Users.byId.query(query).$promise;
    };
    
    $.getAll = function($scope){
        Users.byId.query().$promise.then(function(users){
            $scope.allUsers = users;
            $scope.user.email = 'klynch@volerro.com'
        });
    };
    
    $.usersIKnow = function(query){
        if($rootScope.user._id != undefined){
            var userId = $rootScope.user._id;
            var sendQuery = {user:userId};
            for (var attrname in query){
                sendQuery[attrname] = query[attrname];
            }
            return TeamUsers.query(sendQuery).$promise;
        } 
    }
    
    $.getUser = function($scope){
        var defer = $q.defer();
        $.getAll($scope);
          var myPopup = $ionicPopup.show({
//            template: '<input type="email" ng-model="user.email">',
            template: '<select ng-model="user.email"><option ng-repeat="user in allUsers">{{user.email}}</option></select>',
            title: 'Select Your Email',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                  if (!$scope.user.email) {
                    //don't allow the user to close unless he enters email
                    e.preventDefault();
                  } else {
                    return $scope.user.email;
                  }
                }
              }
            ]
          });
          myPopup.then(function(email) {
              return $.user.byEmail.get({email:email}).$promise;
          }).then(function(user){
              //user found return the user object
              if(user._id == undefined)
                  defer.reject('not found');
              defer.resolve(user);
          }).catch(function(err){
              defer.reject(err);
          });
        return defer.promise;
     };   
    
     $.register = function($scope){
         var defer = $q.defer();
         var usr = new $.user.byId;
          var myPopup = $ionicPopup.show({
            template: '<input type="name" placeholder="name" ng-model="user.name"><br><input type="email" placeholder="email" ng-model="user.email">',
            title: 'Register on Revu.Me',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                  if (!$scope.user.email||!$scope.user.name) {
                    //don't allow the user to close unless he enters email
                    e.preventDefault();
                  } else {
                    return $scope.user;
                  }
                }
              }
            ]
          });
          myPopup.then(function(user) {
              var names = user.name.split(" ");
              usr.email = user.email;
              usr.firstName = names[0];
              usr.lastName = names[1];
              $scope.user.firstName = usr.firstName;
              $scope.user.lastName = usr.lastName;
              usr.$save().then(function(u){
                  //user found return the user object
                  $scope.user._id=u._id;
                  defer.resolve($scope.user);
              }).catch(function(err){
                  defer.reject(err);
              });

            });
            return defer.promise;  
     };
}])

.service('userMonitor', ['$rootScope', function ($rootScope) {
    
    this.invited = []; // these are in the session - firstname, lastname
    this.present = []; // this is just a uuid firstname_lastname
    this.everyone = []; // add crashers to the list
    
    this.init = function(attendees){
        this.invited = attendees;
        this.invited.forEach(function(usr){
            usr.userName = usr.firstName+' '+usr.lastName;
            if(usr._id == $rootScope.user._id)
                usr.itsme = true;
            else
                usr.itsme = false;
        });
    };

    
    this.rollCall = function(m){
        var found = false;
        this.present = []
        var $present = this.present;
        this.invited.forEach(function(usr){
            if(usr._id == m.uuid){
                found = true;
                m.userName = usr.userName;
                if(m.action == 'join'){
                    usr.isOnline = true;
                    $present.push(usr);
                }
                else
                    usr.isOnline = false;
            }
        });
        if(!found)
            console.log('we need to add an intruder!');
        this.everyone= this.invited;
    }       
    
    this.noteEngagement = function(id,status){
        for(var i = 0; i < this.everyone.length; i++){
            if(this.everyone[i]._id == id){
                if(status == 'distracted'){
                    this.everyone[i].distracted = true;
                }else{
                    this.everyone[i].distracted = false;
                };
                
            }
        }
    };
                                        
    $rootScope.$on('$destroy',function(){
        $.scope.$destroy();
    })
}]);