'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # reviewCtl
 * Controller for Revu.me - leave behind viewer
 */
angular.module('starter.controllers')
  .controller('reviewCtrl', ['$scope',
                           '$rootScope',
                           '$stateParams',
                           '$timeout',
                           '$window',
                           'pnFactory',
                           'userMonitor',
                           'session',
                           'Decks',
                           '$ionicSlideBoxDelegate',
                           'BridgeService',
                           '$q',
function ($scope, $rootScope, $stateParams, 
           $timeout, $window, pnFactory, monitor, 
           session,Decks,sbDelegate,BridgeService,$q) {
  

    var filename = "";
    var current = 0;
    var userId = $rootScope.user._id;
    var userName = $rootScope.user.name;
    
    //session is resolved in the state change now so we can use it directly
    $scope.session = session;
    $scope.deckId = session.decks[stateParams.idx]._id //deck id comes in via idx in stateparams
    $scope.name = session.name;
    $scope.bridgeService = BridgeService;
    
    //call init to setup the session and the deck and connect to the review channel
    $scope.init = function() {
        //load the session deck and then subscribe and listen
        newPresentation($scope.deckId).then(function(){
        var channelName = $stateParams.id.toString()+"revu::review_channel";
        $scope.channel = pnFactory.newChannel(channelName);
        var everyone = [];
        everyone.push($rootScope.user);
        monitor.init(everyone);
        // subscribe and wait for presentation and slide number...
        $scope.channel.subscribe(handleMessage,handlePresence);
    });
    };
    
    $scope.cleanUp = function(){
        $scope.channel.unsubscribe();
    };
      
    function newPresentation(id){
        var defer = $q.defer();
        Decks.get({id:id}).$promise.then(function(decks){
            $scope.name = decks.name;
            $scope.presentation =decks;
            current = 0;
            $scope.setSlide(current);
            sbDelegate.update();
            defer.resolve();
        });
        return defer.promise;
    };
      
    function handleMessage(m) {
        console.log(m);
    };     
                               
  
    function handlePresence(m){
        console.log(m);
    }
      
    function sendView(page){
        var msg = {action:'view',
                   page: page,
                   who: userName,
                   id:userId,
                  };
        console.log("send view");
        $scope.channel.publish(msg);
    };

    $scope.nextSlide = function() {
        $scope.setSlide(++current);
        sendView(current);
    };
    
    $scope.prevSlide = function() {
        $scope.setSlide(--current);
        sendView(current);
    };
      
    $scope.setSlide = function(slideNumber) {
        current = slideNumber;
        $scope.viewingSlide = $scope.presentation.slides[current];
        sbDelegate.slide(current);
    };
    

    //handle focus events
    
    $scope.w = $window;
    $window.onfocus = function(event) { 
                        var msg = {action:'engagement',
                                   status: "engaged",
                                   who: userName,
                                   id:$rootScope.user._id,
                                  };
                        console.log("engaged");
                        $scope.channel.publish(msg);
                      };

    $window.onblur = function(event) { 
                        var msg = {action:'engagement',
                                   status: "distracted",
                                   who: userName,
                                   id:$rootScope.user._id,
                                  };
                        console.log("distracted");
                        $scope.channel.publish(msg);
                      };
    
    
    
      
    $scope.$on('$destroy', function(){
        $scope.cleanUp();
    });

    if($rootScope.user._id == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();

  }]);
