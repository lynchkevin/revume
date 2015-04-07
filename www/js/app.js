 // Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', 
[   'ionic',
    'ngResource',
    'ngAnimate',
    'starter.directives',
    'starter.services',
    'starter.controllers',
    'flow'
]
)

.constant("baseUrl",{"endpoint": "http://192.168.1.167:5000"})
.run(["$ionicPlatform","$rootScope","$window","userService","pnFactory",
function($ionicPlatform,$rootScope,$window,userService,pnFactory) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
    var userInit = function(user){
        $rootScope.user.id = user._id;   
        $rootScope.user.name = user.firstName+' '+user.lastName;
        $rootScope.$broadcast("userID",$rootScope.user);
        //manage user presence on the rootScope so all controllers can use
        $rootScope.mHandler = function(message){
            console.log("message from presence service",message);
        };
        $rootScope.pHandler = function(message){
            $rootScope.users = $rootScope.mainChannel.resolveUsers(message);
            console.log("got a status message", message);
            $rootScope.$broadcast("presence_change");
        }
        pnFactory.init(user._id);
        $rootScope.mainChannel = pnFactory.newChannel("volerro_user");
        $rootScope.mainChannel.setUser($rootScope.user.name);
        $rootScope.mainChannel.subscribe($rootScope.mHandler,
                                     $rootScope.pHandler);
    };
        
    //get a user.id then call init...
    if($rootScope.user == undefined){
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
    $rootScope.fullUrl = function(src){
        return baseUrl+src;
    };
    $rootScope.screenSize = function(){
        var width = verge.viewportW();
        var height = verge.viewportH();
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
    controller: 'AppCtrl'
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
    .state('app.library', {
    url: "/library",
    views: {
      'menuContent': {
        templateUrl: "templates/library.html",
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
  .state('app.testLead', {
    url: "/testLead/:id?sessionId",
    views: {
      'menuContent': {
        templateUrl: "templates/testLead.html"
      }
    }
  })
  
  .state('app.testFollow', {
    url: "/testFollow/:id?sessionId",
    views: {
      'menuContent': {
        templateUrl: "templates/testFollow.html"
      }
    }
  })

  .state('app.viewer', {
    url: "/viewer/:id?sessionId",
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
    .state('app.viewerSession', {
    url: "/viewerSessions/:sessionId",
    resolve: {
            Presentation : 'Presentation',
            decks: function(Presentation){

                // Return a promise to make sure the customer is completely
                // resolved before the controller is instantiated
                return Presentation.query().$promise;
            }
        },
    views: {
        'menuContent': {
          templateUrl: "templates/sessionForViewer.html",
          controller: 'SessionDeferCtrl'
      }
    },
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
    .state('app.session', {
      url: "/sessions/:id",
      views: {
          'menuContent': {
              templateUrl: "templates/session.html",
              controller: 'SessionCtrl'
          }
      }
    })
  
    .state('app.presentations', {
      url: "/presentations",
      views: {
          'menuContent': {
              templateUrl: "templates/presentations.html",
              controller: 'presentationsCtrl'
          }
      }
      
    })
    .state('app.presentation', {
    url: "/presentations/:id?idx",
    views: {
        'menuContent': {
        templateUrl: "templates/presentation.html",
        controller : 'presentationCtrl'    
      }
    }
    }) 
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/welcome');
});