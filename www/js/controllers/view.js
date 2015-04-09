'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # SlideCtrl
 * Controller of the barebonesApp to Browse Slide Thumbnails
 */
angular.module('starter.controllers')
  .controller('ViewCtrl', ['$scope',
                           '$rootScope',
                           '$stateParams',
                           '$timeout',
                           '$window',
                           'pnFactory',
                           'userMonitor',
                           'Session',
                           'Decks',
                           '$ionicSlideBoxDelegate',
                           '$q',
function ($scope, $rootScope, $stateParams, 
           $timeout, $window, pnFactory, monitor, 
           Session,Decks,sbDelegate,$q) {
  

    var filename = "";
    var current = 0;
    var userId = $rootScope.user._id;
    var userName = $rootScope.user.name;
    
 
    //call this then wait for presentation commands from leader
    $scope.init = function() {
        //load the session deck and then subscribe and listen
        newPresentation($scope.deckId).then(function(){
        var channelName = $stateParams.id.toString()+".view_channel";
        $scope.channel = pnFactory.newChannel(channelName);
        var everyone = $scope.session.attendees;
        everyone.push($scope.session.organizer);
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
        switch(m.action){
            case "new" : 
                newPresentation(m.value).then(function(){
                    $timeout(function(){
                        $scope.name = $scope.presentation.name;
                    },0);
                });
                break;
            case "set" : 
                $timeout(function(){
                    // keep hammering the name until it takes
                    var n = $scope.presentation.name;
                    $scope.name = n;
                    $scope.setSlide(m.value);
                });
                console.log($scope.presentation.name);
                break;
            default: break;
        }
    };
 
    function handleHistory(hArray) {
        console.log(hArray);
        for(i = 0; i<hArray.length; i++){
            handleMessage(hArray[i]);
        }
    };      
                               
    
    function handlePresence(m){
        monitor.rollCall(m);
        var statusMessage = m.userName+" has ";
        switch(m.action){
            case "join" : 
                statusMessage = statusMessage+"joined";
                break;
            case "leave":
            case "timeout":
                statusMessage = statusMessage+"left";
                break;
        }
        $scope.$broadcast("show_message", statusMessage);
    }
      
    $scope.nextSlide = function() {
        $scope.setSlide(++current);
    };
    
    $scope.prevSlide = function() {
        $scope.setSlide(--current);
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
     $scope.session = Session.get({id: $stateParams.id}).$promise.then(function(session){
        $scope.session = session;
        $scope.deckId = session.decks[0]._id
        if($rootScope.user._id == undefined)
            $rootScope.$on('Revu.Me:Ready',function(event, data){
                $scope.init();
            });
         else
             $scope.init();
     }).catch(function(err){
            var str = "PresentationCtrl: error:"+err;
            alert(str);
     }); 
    // every is set up so lets initialize    
  }]);
