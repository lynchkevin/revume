'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('settingsCtrl', ['$scope', '$rootScope','$state', '$cookieStore',
                             function ($scope,$rootScope,$state,$cookieStore) {

    $scope.logOut = function(){
        $cookieStore.remove('user');
        $rootScope.user._id = undefined;
        $state.go('app.welcome');
    };
    $scope.changePassword = function(){
        $state.go('app.changePassword');
    };
                                 
    $scope.setting = {actions:[
                                {name:'Log Out',action:$scope.logOut},
                                {name:'Change My Password',action:$scope.changePassword}
                      ]};
                                
  }]);
