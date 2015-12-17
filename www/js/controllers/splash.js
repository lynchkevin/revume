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
                             '$ionicSideMenuDelegate',
                             function ($scope,
                                        $rootScope,
                                        $timeout,
                                        $http,
                                        baseUrl,
                                        $ionicNavBarDelegate,
                                        tourService,
                                        ScriptService,
                                        $ionicSideMenuDelegate){

    $scope.image = baseUrl.endpoint+'/img/splash.png'; 
    $scope.init = function(){
        $timeout(function(){
            $scope.user._id = $rootScope.user._id;
            $scope.user.name = $rootScope.user.name;
            $scope.user.script = $rootScope.user.script;
            $scope.users = $rootScope.users;
            $scope.user.daysLeft = ScriptService.getDaysLeft($scope.user.script);
            $scope.buyButton = {text:'Upgrade Now'};
            var script = $scope.user.script;
            if(!script.autoRenew) //don't bug them if they autoRenew
                if(script.type == 'Monthly' || script.type == 'Annually')
                    $scope.buyButton.text = 'Renew Now';
                
        },0);
        if($rootScope.firstLogin != undefined && $rootScope.firstLogin == true){
            $rootScope.firstLogin = false;
            $ionicSideMenuDelegate.toggleLeft(true);
            $timeout(function(){
                $ionicSideMenuDelegate.toggleLeft(false);
            },5000);
        }
    };

    $scope.$on("presence_change",function(){
        $scope.$apply(function(){
            $scope.users = $rootScope.users;
        });
    });
    if($rootScope.user.script == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();             

    $scope.tourService = tourService;
  }]);
