'use strict';

/**
* a service to manage users  
*/
angular.module('starter.services')
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

.service('userService', ['Users','pnFactory','$q','$ionicPopup', 
function (Users,pnFactory,$q,$ionicPopup) {
    var $ = this;
    
    $.user = Users;
    
    $.getAll = function($scope){
        Users.byId.query().$promise.then(function(users){
            $scope.allUsers = users;
            $scope.user.email = 'klynch@volerro.com'
        });
    };
    
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
                                        

}]);