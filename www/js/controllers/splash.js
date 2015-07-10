'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('splashCtrl', ['$scope', '$rootScope','$timeout','$http','baseUrl','$ionicNavBarDelegate',
                             function ($scope,$rootScope,$timeout,$http,baseUrl,$ionicNavBarDelegate) {

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

//angular intro stuff
    $scope.CompletedEvent = function (scope) {
        console.log("Completed Event called");
    };

    $scope.ExitEvent = function (scope) {
        console.log("Exit Event called");
    };

    $scope.ChangeEvent = function (targetElement, scope) {
        console.log("Change Event called");
        console.log(targetElement);  //The target element
        console.log(this);  //The IntroJS object
    };

    $scope.BeforeChangeEvent = function (targetElement, scope) {
        console.log("Before Change Event called");
        console.log(targetElement);
    };

    $scope.AfterChangeEvent = function (targetElement, scope) {
        console.log("After Change Event called");
        console.log(targetElement);
    };

    $scope.IntroOptions = {
        steps:[
        {
            element: '#step1',
            intro: "This is the first tooltip."
        },
        {
            element: '#step2',
            intro: "<strong>You</strong> can also <em>include</em> HTML",
            position: 'right'
        },
        {
            element: '#step3',
            intro: 'More features, more fun.',
            position: 'left'
        },
        {
            element: '#step4',
            intro: "Another step.",
            position: 'bottom'
        },
        {
            element: '#step5',
            intro: 'Get it, use it.'
        }
        ],
        showStepNumbers: true,
        exitOnOverlayClick: true,
        exitOnEsc:true,
        nextLabel: '<strong>NEXT!</strong>',
        prevLabel: '<span style="color:green">Previous</span>',
        skipLabel: 'Exit',
        doneLabel: 'Thanks'
    };

    $scope.ShouldAutoStart = false;                                
  }]);
