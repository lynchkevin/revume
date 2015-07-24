'use strict';

/**
* a service to manage user authentication  
*/
angular.module('starter')
//authentication path on the user route
.factory('Auth', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/users/auth/:email';
        return $resource(target,
        {email:'@email'},
        {  auth: {method:'PUT', params:{email:'@email'}}
        });

}])
//get
//base64 encode/decode
.factory('Base64', [function () {
    /* jshint ignore:start */
  
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  
    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
  
            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
  
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
  
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
  
                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);
  
            return output;
        },
  
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
  
            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  
            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));
  
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
  
                output = output + String.fromCharCode(chr1);
  
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
  
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
  
            } while (i < input.length);
  
            return output;
        }
    };
  
    /* jshint ignore:end */
}])

.service('authService', ['Auth','Users','pnFactory','$q','$ionicPopup','$rootScope','Base64','$location','$cookieStore','$state',
function (Auth,Users,pnFactory,$q,$ionicPopup,$rootScope,Base64,$location,$cookieStore,$state) {
    var $ = this;
    
     $.user = Users;    
    //check if a user exists in the database
     $.checkExists = function(email){
        var defer = $q.defer();
        $.user.byEmail.get({email:email}).$promise.then(function(user){
            defer.resolve(user);
        }).catch(function(err){
            defer.reject(err);
        });
        return defer.promise;
     };
     // signup a new user to the database
     $.signUp = function(newUser){
        var defer = $q.defer();
        var usr = new $.user.byId;
        angular.extend(usr,newUser);
        // convert password a base
        usr.password = Base64.encode(usr.email+':'+usr.password);
        usr.$save().then(function(u){
            //user found return the user object
            defer.resolve(u);
        }).catch(function(err){
                defer.reject(err);
        });
        return defer.promise;
     };
    //reset a users password
    $.resetPassword=function(credentials){
        var defer = $q.defer();
        var authData = Base64.encode(credentials.email+':'+credentials.password);
        credentials.password = authData;
        var oldAuthData = Base64.encode(credentials.email+':'+credentials.oldPassword);
        credentials.oldPassword = oldAuthData;
        $.user.byEmail.update({email:credentials.email},credentials).$promise.then(function(response){
                defer.resolve(response);
        });
        return defer.promise;
    };
    $.authenticate = function(credentials){
        var defer = $q.defer();
        var authData = Base64.encode(credentials.email+':'+credentials.password);
        credentials.password = authData;
        Auth.auth({email:credentials.email},credentials).$promise.then(function(result){
            defer.resolve(result);
        }).catch(function(err){
            defer.reject(err);
        });
        return defer.promise;
    };
    
    $.signIn = function(){
        var defer = $q.defer();
        $rootScope.user = {};
        var myPopup = $ionicPopup.show({
            template: '<input type="email" placeholder="email" ng-model="user.email"><br><input type="password" placeholder="password" ng-model="user.password">  <br><input style="width:10%" type="checkbox" ng-model="user.resetPassword"><p style="line-height:normal;color:red;display:inline">Reset My Password (add email)</p>',
            title: 'Sign In',
            scope: $rootScope,
            buttons: [
              { text: '<b>Sign In</b>',
                type: 'button-positive',
                onTap: function(e) {
                  if(!$rootScope.user.resetPassword && $rootScope.user.email && $rootScope.user.password)
                      return $rootScope.user; //normal login
                  else if($rootScope.user.resetPassword && $rootScope.user.email)
                      return $rootScope.user; //reset password
                  else 
                      e.preventDefault();   //nope - you stay here until you get it right
                }
              }
            ]
          });
          myPopup.then(function(user) {
            if(user.resetPassword){
                 var result = {success:false,reason:'resetPassword',user:user};
                 defer.resolve(result);
            } else {
            var credentials = {};
            credentials.email = user.email;
            credentials.password = user.password;
            $.authenticate(credentials).then(function(result){    
                  if(result.success){
                      //authenticated
                      result.user.authData = result.user.password;
                      defer.resolve(result);
                  }else{
                        var alert = $ionicPopup.alert({
                            title:'Authentication Failed',
                            template:result.reason,
                        });
                        alert.then(function(){
                            var result= {success:false,reason:'authentication failed'};
                            defer.resolve(result);
                        });
                  }
              });  
            }
          });
        return defer.promise;  
     };
    //authenticate certain routes
    var publicStates = ['app.signup','app.changePassword','app.confirmEmail'];
    function isPrivate(state){
        var isPrivate=true;
        publicStates.forEach(function(publicState){
            if(state.name == publicState)
                isPrivate = false;
        });
        return isPrivate;
    }
    
    $.forceCredentials = function(successState){
        $.signIn().then(function(result){
            if(result.success){
                $rootScope.userInit(result.user);
                if(successState != undefined)
                    $state.go(successState);
            }
            else if(result.reason == 'resetPassword')
                console.log('resetPassword');
            else
                $.forceCredentials(successState);
        });
    }
    
    $.listen = function(event,toState){
        $rootScope.deepLink = false;
        if(isPrivate(toState)){ //authenticate private routes by forcing login
            //check if it's a deeplink with a user._id as a link param
            var param = $location.search(); //deeplinks have the user._id as a uid param in the url
            if(param.uid != undefined){
                $rootScope.deepLink = true;
                var User = $.user.byId;
                User.get({id:param.uid}).$promise.then(function(user){
                    $rootScope.user={};
                    $rootScope.userInit(user);
                });
            } else if ($rootScope.user._id){
                // this is here so we can impersonate other users
                console.log($rootScope.user.email);
            } else if($rootScope.isMobile){
                //check if local store has a user on a mobile device
                var lsUser = $rootScope.getLocalUser();
                if(lsUser != undefined){
                    var User = $.user.byId;
                    User.get({id:lsUser._id}).$promise.then(function(user){
                        $rootScope.user={};
                        $rootScope.userInit(user);
                    });
                }
            } else if($cookieStore.get('user') != undefined){
                var cookieUser = $cookieStore.get('user');
                var User = $.user.byId;
                User.get({id:cookieUser._id}).$promise.then(function(user){
                    $rootScope.user={};
                    $rootScope.userInit(user);
                });
            } else if($rootScope.user == undefined || $rootScope.user._id == undefined){
                $rootScope.deepLink = false;
                $.forceCredentials();
            }
        } else { // it's a public route
            // check if the user is already a member and push them to welcome
            if(toState.name == 'app.signup'){
                if($rootScope.isMobile){
                    var lsUser = $rootScope.getLocalUser();
                    if(lsUser != undefined){
                        var User = $.user.byId;
                        User.get({id:lsUser._id}).$promise.then(function(user){
                            $rootScope.user={};
                            $rootScope.userInit(user);
                            $state.go("app.welcome");
                        });     
                    }
                } else {
                    var cookieUser = $cookieStore.get('user');
                    if(cookieUser != undefined){    
                        var User = $.user.byId;
                        User.get({id:cookieUser._id}).$promise.then(function(user){
                            $rootScope.user={};
                            $rootScope.userInit(user);
                            $state.go("app.welcome");
                        });              
                    }
                }
            }
        // else - it's a public route so let it go.
        }
    }
        
}]);