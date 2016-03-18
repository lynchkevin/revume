'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('settingsCtrl', ['$scope', '$rootScope','$state', '$cookieStore','hello','SigninPartners',
                             function ($scope,$rootScope,$state,$cookieStore,hello,SigninPartners) {

    $scope.myAccount = function(){
        $state.go('app.myAccount');
    };
    $scope.logOut = function(){
        //unsubscribe from the main pubnub channel
        if($rootScope.mainChannel != undefined)
            $rootScope.mainChannel.unsubscribe();
        $cookieStore.remove('user');
        $rootScope.user._id = undefined;
        if($rootScope.user.network != undefined){
            var networkName = $rootScope.user.network;
            if(SigninPartners.network.hasOwnProperty(networkName)){
                var service = SigninPartners.network[networkName].helloService;
                hello.logout(service,{force:true});
            }
        }
        $state.go('app.welcome');
    };
    $scope.changePassword = function(){
        $state.go('app.changePassword');
    };
                                 
    $scope.setting = {actions:[
                                {name:'My Account',action:$scope.myAccount},
                                {name:'Log Out',action:$scope.logOut},
                                {name:'Change My Password',action:$scope.changePassword}
                      ]};
                                
  }]);
