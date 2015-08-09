'use strict';

/**
* a service to manage users  
*/
angular.module('RevuMe')
//user resources - by email and by id
.factory('Users', ['$resource','baseUrl',function ($resource, baseUrl) {
    var _idTarget = baseUrl.endpoint+'/api/users/:id';
    var emailTarget = baseUrl.endpoint+'/api/users/email/:email';
    return {
        byId: $resource(_idTarget,
        {id:'@id'},
        {  update: {method:'PUT', params:{id:'@id'}}
        }),
        byEmail: $resource(emailTarget,
        {email:'@email'},
        {    update: {method:'PUT',params:{email:'@email'}}
        })
    };
}])
//get all users for a team
.factory('TeamUsers', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/teams/justUsers/:id';
    return $resource(target,
        {id:'@id'},
        {  update: {method:'PUT', params:{id:'@id'}}
        });
}])
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

.service('userService', ['Users','TeamUsers','pnFactory','$q','$ionicPopup','$ionicPopover','$rootScope','Base64', 
function (Users,TeamUsers,pnFactory,$q,$ionicPopup,$ionicPopover,$rootScope,Base64) {
    var $ = this;
    
    $.user = Users;
    //create a shell scope to use for the popover
    $.scope = $rootScope.$new();
    
    //show and hide the popover for a given directive
    $.directiveScope = undefined;
    $.creatingPopover = false;
    $.createPopover = function(){
        if($.popover == undefined && !$.creatingPopover){
            $.creatingPopover = true;
            $ionicPopover.fromTemplateUrl('templates/autocomplete.html', {
                scope: $.scope,
            }).then(function(pop) {
                $.creatingPopover = false;
                $.popover = pop;
            });
        }
    }
    //this holds the auto completed user
    $.autoUser = undefined;
    
    // some popover helper functions
    $.showPopover = function(scope,el){
        $.autoUser = undefined;
        $.directiveScope = scope;
        $.popover.show(el);
    }
    $.hidePopover = function(scope){
        if($.popover!=undefined)
            $.popover.hide();
        $.directiveScope = undefined;
    }
    $.removePopover = function(scope){
        if($.popover != undefined){
            $.popover.remove();
            $.popover = undefined;
            $.directiveScope = undefined;
        }
    }    
        
    // this is used by the directives and the templates to popup autocomplete candidates

    $.scope.auto = {entries:[]};
    $.setResults = function(results){
        $.scope.auto.entries = results;
    }
    $.getResults = function($index){
        if($.scope.auto.entries.length >0) 
            if($index < $.scope.auto.entries.length)
                return $.scope.auto.entries[$index];
    }
    //keep a list of callbacks from directives
    $.callBacks = [];
    //connect to autoComplete callback
    $.onAutoComplete = function(directiveScope){
        var cbPair = {
                key:directiveScope.instanceName,
                callBack:directiveScope.doFinish
            };
        
        $.callBacks.push(cbPair);            
    }
                
    $.doAutoComplete = function(directiveScope, $index){
        $.callBacks.forEach(function(cbPair){
            if(cbPair.key == directiveScope.instanceName)
                cbPair.callBack($index);
        });
    };
    
    $.scope.finishComplete = function($index){
        $.doAutoComplete($.directiveScope,$index);
        $.autoUser = $.getResults($index);
    };
    
    $.getAutoUser = function(){
        var u = angular.copy($.autoUser);
        $.autoUser = undefined;
        return u;
    }
    $.offAutoComplete = function(directiveScope){
        var found = [];
        for(var i = $.callBacks.length-1; i>=0 ; i--){
            if($.callBacks[i].key == directiveScope.instanceName)
                found.push(i);
        }
        found.forEach(function(index){
            $.callBacks.splice(index,1);
        });
    };
            
    //find users via a query
    $.find = function(query){
        return Users.byId.query(query).$promise;
    };
    
    //get all users
    $.getAll = function($scope){
        Users.byId.query().$promise.then(function(users){
            $scope.allUsers = users;
            $scope.user.email = 'klynch@volerro.com'
        });
    };
    //find just the users that are in my teams
    $.usersIKnow = function(query){
        if($rootScope.user._id != undefined){
            var userId = $rootScope.user._id;
            var sendQuery = {user:userId};
            for (var attrname in query){
                sendQuery[attrname] = query[attrname];
            }
            return Users.byId.query(sendQuery).$promise;
        } 
    }
    // old function for dropdown
    $.getUser = function($scope){
        var defer = $q.defer();
        $.getAll($scope);
          var myPopup = $ionicPopup.show({
//            template: '<input type="email" ng-model="user.email">',
            template: '<select ng-model="user.email"><option ng-repeat="user in allUsers">{{user.email}}</option></select>',
            title: 'Select Your Email',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                  if (!$scope.user.email) {
                    //don't allow the user to close unless he enters email
                    e.preventDefault();
                  } else {
                    return $scope.user.email;
                  }
                }
              }
            ]
          });
          myPopup.then(function(email) {
              return $.user.byEmail.get({email:email}).$promise;
          }).then(function(user){
              //user found return the user object
              if(user._id == undefined)
                  defer.reject('not found');
              defer.resolve(user);
          }).catch(function(err){
              defer.reject(err);
          });
        return defer.promise;
     };  
     //check if a user exists in the database
     $.checkExists = function(email){
        var defer = $q.defer();
        $.user.byEmail.get({email:email}).$promise.then(function(user){
            if(user._id == undefined)
                defer.resolve(false);
            else
                defer.resolve(true);
        }).catch(function(err){
            defer.reject(err);
        });
        return defer.promise;
     };
     // add a new user to the database
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
    //reset password
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
        
    $.register = function($scope){
         var defer = $q.defer();
         var usr = new $.user.byId;
          var myPopup = $ionicPopup.show({
            template: '<input type="name" placeholder="name" ng-model="user.name"><br><input type="email" placeholder="email" ng-model="user.email">',
            title: 'Register on Revu.Me',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                  if (!$scope.user.email||!$scope.user.name) {
                    //don't allow the user to close unless he enters email
                    e.preventDefault();
                  } else {
                    return $scope.user;
                  }
                }
              }
            ]
          });
          myPopup.then(function(user) {
              var names = user.name.split(" ");
              usr.email = user.email;
              usr.firstName = names[0];
              usr.lastName = names[1];
              $scope.user.firstName = usr.firstName;
              $scope.user.lastName = usr.lastName;
              usr.$save().then(function(u){
                  //user found return the user object
                  $scope.user._id=u._id;
                  defer.resolve($scope.user);
              }).catch(function(err){
                  defer.reject(err);
              });

            });
            return defer.promise;  
     };
}])

.service('userMonitor', ['$rootScope', function ($rootScope) {
    
    this.invited = []; // these are in the session - firstname, lastname
    this.present = []; // this is just a uuid firstname_lastname
    this.everyone = []; // add crashers to the list
    
    this.init = function(attendees){
        this.invited = attendees;
        this.invited.forEach(function(usr){
            usr.userName = usr.firstName+' '+usr.lastName;
            if(usr._id == $rootScope.user._id)
                usr.itsme = true;
            else
                usr.itsme = false;
        });
    };

    
    this.rollCall = function(m){
        var found = false;
        this.present = []
        var $present = this.present;
        this.invited.forEach(function(usr){
            if(usr._id == m.uuid){
                found = true;
                m.userName = usr.userName;
                if(m.action == 'join'){
                    usr.isOnline = true;
                    $present.push(usr);
                }
                else
                    usr.isOnline = false;
            }
        });
        if(!found)
            console.log('we need to add an intruder!');
        this.everyone= this.invited;
    }       
    
    this.noteEngagement = function(id,status){
        for(var i = 0; i < this.everyone.length; i++){
            if(this.everyone[i]._id == id){
                if(status == 'distracted'){
                    this.everyone[i].distracted = true;
                }else{
                    this.everyone[i].distracted = false;
                };
                
            }
        }
    };
                                        
    $rootScope.$on('$destroy',function(){
        $.scope.$destroy();
    })
}]);