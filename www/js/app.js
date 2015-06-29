 // Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', 
[   'config',
    'ionic',
    'ngResource',
    'ngAnimate',
    'evaporate'
]
)

//.constant("baseUrl",{"endpoint": "http://192.168.1.167:5000",
//                     "volerro": "https://rb.volerro.com"})
//.constant("baseUrl",{"endpoint": "https://m.volerro.com",
//                    "volerro": "https://rb.volerro.com"})
.run(["$ionicPlatform",
      "$rootScope",
      "$window",
      "userService",
      "pnFactory",
      '$timeout',
      '$location',
      '$state',
function($ionicPlatform,$rootScope,$window,userService,
          pnFactory,$timeout,$location,$state) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
    var userInit = function(user){
        $rootScope.user._id = user._id;   
        $rootScope.user.name = user.firstName+' '+user.lastName;
        $rootScope.user.email = user.email;
        $rootScope.$broadcast("userID",$rootScope.user);
        //manage user presence on the rootScope so all controllers can use
        $rootScope.mHandler = function(message){
            console.log("message from presence service",message);
        };
        $rootScope.pHandler = function(message){
            $rootScope.mainChannel.resolveUsers(message).then(function(users){
                $rootScope.users = users;
                console.log("got a status message", message);
                $timeout(function(){
                    $rootScope.$broadcast("presence_change");
                },0);
            });
        }
        pnFactory.init(user._id);
        $rootScope.mainChannel = pnFactory.newChannel("volerro_user");
        $rootScope.mainChannel.setUser($rootScope.user.name);
        $rootScope.mainChannel.subscribe($rootScope.mHandler,
                                     $rootScope.pHandler);
        $rootScope.$broadcast('Revu.Me:Ready');
    };
        

    $rootScope.login = function(){
        $rootScope.user = {};
        $rootScope.user.email = 'klynch@volerro.com';
        userService.getUser($rootScope).then(function(user) {
            userInit(user);
        },function(err){//user not found try to register
            userService.register($rootScope).then(function(user){
                userInit(user);
            }).catch(function(err){
                console.log(err);
            });
        });
    };
    //test to see if cordova.js is available if so - we're on a mobile device
    var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
    if ( app ) {
        // PhoneGap application
        $rootScope.isMobile = true;        
    } else {
        // Web page
        $rootScope.isMobile = false;
    };
    //get a user.id then call init...
    $rootScope.deepLink = false;
    if($rootScope.user == undefined){
        var param = $location.search();
        if(param.uid == undefined){
            $rootScope.deepLink = false;
            $rootScope.login();
        }else{
            $rootScope.deepLink = true;
            var User = userService.user.byId;
            User.get({id:param.uid}).$promise.then(function(user){
                $rootScope.user={};
                userInit(user);
            });
        };
            
    };
    //go to the home page after a deep link
    $rootScope.goHome = function(){
        $rootScope.deepLink = false;
        $state.transitionTo('app.welcome');
    }
    $rootScope.fullUrl = function(src){
        return baseUrl+src;
    };
    $rootScope.screenSize = function(){
        var width = verge.viewportW();
        var height = verge.viewportH();
        return {width:width, height:height};
    };
    //remove this at some point
    $rootScope.smallScreen = function(){
          var width = verge.viewportW();
          if(width<450)
            return true;
          else
           return false;
    };
    $window.addEventListener("beforeunload", function (e) {
        $rootScope.mainChannel.unsubscribe();

      //(e || $window.event).returnValue = null;
      return null;
    });

         
}])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  
  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
  })  
  .state('app.welcome', {
    url: "/welcome",
    views: {
      'menuContent': {
        templateUrl: "templates/splash.html",
        controller: 'splashCtrl'
      }
    }
  })
  .state('app.signUp', {
    url: "/signup",
    views: {
      'menuContent': {
        templateUrl: "templates/signup.html",
        controller: 'signupCtrl'
      }
    }
  })
    .state('app.signIn', {
    url: "/signin/:email",
    views: {
      'menuContent': {
        templateUrl: "templates/signin.html",
        controller: 'signinCtrl'
      }
    }
  })
      .state('app.resetPassword', {
    url: "/resetpassword",
    views: {
      'menuContent': {
        templateUrl: "templates/resetPassword.html",
        controller: 'resetPasswordCtrl'
      }
    }
  })
    .state('app.library', {
    url: "/library",
    views: {
      'menuContent': {
        templateUrl: "templates/library.html",
        controller: 'libraryCtrl'
      }
    }
  })
    .state('app.mobileLib', {
    url: "/mobile/library",
    views: {
      'menuContent': {
        templateUrl: "templates/libNav.html",
        controller:'libraryCtrl'
      }
    }
  })

  .state('app.viewer', {
    url: "/viewer/:id?sessionId",
    resolve: {
      session : ['Session','$stateParams','$q',
            function(Session,$stateParams,$q){ 
                           var defer = new $q.defer();
                           var deckIdx;
                           var session = {}
                           Session.get({id:$stateParams.id}).$promise.then(function(sess){
                               session = sess;
                               deckIdx = 0; //always 0 when session transitions state here
                               var _id = session.decks[deckIdx]._id;
                               defer.resolve(session)
                           }).catch(function(err){
                               defer.reject(err);
                           });
                           return defer.promise;
            }]
    },
    views: {
      'menuContent': {
        templateUrl: "templates/viewer.html",
        controller: 'ViewCtrl'
      }
    }
  })
    .state('app.viewerSessions', {
    url: "/viewerSessions",
    views: {
      'menuContent': {
        templateUrl: "templates/sessions.html",
        controller: 'SessionsCtrl'
      }
    }
  })
    .state('app.sessions', {
      url: "/sessions",
      views: {
          'menuContent': {
              templateUrl: "templates/sessions.html",
              controller: 'SessionsCtrl'
          }
      }
    })
    .state('app.attendeeSessions', {
      url: "/attendeeSessions",
      views: {
          'menuContent': {
              templateUrl: "templates/attendeeSessions.html",
              controller: 'SessionsCtrl'
          }
      }
    })
    // organizer session view
    .state('app.session', {
        url: "/sessions/:id",
        resolve: {
          session : ['Session','$stateParams','$q',
                function(Session,$stateParams,$q){ 
                               var defer = new $q.defer();
                               var deckIdx;
                               var session = {}
                               Session.get({id:$stateParams.id}).$promise.then(function(sess){
                                   if(sess._id != undefined){
                                   session = sess;
                                   deckIdx = 0; //always 0 when session transitions state here
                                   var _id = session.decks[deckIdx]._id;
                                   defer.resolve(session)
                                   }else{
                                       defer.reject({});
                                   }
                               }).catch(function(err){
                                   defer.reject(err);
                               });
                               return defer.promise;
                }]
        },
        views: {
          'menuContent': {
              templateUrl: "templates/session.html",
              controller: 'SessionCtrl'
          }
        }
    })
    //attendee session view
    .state('app.attsession', {
      url: "/attsessions/:id",
    resolve: {
      session : ['Session','$stateParams','$q',
            function(Session,$stateParams,$q){ 
                           var defer = new $q.defer();
                           var deckIdx;
                           var session = {}
                           Session.get({id:$stateParams.id}).$promise.then(function(sess){
                               if(sess._id != undefined){
                               session = sess;
                               deckIdx = 0; //always 0 when session transitions state here
                               var _id = session.decks[deckIdx]._id;
                               defer.resolve(session)
                               }else{
                                   defer.reject({});
                               }
                           }).catch(function(err){
                               defer.reject(err);
                           });
                           return defer.promise;
            }]
    },
      views: {
          'menuContent': {
              templateUrl: "templates/attendeesession.html",
              controller: 'SessionCtrl'
          }
      }
    })
    .state('app.presentations', {
      url: "/presentations",
      views:{
          'menuContent':{
            templateUrl: "templates/presentations.html",  
            controller: 'presentationsCtrl'
          }
      }
    })
    .state('app.presentation', {
    url: "/presentations/:id?idx",
      resolve: {
          session : ['Session','Decks','$stateParams','$q',
                function(Session,Decks,$stateParams,$q){ 
                               var defer = new $q.defer();
                               var deckIdx;
                               var session = {}
                               Session.get({id:$stateParams.id}).$promise.then(function(sess){
                                   session = sess;
                                   deckIdx = parseInt($stateParams.idx);
                                   var _id = session.decks[deckIdx]._id;
                                   return Decks.get({id:_id}).$promise;
                               }).then(function(deck){
                                   session.decks[deckIdx]=deck;
                                   session.deckIdx = deckIdx;
                                   defer.resolve(session);
                               }).catch(function(err){
                                   defer.reject(err);
                               });
                               return defer.promise;
                }]
      },
    views: {
        'menuContent': {
        templateUrl: "templates/presentation.html",
        controller : 'presentationCtrl'    
      }
    }
    }) 
    .state('app.revu', {
    url: "/revu/:id?uid",
      resolve: {
          session : ['Session','Decks','$stateParams','$q',
                function(Session,Decks,$stateParams,$q){ 
                               var defer = new $q.defer();
                               var session = {}
                               Session.get({id:$stateParams.id}).$promise.then(function(sess){
                                   session = sess;
                                   var promises = []
                                   session.decks.forEach(function(deck){
                                        promises.push(Decks.get({id:deck._id}).$promise);
                                   });
                                   return $q.all(promises);       
                               }).then(function(decks){
                                   //remove the decks with only id's
                                   session.decks = [];
                                   decks.forEach(function(deck){
                                       session.decks.push(deck);
                                   });
                                   session.deckIdx = 0;
                                   defer.resolve(session);
                               }).catch(function(err){
                                   defer.reject(err);
                               });
                               return defer.promise;
                }]
      },
    views: {
        'menuContent': {
        templateUrl: "templates/review.html",
        controller : 'reviewCtrl'    
      }
    }
    }) 
    .state('app.teams', {
      url: "/teams",
      views:{
          'menuContent':{
            templateUrl: "templates/teams.html",  
            controller: 'teamsCtrl'
          }
      }
    })
    .state('app.team', {
      url: "/team/:id?name",
      views:{
          'menuContent':{
            templateUrl: "templates/team.html",  
            controller: 'teamsCtrl'
          }
      }
    })
    .state('app.team.new', {
      url: "/team/new",
      views:{
          'menuContent':{
            templateUrl: "templates/team.html",  
            controller: 'teamsCtrl'
          }
      }
    })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/welcome');
});