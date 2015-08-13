'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('resetPasswordCtrl', ['$scope', '$rootScope', 'userService', '$timeout','$ionicPopup',
   function ($scope,$rootScope,userService,$timeout,$ionicPopup) {
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
               userService.checkExists(credentials.email).then(function(exists){
                   if(exists){
                       userService.resetPassword(credentials).then(function(result){
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
