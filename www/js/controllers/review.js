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
                           'session',
                           '$ionicSlideBoxDelegate',
                           '$ionicModal',
                           'EngagementMetrics',
                           'Revu',
                           '$q',
function ($scope, $rootScope, $stateParams, 
           $timeout, $window,session,sbDelegate,$ionicModal,eMetrics,Revu,$q) {
  

    var filename = "";
    var current = 0;
    var userId = $rootScope.user._id;
    var userName = $rootScope.user.name;
    var timeLimit = 5.0 * 60 * 1000.0; //timeout in 5 minutes;
    
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    };
    
    //session is resolved in the state change now so we can use it directly
    $scope.session = session;
    $scope.deckId = session.decks[0]._id //deck id comes in via idx in stateparams
    $scope.name = session.name;
    
    //call init to setup the session and the deck and connect to the review channel
    $scope.init = function() {
        $scope.deckIdx = 0;
        $scope.deckLength = $scope.session.decks[$scope.deckIdx].slides.length;
        $scope.offset = 0;
        $scope.presentation ={};
        angular.extend($scope.presentation, $scope.session.decks[$scope.deckIdx]);
        $scope.presentation.slides = [];
        for(var i = 0; i<$scope.session.decks.length; i++){
            var deck = $scope.session.decks[i];
            deck.slides.forEach(function(slide){
                $scope.presentation.slides.push(slide);
            });
        };
        current = 0;
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
        $window.location.href = 'http://revu.me';
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
        stopTimeout($scope);
        view.timeStamp = Date.now();
        view.deckIdx = $scope.deckIdx;
        view.page = current;
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
            var metrics = new eMetrics;
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
        current = -1; //mark the end of the revu session
        logView($scope);
        var si = buildMetrics($scope);
        saveMetrics(si).then(function(){
            //sendMail
        }).catch(function(err){
            console.log(err);
        });
        Revu.end.send({},$scope.session);
    };

    $scope.nextSlide = function() {
        $scope.setSlide(++current);
        logView($scope);
    };
    
    $scope.prevSlide = function() {
        $scope.setSlide(--current);
        logView($scope);
    };
      
    
    $scope.setSlide = function(slideNumber) {
        if(slideNumber >= $scope.deckLength-1) {
            //go to the next deck if it exists at start at slide 1
            if($scope.deckIdx <$scope.session.decks.length-1){
                $scope.offset += $scope.deckLength;
                $scope.deckIdx++;
                $scope.deckLength = $scope.session.decks[$scope.deckIdx].slides.length;
                current = 0;
            } else {
                current = $scope.session.decks[$scope.deckIdx].slides.length-1;
                $scope.nextEnabled = false;
                $scope.prevEnabled = true;
            }
        } else if(slideNumber < 0) {
            //go to the previous deck and start at the last slide
            if($scope.deckIdx>0){
                $scope.deckIdx--;
                $scope.deckLength = $scope.session.decks[$scope.deckIdx].slides.length;
                $scope.offset -= $scope.deckLength;
                current = $scope.session.decks[$scope.deckIdx].slides.length-1;
            } else{
                current = 0;
                $scope.prevEnabled = false;
                $scope.nextEnabled = true;
            }   
        } else {   
            $scope.current = slideNumber;
            $scope.nextEnabled = true;
            $scope.prevEnabled = true;
        }
        $scope.viewingSlide = $scope.presentation.slides[current+$scope.offset];
        sbDelegate.slide(current+$scope.offset);
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
    

    // bring up a revu.me welcome splash 
    if($scope.session.leaveBehind){
        $ionicModal.fromTemplateUrl('templates/welcomeTemplate.html',{scope:$scope})
        .then(function(modal){
            $scope.welcomeModal = modal;
            $scope.welcomeModal.show();
            //show for 5 seconds then hide
            $timeout(function(){
                $scope.welcomeModal.hide();
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
