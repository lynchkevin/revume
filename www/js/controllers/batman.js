'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('batmanCtrl', ['$scope', '$rootScope','$cookieStore','userService','$state','Library','introContent','buildDate',
function ($scope,$rootScope,$cookieStore,userService,$state,Library,introContent,buildDate) {

    $scope.build = {date:buildDate};
    $scope.Library = Library;
    function batmanOn(){
        $rootScope.user.batman = true;
        $scope.utility.actions[1].name = 'Stop Snooping...';
        $scope.utility.actions[1].action = $scope.logOutAs;
    }
                                 
    function batmanOff(){
        $rootScope.user.batman = false;
        $scope.utility.actions[1].name = 'Log In As..';
        $scope.utility.actions[1].action = $scope.logInAs;     
    }
                                 
    $scope.clearUserCookie = function(){
        $cookieStore.remove('user');
    };
                           
    $scope.logInAs = function(){
        $rootScope.user = {};
        $rootScope.user.email = 'klynch@volerro.com';
        userService.getUser($rootScope).then(function(user) {
            $rootScope.userInit(user,{stealthMode:true});
            batmanOn();
            $state.go('app.welcome');
        },function(err){//user not found try to register
            console.log(err);
        });
    }
    
    $scope.logOutAs = function(){
        $rootScope.user = $cookieStore.get('user');
        batmanOff();
    }
    
    $scope.setIntroContent = function(){
        $rootScope.user = {};
        $rootScope.user.email = 'klynch@volerro.com';
        userService.getUser($rootScope).then(function(user) {
            introContent.addIntroContent(user._id).then(function(){
                //then log in to check out the content
                $rootScope.userInit(user,{stealthMode:true});
                batmanOn();
                $state.go('app.welcome');
            });
        },function(err){//user not found try to register
            console.log(err);
        });          
    }
        
        
    $scope.utility = {actions:[
                                {name:'Clear User Cookie',action:$scope.clearUserCookie},
                                {name:'Log In As..',action:$scope.logInAs},
                                {name:'Set Intro Content',action:$scope.setIntroContent}
                              ]
                     };
    $scope.ls = {};
    $scope.ls.user = $rootScope.getLocalUser();
                                
  }]);
