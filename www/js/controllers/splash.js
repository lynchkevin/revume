'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('splashCtrl', ['$scope', 
                             '$rootScope',
                             '$timeout',
                             '$http',
                             'baseUrl',
                             '$ionicNavBarDelegate',
                             'tourService',
                             function ($scope,
                                        $rootScope,
                                        $timeout,
                                        $http,
                                        baseUrl,
                                        $ionicNavBarDelegate,
                                        tourService){

    $scope.image = baseUrl.endpoint+'/img/splash.png'; 
    $scope.init = function(){
        $timeout(function(){
            $scope.user._id = $rootScope.user._id;
            $scope.user.name = $rootScope.user.name;
            $scope.users = $rootScope.users;
        },0);
    };

    $scope.$on("presence_change",function(){
        $scope.$apply(function(){
            $scope.users = $rootScope.users;
        });
    });
    if($rootScope.user == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();             

    $scope.tourService = tourService;
  }]);
