 // Ionic RevuMe App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'RevuMe' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'RevuMe.controllers' is found in controllers.js
angular.module('RevuMe', 
[   'config',
    'ionic',
    'ngResource',
    'ngAnimate',
    'evaporate',
    'ngCookies',
    'FBAngular',
    'braintree-angular',
    'ngIOS9UIWebViewPatch',
    'fileBox',
]
)

//.constant("baseUrl",{"endpoint": "http://192.168.1.167:5000",
//                     "volerro": "https://rb.volerro.com"})
//.constant("baseUrl",{"endpoint": "https://m.volerro.com",
//                    "volerro": "https://rb.volerro.com"})

.run(["$ionicPlatform",
      "$rootScope",
      "$window",
      "$http",
      "userService",
      "pnFactory",
      '$timeout',
      '$location',
      '$state',
      '$cookieStore',
      'authService',
      '$ionicLoading',
      '$ionicHistory',
      'Library',
      'ScriptService',
      '$q',
function($ionicPlatform,$rootScope,$window,$http,
          userService,pnFactory,$timeout,$location,$state,
          $cookieStore,authService,$ionicLoading,
          $ionicHistory,Library,ScriptService,$q) {
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
    window.shouldRotateToOrientation = function(degrees) {
     return true;
    }
  });
    //initialize some globals
    $rootScope.deepLink = false;
    $rootScope.user = {};
    $rootScope.archive = {};
    $rootScope.archive.menu = false;
    $rootScope.spinnerShowing = false;
    $rootScope.toggleArchive = function(){
        $rootScope.archive.menu = !$rootScope.archive.menu;
        $rootScope.$broadcast('Revu.Me:Archive');
    }
    $rootScope.archiveOn = function(){
        var isArchive = $rootScope.archive.menu;
        return isArchive;
    };
    
    $rootScope.showLoading = function(){
        if(!$rootScope.spinnerShowing){
            $rootScope.spinnerShowing = true;
            $ionicLoading.show({
                template: '<ion-spinner icon="ripple"></ion-spinner>'
            });
        }
    };   
    $rootScope.hideLoading = function(){
        if($rootScope.spinnerShowing){
            $rootScope.spinnerShowing = false;
            $ionicLoading.hide();
        }
    };
    //Give Access to History
    $rootScope.history = $ionicHistory;
    
    $rootScope.userInit = function(user,userOptions){
        var defer = $q.defer();
        var options = angular.extend({},userOptions);
        $rootScope.user._id = user._id;   
        $rootScope.user.firstName = user.firstName;
        $rootScope.user.lastName = user.lastName;
        $rootScope.user.name = user.firstName+' '+user.lastName;
        $rootScope.user.email = user.email;
        $rootScope.user.authData = user.authData;
        ScriptService.userScript(user._id).then(function(script){
            $rootScope.user.script = script;
        
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
                }).catch(function(err){
                    console.log(err);
                });
            }
            pnFactory.init(user._id);
            $rootScope.mainChannel = pnFactory.newChannel("volerro_user");
            $rootScope.mainChannel.setUser($rootScope.user.name);
            $rootScope.mainChannel.subscribe($rootScope.mHandler,$rootScope.pHandler);
            //set up the authorization headers
            //$http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.user.authdata; // jshint ignore:line
            if(!options.stealthMode) {
                if($rootScope.isMobile)
                    $window.localStorage.setItem('user',JSON.stringify($rootScope.user));
                else
                    $cookieStore.put('user', $rootScope.user);  
            }
            $rootScope.$broadcast('Revu.Me:Ready');
            if(!$rootScope.isMobile){
                Library.cacheImages().then(function(){
                    var str = 'Cached '+Library.cachedImages.length+' Images';

                });
            }
            return defer.resolve();
        });
        return defer.promise;
    };
    $rootScope.getLocalUser = function(){
        var userString = $window.localStorage.getItem('user');
        var user = undefined;
        if(userString != undefined)
            user = JSON.parse(userString);
        return user;
    }
    // load up device information
    var device = {};
    
    device.isWebView = ionic.Platform.isWebView();
    device.isIPad = ionic.Platform.isIPad();
    device.isIOS = ionic.Platform.isIOS();
    device.isAndroid = ionic.Platform.isAndroid();
    device.isWindowsPhone = ionic.Platform.isWindowsPhone();
    device.currentPlatform = ionic.Platform.platform();
    device.currentPlatformVersion = ionic.Platform.version();
    $rootScope.device = device;
    console.log('device is: ',$rootScope.device);
    //test to see if cordova.js is available if so - we're on a mobile device
    var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
    if ( app ) {
        // PhoneGap application
        $rootScope.isMobile = true;        
    } else {
        // Web page
        $rootScope.isMobile = false;
    };
    $rootScope.showArchive = false;
    // listen for authenticated routes and force login if needed
    $rootScope.$on('$stateChangeStart', function(event,toState,toParams,fromState,fromParams){
        authService.listen(event,toState);
    });
    //go to the home page after a deep link
    $rootScope.goHome = function(){
        $rootScope.deepLink = false;
        $state.go('app.welcome');
    }
    $rootScope.newMeeting = function(stateName){
        $state.go(stateName).then(function(){
            $rootScope.$broadcast('Revu.Me:NewMeeting');
        });
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
        if($rootScope.mainChannel != undefined)
            $rootScope.mainChannel.unsubscribe();

      //(e || $window.event).returnValue = null;
      return null;
    });

         
}])

.config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider',function($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(30);
  $stateProvider
  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html"
  })  
  .state('app.welcome', {
    url: "/welcome",
    views: {
      'menuContent': {
        templateUrl: "templates/splash.html",
        controller: 'splashCtrl',
        resolve : {
            slideHint: function(){return true}
        }
      }
    }
  })
 .state('app.tour', {
    url: "/tour",
    views: {
      'menuContent': {
        templateUrl: "templates/splash.html",
        controller: 'splashCtrl',
        resolve : {
            slideHint: function(){return false}
        }
      }
    }
  })
  .state('app.signup', {
    url: "/signup",
    views: {
      'menuContent': {
        templateUrl: "templates/signup.html",
        controller: 'signupCtrl'
      }
    }
  })
  .state('app.signIn', {
    url: "/signin",
    views: {
      'menuContent': {
        templateUrl: "templates/signin.html",
        controller: 'signinCtrl'
      }
    }
  })
  .state('app.newMeeting', {
    url: "/newMeeting",
    views: {
      'menuContent': {
       templateUrl: "templates/sessions.html",
       controller: 'SessionsCtrl'
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
  .state('app.mobileNewMeeting', {
    url: "/mobile/newMeeting",
    views: {
      'menuContent': {
       templateUrl: "templates/sessions.html",
       controller: 'SessionsCtrl'
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
  .state('app.slideShow', {
    url: "/library/slideShow",
    views: {
      'menuContent': {
        templateUrl: "templates/slideShow.html",
        controller: 'slideShowCtrl'
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
  .state('app.newteam', {
      url: "/newTeam",
      views:{
          'menuContent':{
            templateUrl: "templates/team.html",  
            controller: 'teamsCtrl'
          }
      }
    })
  .state('app.batman', {
      url: "/batman",
      views:{
          'menuContent':{
            templateUrl: "templates/batman.html",  
            controller: 'batmanCtrl'
          }
      }
    })
  .state('app.settings', {
      url: "/settings",
      views:{
          'menuContent':{
            templateUrl: "templates/settings.html",  
            controller: 'settingsCtrl'
          }
      }
    })
  .state('app.changePassword', {
    url: "/changepassword",
    views: {
      'menuContent': {
        templateUrl: "templates/changePassword.html",
        controller: 'changePasswordCtrl'
      }
    }
  })  
  .state('app.confirmEmail', {
    url: "/confirmEmail/:id?",
      resolve: {
          user : ['Users','DoConfirm','$stateParams','$q',
                function(Users,DoConfirm,$stateParams,$q){ 
                               var defer = new $q.defer();
                               var byId = Users.byId;
                               DoConfirm.confirm({id:$stateParams.id}).$promise.then(function(result){
                                   if(result.success){
                                       byId.get({id:$stateParams.id}).$promise.then(function(user){
                                           defer.resolve(user);
                                       });
                                   } else
                                       defer.reject(result.reason);
                               });
                               return defer.promise;
                }]
    
      }, 
    views: {
    'menuContent': {
        templateUrl: "templates/emailConfirmed.html",
        controller : 'confirmCtrl'    
      }
    }
    }) 
    .state('app.userAdmin', {
    url: "/useradmin",
    views: {
      'menuContent': {
        templateUrl: "templates/userAdmin.html",
        controller: 'userAdminCtrl'
      }
    }
  }) 
  .state('app.myAccount', {
    url: "/myAccount",
    views: {
      'menuContent': {
        templateUrl: "templates/myAccount.html",
        controller: 'accountCtrl'
      }
    }
  }) 
    .state('app.payment', {
    url: "/payment",
    views: {
      'menuContent': {
        templateUrl: "templates/payment.html",
        controller: 'paymentCtrl'
      }
    }
  }) 
      .state('app.changeCard', {
    url: "/changeCard",
    views: {
      'menuContent': {
        templateUrl: "templates/changeCard.html",
        controller: 'cardCtrl'
      }
    }
  })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/signup');
    
}]);