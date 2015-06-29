'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('signupCtrl', ['$scope', '$rootScope', '$state','userService',
   function ($scope,$rootScope,$state,userService) {
       $scope.doSignUp = function(){
           userService.checkExists($scope.forms.signup.email).then(function(exists){
               if(exists){
                    var email = $scope.forms.signup.email;
                    $state.transitionTo('app.signIn',{email:email})
               } else {
                   var newUser = {};
                   newUser.firstName = $scope.forms.signup.firstName;
                   newUser.lastName = $scope.forms.signup.lastName;    
                   newUser.email = $scope.forms.signup.email;
                   newUser.password = atob($scope.forms.signup.password);
                   userService.signUp(newUser).then(function(user){
                       //set rootscope to user
                       console.log(user);
                   });
                }
           });            
       };
           
  }]);
