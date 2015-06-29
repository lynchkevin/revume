'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('signinCtrl', ['$scope', '$rootScope', 'userService', '$stateParams',
   function ($scope,$rootScope,userService,$stateParams) {
       $scope.message = $stateParams.email+' is already in Revu.Me - Please sign in';
       $scope.doSignIn = function(){
           var credentials = {};
           credentials.email = $scope.forms.signin.email;
           credentials.password = $scope.forms.signin.password;
           
           userService.authenticate(credentials).then(function(user){
               if(user._id == undefined)
                   console.log('authentication failed');
                else {
                    $rootScope.user._id = user._id;   
                    $rootScope.user.name = user.firstName+' '+user.lastName;
                    $rootScope.user.email = user.email;
                    $rootScope.$broadcast("userID",$rootScope.user);
                }
           });
            
       };
           
  }]);
