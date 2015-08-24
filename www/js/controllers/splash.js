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
                             'ScriptService',
                             function ($scope,
                                        $rootScope,
                                        $timeout,
                                        $http,
                                        baseUrl,
                                        $ionicNavBarDelegate,
                                        tourService,
                                        ScriptService){

    $scope.image = baseUrl.endpoint+'/img/splash.png'; 
    $scope.init = function(){
        $timeout(function(){
            $scope.user._id = $rootScope.user._id;
            $scope.user.name = $rootScope.user.name;
            $scope.user.script = $rootScope.user.script;
            $scope.users = $rootScope.users;
            ScriptService.daysLeft($scope.user._id).then(function(daysLeft){
                $scope.user.daysLeft = daysLeft;
            });
        },0);
    };

    $scope.$on("presence_change",function(){
        $scope.$apply(function(){
            $scope.users = $rootScope.users;
        });
    });
    if($rootScope.user._id == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();             

    $scope.tourService = tourService;
  }]);
