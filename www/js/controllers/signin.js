'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('signinCtrl', ['$scope', '$rootScope', 'authService','$ionicPopup','$state',
   function ($scope,$rootScope,authService,$ionicPopup,$state) {

       $scope.doSignIn = function(){
           var credentials = {};
           credentials.email = $scope.forms.signin.email;
           credentials.password = $scope.forms.signin.password;
           
           authService.authenticate(credentials).then(function(result){
               if(!result.success){
                    var alert = $ionicPopup.alert({
                        title:'Authentication Failed',
                        template:result.reason,
                    });
                    alert.then(function(res){});
               } else {
                    var user = result.user;
                    user.authData = user.password;
                    $rootScope.userInit(user);
                    $state.go('app.welcome');
               }
           });
            
       };
           
  }])
  .controller('signupCtrl', ['$scope', '$rootScope', '$state','authService','$ionicPopup','SendConfirm','DoConfirm',
   function ($scope,$rootScope,$state,authService,$ionicPopup,sendConfirm,doConfirm) {
       $scope.doSignUp = function(){
           authService.checkExists($scope.forms.signup.email).then(function(user){
               if(user._id){ //this user is in the system
                   if( user.password){ //if the have a password - don't sign them up again
                        var alert = $ionicPopup.alert({
                            title:'You\'re Already Signed Up',
                            template:'Please Sign In',
                        });
                        alert.then(function(){
                            $state.go('app.welcome');
                        });
                    } else { // otherwise it's an attendee becoming a new member - set their password
                        //let's confirm their email since they attended a meeting
                        doConfirm.confirm(user._id);
                        var credentials = {};
                        credentials.oldPassword = '';
                        credentials.email = $scope.forms.signup.email;
                        credentials.password = $scope.forms.signup.password;
                        authService.resetPassword(credentials).then(function(result){
                           if(result.success){
                               $state.go('app.welcome');
                           }else{
                                var alert = $ionicPopup.alert({
                                    title:'Error Setting PW!',
                                    template:'Please Try Again',
                                });
                                alert.then(function(){       
                                });
                            }
                        });
                    }
               } else {
                   var newUser = {};
                   newUser.firstName = $scope.forms.signup.firstName;
                   newUser.lastName = $scope.forms.signup.lastName;    
                   newUser.email = $scope.forms.signup.email;
                   newUser.password = $scope.forms.signup.password;
                   authService.signUp(newUser).then(function(user){
                       //validate email since they're new
                        sendConfirm.send(user);
                        $state.go('app.welcome');
                   });
                }
           });            
       };
       $scope.signIn = function(){
            authService.forceCredentials('app.welcome');
       }
           
  }])
  .controller('confirmCtrl', ['$scope','user',
   function ($scope,user) {
       $scope.user = user;
  }])
  .controller('profileCtrl', ['$scope', '$rootScope', '$state','authService','$ionicPopup',
   function ($scope,$rootScope,$state,authService,$ionicPopup) {
       var fullName = $rootScope.user.name;
       var parts  = fullName.split(' ');
       var firstName = parts[0];
       var lastName = parts[1];
       var email = $rootScope.user.email;
       
       $scope.forms.signup.firstName = firstName;
       $scope.forms.signup.lastName = lastName;
       $scope.forms.signup.email = email;
       
       $scope.updateProfile = function(){
           authService.checkExists($scope.forms.signup.email).then(function(exists){
               if(exists){
                    var alert = $ionicPopup.alert({
                        title:'You\'re Already Signed Up',
                        template:'Please Sign In',
                    });
                    alert.then(function(){
                        $state.go('app.welcome');
                    });
               } else {
                   var newUser = {};
                   newUser.firstName = $scope.forms.signup.firstName;
                   newUser.lastName = $scope.forms.signup.lastName;    
                   newUser.email = $scope.forms.signup.email;
                   newUser.password = $scope.forms.signup.password;
                   authService.signUp(newUser).then(function(user){
                       //validate email
                       console.log(user);
                   });
                }
           });            
       };
       $scope.signIn = function(){
            authService.forceCredentials('app.welcome');
       }
           
  }])
  .controller('changePasswordCtrl', ['$scope', '$rootScope', 'authService', '$timeout','$ionicPopup',
   function ($scope,$rootScope,authService,$timeout,$ionicPopup) {
       $scope.resetPassword = function(){
           var credentials = {};
           credentials.email = $scope.forms.resetPw.email;
           credentials.oldPassword = $scope.forms.resetPw.oldPassword;
           credentials.password = $scope.forms.resetPw.newPassword;
           credentials.repeat = $scope.forms.resetPw.repeat;
           
           if(credentials.password != credentials.repeat){
                var alert = $ionicPopup.alert({
                title:'Uh Oh!',
                template:'New Password Fields Don\'t Match',
                });
                alert.then(function(res){});
           }
           else{
               $scope.forms.resetPw.message='';
               authService.checkExists(credentials.email).then(function(exists){
                   if(exists){
                       authService.resetPassword(credentials).then(function(result){
                           if(!result.success){
                                var alert = $ionicPopup.alert({
                                    title:'Reset PW Error',
                                    template:result.reason,
                                });
                                alert.then(function(res){});
                           }
                           else{
                                var alert = $ionicPopup.alert({
                                    title:'Success!',
                                    template:'Your Password is Reset',
                                });
                                alert.then(function(res){});
                           }
                       });
                   }
                   else{
                        var alert = $ionicPopup.alert({
                            title:'Reset PW Error',
                            template:credentials.email+ ' not found',
                        });
                        alert.then(function(res){});
                   }
               }).catch(function(err){
                   console.log(err);
               });
           }
       };
           
  }]);