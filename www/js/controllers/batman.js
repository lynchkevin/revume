'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('batmanCtrl', ['$scope', 
                             '$rootScope',
                             '$cookieStore',
                             'userService',
                             '$state',
                             'Library',
                             'introContent',
                             'buildDate',
                             'ScriptService',
                             'Braintree',
                             '$timeout',
function ($scope,
           $rootScope,
           $cookieStore,
           userService,
           $state,
           Library,
           introContent,
           buildDate,
           ScriptService,
           Braintree,
           $timeout) {

    $scope.build = {date:buildDate};
    $scope.Library = Library;
    $scope.start = new Date();
    function batmanOn(){
        $timeout(function(){
            $rootScope.user.batman = true;
            $scope.utility.actions[1].name = 'Stop Snooping...';
            $scope.utility.actions[1].action = $scope.logOutAs;
        },0);
    }
                                 
    function batmanOff(){
        $timeout(function(){
            $rootScope.user.batman = false;
            $scope.utility.actions[1].name = 'Log In As..';
            $scope.utility.actions[1].action = $scope.logInAs;     
        },0);
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
      
    $scope.userAdmin = function(){
        $state.go('app.userAdmin');
    }
    
    $scope.setToTrial = function(){
        ScriptService.setToTrial()
        .then(function(script){
            $rootScope.user.script = script;
            return Braintree.cancel(script)
        }).then(function(){
            $rootScope.user.script.braintreeId = undefined;
            $rootScope.user.script.members[0].user = $rootScope.user;
        }).catch(function(err){
            console.log(err);
        });
    }
    
    $scope.utility = {actions:[
                                {name:'Clear User Cookie',action:$scope.clearUserCookie},
                                {name:'Log In As..',action:$scope.logInAs},
                                {name:'Set Intro Content',action:$scope.setIntroContent},
                                {name:'User Admin',action:$scope.userAdmin},
                                {name:'Set to Trial',action:$scope.setToTrial}
                              ]
                     };
    $scope.ls = {};
    $scope.ls.user = $rootScope.getLocalUser();
                                
  }]);
