'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # reviewCtl
 * Controller for Revu.me - leave behind viewer
 */
angular.module('RevuMe')
  .controller('reviewCtrl', ['$scope',
                           '$rootScope',
                           '$stateParams',
                           '$timeout',
                           '$window',
                           'session',
                           '$ionicSlideBoxDelegate',
                           '$ionicScrollDelegate',
                           '$ionicModal',
                           'EngagementMetrics',
                           'Revu',
                           '$q',
function ($scope, $rootScope, $stateParams, 
           $timeout, $window,session,$ionicSlideBoxDelegate,$ionicScrollDelegate,$ionicModal,EngagementMetrics,Revu,$q) {
  

    var filename = "";
    var userId = $rootScope.user._id;
    var userName = $rootScope.user.name;
    var timeLimit = 5.0 * 60 * 1000.0; //timeout in 5 minutes;
    //enable swipe slide
    $ionicSlideBoxDelegate.enableSlide(true);
    
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    };
    
    //session is resolved in the state change now so we can use it directly
    $scope.session = session;
    $scope.deckId = session.decks[0]._id //deck id comes in via idx in stateparams
    $scope.name = session.name;
    
    //call init to setup the session and the deck and connect to the review channel
    $scope.init = function() {
        $scope.presentation ={};
        angular.extend($scope.presentation, $scope.session.decks[0]);
        $scope.presentation.slides = [];
        for(var i = 0; i<$scope.session.decks.length; i++){
            var deck = $scope.session.decks[i];
            var idx = 0;
            deck.slides.forEach(function(slide){
                slide.deckIdx = i;
                slide.index = idx++;
                $scope.presentation.slides.push(slide);
            });
        };
        $scope.totalSlides = $scope.presentation.slides.length;
        $scope.current = 0;
        $scope.nextEnabled = true;
        $scope.prevEnabled = false;
        $scope.metrics = {};
        $scope.metrics.views = [];
        $scope.timeout = undefined;
        $scope.cleanupDone = false;
        startRevu($scope);
    };
    //cleanup called whenever we leave
    $scope.cleanUp = function(){
        if(!$scope.cleanupDone){
            $scope.cleanupDone = true;
            if($scope.session.leaveBehind)
                $scope.welcomeModal.remove();
            else
                $scope.contentRemoved.remove();
            endRevu($scope);
        }
    };
    //if the client times out - send them to revu.me
    function execTimeout($scope){
        $scope.cleanUp();
        $window.location.href = 'https://www.revu.me';
    };
    //restart a timeout evertime a new page is viewed
    function startTimeout($scope){
        if($scope.timeout != undefined){
            var cancelled = $timeout.cancel($scope.timeout);
            console.log('startTimeout - killing orphaned timeout');
        }
        $scope.timeout = $timeout(function(){execTimeout($scope);},timeLimit);
    };
    //stop the timeout when the page changes
    function stopTimeout($scope){
        var cancelled = false;
        if($scope.timeout != undefined){
            cancelled = $timeout.cancel($scope.timeout);
            console.log('cancel timeout = ',cancelled);
            $scope.timeout = undefined;
        };
    };
    //log a page view
    function logView($scope){
        var view = {};
        var slide = $scope.presentation.slides[$scope.current];
        stopTimeout($scope);
        view.timeStamp = Date.now();
        view.deckIdx = slide.deckIdx;
        view.page = slide.index;
        //log the duration of the previous view.
        var length = $scope.metrics.views.length;
        if(length>0){
            var lastView = $scope.metrics.views[length-1];
            lastView.duration = (view.timeStamp-lastView.timeStamp)/1000.0;
        };
        //push the new view
        $scope.metrics.views.push(view);  
        if(view.page >= 0) //page is -1 on endRevu
            startTimeout($scope);
    };
    //log the final page view before leaving
    function logLastView($scope){
        var view = {};
        var slide = $scope.presentation.slides[$scope.current];
        stopTimeout($scope);
        view.timeStamp = Date.now();
        view.deckIdx = slide.deckIdx;
        view.page = -1;
        //log the duration of the previous view.
        var length = $scope.metrics.views.length;
        if(length>0){
            var lastView = $scope.metrics.views[length-1];
            lastView.duration = (view.timeStamp-lastView.timeStamp)/1000.0;
        };
        //push the new view
        $scope.metrics.views.push(view);  
        if(view.page >= 0) //page is -1 on endRevu
            startTimeout($scope);
    };
    //initialize an interaction object
    function initInteraction($scope){
        var si = {};
        si.viewers = [];
        si.slideViews = [];
        si.viewers.push($rootScope.user._id);
        si.session = $scope.session._id;
        si.eventDate = new Date()
        return si;
    };
    //viewing is done - build the interaction metrics    
    function buildMetrics($scope){
        var interactions = [];
        var si = initInteraction($scope);
        var currentDeck = $scope.metrics.views[0].deckIdx;
        si.deck = $scope.session.decks[currentDeck]._id;
        $scope.metrics.views.forEach(function(view){
            //check for new deck and push results for last deck
            //also check for end of view and push results then too
            if(view.deckIdx != currentDeck || view.page == -1){
                interactions.push(si);
                si = initInteraction($scope);
                currentDeck = view.deckIdx;
                si.deck = $scope.session.decks[currentDeck]._id;
            }
            if(view.page >= 0){ // check for endRevu
                var sv = {};
                var v = {};
                sv.slideIndex = view.page;
                sv.duration = view.duration;
                sv._id = $scope.session.decks[view.deckIdx].slides[view.page]._id;
                sv.views = []
                v.userName = $rootScope.user.name;
                v.viewed = view.duration;
                v._id = sv._id;
                sv.views.push(v);
                si.slideViews.push(sv);
            };
        });    
        return interactions;
    };
    //start a revu session
    function startRevu($scope){
        $scope.metrics.user = $rootScope.user;
        $scope.session.who = $rootScope.user;
        logView($scope);
        //set the timeout function...
        startTimeout($scope);
        Revu.start.send({},$scope.session);
    };
    //save the metrics to the database and it will be viewable against the session
    function saveMetrics(interactions){
        var defer = $q.defer();
        var promises = [];
        interactions.forEach(function(si){
            var metrics = new EngagementMetrics;
            angular.extend(metrics,si);
            promises.push(metrics.$save());
        });
        $q.all(promises).then(function(){
            defer.resolve();
        }).catch(function(err){
            defer.reject();
        });
        return defer.promise;
    };
    //end a revu session via timeout or page unload    
    function endRevu($scope){
        logLastView($scope);
        $scope.current = -1; //mark the end of the revu session
        var si = buildMetrics($scope);
        saveMetrics(si).then(function(){
            //sendMail
        }).catch(function(err){
            console.log(err);
        });
        Revu.end.send({},$scope.session);
    };

    $scope.nextSlide = function() {
        $scope.setSlide(++$scope.current);
    };
    
    $scope.prevSlide = function() {
        $scope.setSlide(--$scope.current);
    };
      
    function validateSlide(slideNumber){
        if(slideNumber >= $scope.totalSlides-1) {
                $scope.nextEnabled = false;
                $scope.prevEnabled = true;
                $scope.current = $scope.totalSlides-1;
        } else if(slideNumber <= 0) {
                $scope.current = 0;
                $scope.prevEnabled = false;
                $scope.nextEnabled = true; 
        } else {   
            $scope.nextEnabled = true;
            $scope.prevEnabled = true;
        }
    }
    
    $scope.swipeSlide = function(slideNumber){
        $scope.current = slideNumber;
        validateSlide(slideNumber);
        logView($scope);
    }
    
    $scope.setSlide = function(slideNumber) {
        if(slideNumber >=0 && slideNumber < $scope.totalSlides)
            $ionicSlideBoxDelegate.slide($scope.current);
        else
            validateSlide(slideNumber);
        //this will automatically call swipeslide which does the rest....
    };
    
    //handle pinch and zoom
    $scope.updateSlideStatus = function(slide) {
      var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;
      if (zoomFactor == 1.0) {
        $ionicSlideBoxDelegate.enableSlide(true);
      } else {
        $ionicSlideBoxDelegate.enableSlide(false);
      }
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
                      };

    $window.onblur = function(event) { 
                        var msg = {action:'engagement',
                                   status: "distracted",
                                   who: userName,
                                   id:$rootScope.user._id,
                                  };
                        console.log("distracted");
                      };
    
    
    $window.onbeforeunload = function(event){
        $scope.cleanUp();
    };
        
      
    $scope.$on('$destroy', function(){
        $scope.cleanUp();
    });
    
    //handle visibility events
    $scope.$on('visibilityChanged', function(event, isHidden) {
        if (document.hidden) { 
            var msg = { action:'engagement',
                        status: "distracted",
                        who: userName,
                        id:$rootScope.user._id,
                        };
            console.log("distracted");
        }else{
            var msg = {action:'engagement',
                       status: "engaged",
                       who: userName,
                       id:$rootScope.user._id,
                      };
            console.log("engaged");
        }
    });

    // bring up a revu.me welcome splash 
    if($scope.session.leaveBehind){
        $ionicModal.fromTemplateUrl('templates/welcomeTemplate.html',{scope:$scope})
        .then(function(modal){
            $scope.welcomeModal = modal;
            $scope.welcomeModal.show();
            //show for 5 seconds then hide
            $timeout(function(){
                $scope.welcomeModal.hide();
                $scope.welcomeModal.remove();
            },3500);   
        });
    }else{
        $ionicModal.fromTemplateUrl('templates/contentRemoved.html',{scope:$scope})
        .then(function(modal){
            $scope.contentRemoved = modal;
            $scope.contentRemoved.show();
        });
    };

    if($rootScope.user._id == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();


  }]);
