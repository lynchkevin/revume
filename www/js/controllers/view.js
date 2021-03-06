'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # SlideCtrl
 * Controller of the barebonesApp to Browse Slide Thumbnails
 */
angular.module('RevuMe')
  .controller('ViewCtrl', ['$scope',
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
                           '$ionicModal',
                           'authService',
                           '$state',
                           '$ionicPopup',
                           '$ionicScrollDelegate',
                           '$location',
                           '$sce',
function ($scope, $rootScope, $stateParams, 
           $timeout, $window, pnFactory, userMonitor, 
           session,Decks,$ionicSlideBoxDelegate,BridgeService,$q,$ionicModal,
           authService,$state,$ionicPopup,$ionicScrollDelegate,$location,$sce) {
  

    var filename = "";
    var current = 0;
    var userId = $rootScope.user._id;
    var userName = $rootScope.user.name;
    
    //session is resolved in the state change now so we can use it directly
    $scope.session = session;
    $scope.deckId = session.decks[0]._id //resolve always assumes deckId of 0
    $scope.name = session.name;
    $scope.bridgeService = BridgeService;
    
    //call this then wait for presentation commands from leader
    $scope.init = function() {
        //load the session deck and then subscribe and listen
        newPresentation($scope.deckId).then(function(){
            var channelName = $stateParams.id.toString()+".view_channel";
            $scope.channel = pnFactory.newChannel(channelName);
            var everyone = $scope.session.attendees;
            everyone.push($scope.session.organizer);
            userMonitor.init(everyone);
            // subscribe and wait for presentation and slide number...
            $scope.channel.subscribe(handleMessage,handlePresence);
            $scope.screenSharing = {visible:false};
            //catch the user up if they are re-joining or joining late
            var msg = {action:'catchup',
                       status: "now",
                       who: userName,
                       id:$rootScope.user._id,
                      };
            console.log("catchup");
            $scope.channel.publish(msg);
        });
        //modal for selecting decks to add to session
        $ionicModal.fromTemplateUrl('templates/presEndTemplate.html',{
            scope: $scope,
            animation:'slide-in-up'
        }).then(function(modal){
            $scope.signupModal = modal;
        }); 

    };
    
    $scope.cleanUp = function(){
        $scope.channel.unsubscribe();
        if($scope.signupModal != undefined)
            $scope.signupModal.remove()
    };
      
    $scope.doSignUp = function(){
        $scope.signupModal.hide();
        var newMember = {};
        if(this.forms != undefined){
            var password = this.forms.signup.password;
            var names = $rootScope.user.name.split(' ');
            newMember.firstName = names[0];
            newMember.lastName = names[1];
            newMember.email = $rootScope.user.email;
            newMember.password = password;
            newMember.oldPassword = '';
            authService.checkExists(newMember.email).then(function(user){
                if(!user.password){ //only sigup members if they aren't already members
                    authService.resetPassword(newMember).then(function(result){
                       if(result.success){
                           $state.go('app.welcome');
                       }else{
                            var alert = $ionicPopup.alert({
                                title:'Error Setting PW!',
                                template:'Please Try Again',
                            });
                            alert.then(function(){       
                            });
                        }
                    });
                } else {
                    //alread a member - sign them in
                    $state.go('app.welcome');
                }
            });
        }
    }
    function newPresentation(id){
        var defer = $q.defer();
        Decks.get({id:id}).$promise.then(function(decks){
            $scope.name = decks.name;
            $scope.presentation =decks;
            current = 0;
            $scope.setSlide(current);
            $ionicSlideBoxDelegate.update();
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
            case "screenShare" :
                if(m.value != undefined){
                    if(!$scope.screenSharing.visible)
                        $timeout(function(){
                             $scope.screenSharing = {visible:true,url:$sce.trustAsResourceUrl(m.value)};
                        },0);
                }else{
                    $timeout(function(){
                              $scope.screenSharing = {visible:false};
                    },0);
                }
                break;
            case "end" :
                $scope.signupModal.show();
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
        userMonitor.rollCall(m);
        if(m.userName != undefined){
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
        $ionicSlideBoxDelegate.slide(current);
    };
    
    //handle pause and resume events
    $scope.$on('Revu.Me::Pause',function(){
        var msg = {action:'engagement',
                   status: "distracted",
                   who: userName,
                   id:$rootScope.user._id,
                  };
        console.log("Pause:distracted");
        $scope.channel.publish(msg);
    });
    $scope.$on('Revu.Me::Resume',function(){
        var msg = {action:'engagement',
                   status: "engaged",
                   who: userName,
                   id:$rootScope.user._id,
                  };
        console.log("Resume:engaged");
        $scope.channel.publish(msg);
    });
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

    $scope.goFullScreen = function(){
        function launchFullScreen(element) {
        if (element.requestFullscreen)
        { element.requestFullscreen(); }
        else if (element.mozRequestFullScreen)
        { element.mozRequestFullScreen(); }
        else if (element.webkitRequestFullscreen)
        { element.webkitRequestFullscreen(); }
        else if (element.msRequestFullscreen)
        { element.msRequestFullscreen(); }
        }
    }
    
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
