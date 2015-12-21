'use strict';

/**
* A Presentation Controller 
*/

angular.module('RevuMe')

.controller('presentationCtrl', ['$scope', 
                                 '$rootScope', 
                                 '$stateParams',  
                                 '$timeout',
                                 'pnFactory',
                                 '$ionicSlideBoxDelegate',
                                 'session',
                                 'userMonitor',
                                 'recorder',
                                 'presAnalyzer',
                                 'BridgeService',
                                 '$ionicScrollDelegate',
                                 'Screenleap',
                                 '$ionicModal',
 function ($scope, $rootScope, $stateParams, 
           $timeout,pnFactory,$ionicSlideBoxDelegate,session, 
           userMonitor,recorder,presAnalyzer,BridgeService,$ionicScrollDelegate,Screenleap,$ionicModal) {
    

    //session and decks are now resolved during the state change so we can use them directly
    $scope.footerClasses = ['normal','tall','hidden'];
    $scope.footer = {};
    $scope.footer.index = 0;
    $scope.footer.class = $scope.footerClasses[$scope.footer.index];

     
    $scope.session = session;
    $scope.deckIdx = session.deckIdx;
    $scope.name = session.name;
    $scope.presentation=$scope.session.decks[$scope.deckIdx];
    $scope.bridgeService = BridgeService;
    $scope.screenleap = Screenleap;
    

    function setInitials(){
        $scope.session.attendees.forEach(function(attendee){
            attendee.initials = attendee.firstName[0]+attendee.lastName[0];
        });
        var organizer = $scope.session.organizer;
        organizer.initials = organizer.firstName[0]+organizer.lastName[0];
    };
     
    $scope.init = function(){
        setInitials();
        $scope.current = 0;
        $scope.showUsers = true;
        var everyone = $scope.session.attendees;
        everyone.push($scope.session.organizer);
        userMonitor.init(everyone);
        $scope.everyone=everyone;
        $scope.present = [];
        $scope.mapShowing = false;
        $scope.buttonText = "Show All"
        var channelName = $stateParams.id.toString()+".view_channel";
        $scope.channel = pnFactory.newChannel(channelName);
        $scope.channel.setUser($rootScope.user.name);
        recorder.setChannel($scope.channel);
        BridgeService.setChannel($scope.channel);
        $scope.channel.subscribe(handleMessage,handlePresence);
        newPresentation($scope.presentation._id);
        $scope.setSlide($scope.current);
        $ionicSlideBoxDelegate.update();
        if($scope.session.bridge && !$scope.bridgeService.activeBridge())
            $scope.bridgeService.startBridge($scope.session.ufId);
        $ionicModal.fromTemplateUrl('templates/screenleap.html',{
            scope:$scope,
            animation:'slide-in-up',
        }).then(function(modal){
            $scope.instructions = modal;
        });
        $scope.screenSharingEnabled = !$rootScope.device.isIOS && !$rootScope.device.isAndroid 
                                        && !$rootScope.device.isWindowsPhone && !$rootScope.isMobile;
        $scope.isSharing = false;
      
    }
    
     //connect to screenleap events
    $scope.screenleap.$on('screenShareEnd',function(){
            $scope.isSharing = false;
            var m = {action:"screenShare",value:undefined,caller:"screenShare"};
            $scope.channel.publish(m);  
            $scope.catchUp();
    });
    $scope.screenleap.$on('downloadStarting',function(){
        $scope.instructions.show();
    });
    $scope.screenleap.$on('screenShareStarted',function(){
        $scope.instructions.hide();
    });
    //screenleap startup functions
    $scope.restartDownload = function(){
        $scope.screenleap.downloadAndStart();
    }
    $scope.startNative = function(){
        $scope.screenleap.startFromClick();
    }
    $scope.$on('$destroy',function(){
        $scope.instructions.remove();
    });    
    function sendEnd(){
        var m = {action:"end"};
        recorder.record(m);
    }
    // show the dialin information 
    $scope.showDialin = function(){
        BridgeService.showBridgeInfo();
    };
    //end the presentation
     $scope.endPresentation = function(){
        sendEnd();
        
        var results = presAnalyzer.analyze(recorder.export());
        var record = {session:$stateParams.id,
                      presentation:$scope.presentation._id,
                      results:results};
        presAnalyzer.save(record).then(function(_id){
            console.log(_id);
        });
     }
    //when done clean up
    $scope.cleanUp = function(){
        $scope.endPresentation()
        if($scope.channel != 'undefined'){
            $scope.channel.unsubscribe();
        }
    };     
    //toggle show users
    $scope.toggleShowUsers = function(){
        $scope.footer.index += 1;
        if($scope.footer.index == $scope.footerClasses.length)
            $scope.footer.index = 0;
        $scope.footer.class = $scope.footerClasses[$scope.footer.index];
    }
    
    //helper functions
    function newPresentation(id){
        var m = {action:"new",value: id,caller:"newPresentation"};
        recorder.record(m);
        $scope.channel.publish(m);
    };      

    function handlePresence(m){
        m.caller="handlePresence";
            userMonitor.rollCall(m);
        if(m.userName != undefined){
            recorder.record(m);
            var statusMessage = m.userName +" has ";
            switch(m.action){
                case "join" : 
                    statusMessage = statusMessage+"joined";
                    break;
                case "leave":
                case "timeout":
                    statusMessage = statusMessage+"left";
                    break;
            }
            $timeout(function(){
                $scope.everyone = userMonitor.everyone;
                $scope.present = userMonitor.present;
                $scope.$broadcast("show_message", statusMessage);
            },0);
            console.log($scope.everyone);
        }
    };
     
    function handleMessage(msg){
        switch(msg.action){
            case 'engagement':
                var str = msg.who + " is " + msg.status;
                console.log(str);
                msg.caller="handleMessage";
                recorder.record(msg);
                userMonitor.noteEngagement(msg.id,msg.status);
                $timeout(function(){
                    $scope.everyone = userMonitor.everyone;
                },0);
                break;
            case 'catchup':
                $scope.catchUp();
                break;
        }
    };
      
    $scope.toggleMap = function(){
        $scope.mapShowing = !$scope.mapShowing;
        $scope.buttonText = $scope.mapShowing ? "Hide All" : "Show All";
    };
      
    
    $scope.nextSlide = function() {
        $scope.setSlide(++$scope.current);
        $ionicSlideBoxDelegate.slide($scope.current);
        $ionicSlideBoxDelegate.update();
    };
    
    $scope.prevSlide = function() {
        $scope.setSlide(--$scope.current);
        $ionicSlideBoxDelegate.slide($scope.current);
        $ionicSlideBoxDelegate.update();
    };
     
    $scope.screenShare = function(){
        $rootScope.showLoading();
        $scope.screenleap.startSharing().then(function(shareSession){
            $scope.isSharing = true;
            $scope.shareSession = shareSession;
            var m = {action:"screenShare",value: shareSession.viewerUrl,caller:"screenShare"};
            $scope.channel.publish(m);  
            $rootScope.hideLoading();
        }).catch(function(response){
            $scope.isSharing = false;
            $rootScope.hideLoading();
        });
    }
    $scope.setSlide = function(slideNumber) {
        if(slideNumber >= $scope.presentation.slides.length-1) {
            $scope.current = $scope.presentation.slides.length-1;
            $scope.nextEnabled = false;
            $scope.prevEnabled = true;
        } else if(slideNumber <= 0) {
            $scope.current = 0;
            $scope.prevEnabled = false;
            $scope.nextEnabled = true;
        } else {   
            $scope.current = slideNumber;
            $scope.nextEnabled = true;
            $scope.prevEnabled = true;
        }
        $scope.viewingSlide = $scope.presentation.slides[$scope.current];
        //tell the viewers to update their slide
        var val = $scope.current.toString();
        var m = {action:"set",value: val,caller:"setSlide"};
        recorder.record(m);
        $scope.channel.publish(m);  
        $scope.$broadcast("slideChange",val);
    };
    $scope.catchUp = function(){
        if($scope.isSharing){
            var shareSession = $scope.shareSession;
            var m = {action:"screenShare",value: shareSession.viewerUrl,caller:"screenShare"};
            $scope.channel.publish(m);  
        } else {
            $scope.setSlide($scope.current);
        }
    }
    $scope.viewIdx = function() {
        return $scope.current;
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

    $scope.updateSlideStatus = function(slide) {
      var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;
      if (zoomFactor == 1.0) {
        $ionicSlideBoxDelegate.enableSlide(true);
      } else {
        $ionicSlideBoxDelegate.enableSlide(false);
      }
    };
}]);
    