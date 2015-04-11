'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('splashCtrl', ['$scope', '$rootScope','$timeout','baseUrl',
                             function ($scope,$rootScope,$timeout,baseUrl) {
    $scope.image = baseUrl.endpoint+'/img/splash.png'; 
    $timeout(function(){
        $scope.user.id = $rootScope.user._id;
        $scope.user.name = $rootScope.user.name;
        $scope.users = $rootScope.users;
    },0);
      
    $scope.$on("presence_change",function(){
        $scope.$apply(function(){
            $scope.users = $rootScope.users;
        });
    });
      
        
    
  }]);
