'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('settingsCtrl', ['$scope', '$rootScope','$state',
                             function ($scope,$rootScope,$state) {

    $scope.changePassword = function(){
        $state.go('app.changePassword');
    };
                                 
    $scope.setting = {actions:[{name:'Change My Password',action:$scope.changePassword}]};
                                
  }]);
